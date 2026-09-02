import type { Session } from "@altananetwork/sdk";
import { USDT, VUSDT, WBNB, type Address } from "./addresses.js";
import {
  clipSwapSize,
  encodeExactInputSingle,
  encodeMintRange,
  encodeRebalanceOutOfRange,
  gridSpacingBps,
  rangeWidth,
  readLpPositions,
  readPool,
  tokenBalances,
} from "./pancake.js";
import {
  defaultNotionalWei,
  min,
  type ExecuteFn,
  type RiskProfile,
  type TickAction,
  type TickReport,
} from "./types.js";
import {
  encodeVenusMint,
  encodeVenusRepay,
  hfThreshold,
  maxSaveWei,
  readVenusAccount,
} from "./venus.js";

const lastGridTick = new Map<string, number>();

function snapshotVenus(account: Awaited<ReturnType<typeof readVenusAccount>>) {
  return {
    error: account.error.toString(),
    liquidity: account.liquidity.toString(),
    shortfall: account.shortfall.toString(),
    healthFactor: account.healthFactor,
    inMarkets: account.inMarkets,
    markets: account.markets.map((m) => ({
      symbol: m.symbol,
      vToken: m.vToken,
      supplied: m.underlyingSupplied.toString(),
      borrow: m.borrowStored.toString(),
      wallet: m.walletUnderlying.toString(),
      supplyAprApprox: m.supplyAprApprox,
    })),
  };
}

function finish(
  desk: TickReport["desk"],
  variant: RiskProfile,
  wallet: Address,
  snapshot: Record<string, unknown>,
  action: TickAction,
  execution?: TickReport["execution"],
): TickReport {
  return {
    desk,
    variant,
    wallet,
    at: new Date().toISOString(),
    snapshot,
    action,
    execution,
  };
}

function isNonceError(err: unknown): boolean {
  const msg = err instanceof Error ? `${err.message} ${err.cause ?? ""}` : String(err);
  return /InvalidNonce|nonce/i.test(msg);
}

async function maybeExecute(
  session: Session,
  execute: ExecuteFn,
  action: TickAction,
): Promise<TickReport["execution"] | undefined> {
  if (action.kind !== "execute") return undefined;
  const tries = 4;
  const delayMs = 5_000;
  let last: unknown;
  for (let i = 1; i <= tries; i++) {
    try {
      return await execute(session, action.calls, action.label);
    } catch (err) {
      last = err;
      if (!isNonceError(err) || i === tries) throw err;
      console.log(
        `[strategy.tick] InvalidNonce ${action.label} (percobaan ${i}/${tries}), tunggu ${delayMs / 1000}s…`,
      );
      await new Promise((done) => setTimeout(done, delayMs));
    }
  }
  throw last;
}

export function planGuard(
  variant: RiskProfile,
  account: Awaited<ReturnType<typeof readVenusAccount>>,
  notional: bigint,
): TickAction {
  const threshold = hfThreshold(variant);
  const cap = maxSaveWei(variant, notional);
  const hf = account.healthFactor;
  const needsSave =
    account.shortfall > 0n || (hf !== null && hf < threshold);

  if (needsSave) {
    const borrowed = [...account.markets]
      .filter((m) => m.borrowStored > 0n)
      .sort((a, b) => (a.borrowStored > b.borrowStored ? -1 : 1));
    if (borrowed[0]) {
      const m = borrowed[0];
      const repay = min(cap, min(m.borrowStored, m.walletUnderlying));
      if (repay === 0n) {
        return {
          kind: "blocked",
          reason: `HF ${hf ?? "<1"} di bawah ${threshold} tapi tidak ada underlying untuk repayBorrow (cap/izin/saldo).`,
        };
      }
      return {
        kind: "execute",
        label: "guard-repay",
        reason: `HF ${hf ?? "shortfall"} < ${threshold}: repayBorrow ${m.symbol} ${repay}.`,
        calls: [encodeVenusRepay(m.vToken, repay)],
      };
    }
    const supplier = [...account.markets]
      .filter((m) => m.walletUnderlying > 0n)
      .sort((a, b) => (a.walletUnderlying > b.walletUnderlying ? -1 : 1))[0];
    if (supplier) {
      const amount = min(cap, supplier.walletUnderlying);
      return {
        kind: "execute",
        label: "guard-mint",
        reason: `HF ${hf ?? "shortfall"} < ${threshold}: mint collateral ${supplier.symbol} ${amount}.`,
        calls: [encodeVenusMint(supplier.vToken, amount)],
      };
    }
    return {
      kind: "blocked",
      reason: `HF pecah (${hf ?? "shortfall"}) tapi session tidak punya saldo/izin untuk repay atau mint.`,
    };
  }

  const hasSupply = account.markets.some((m) => m.vTokenBalance > 0n);
  if (!hasSupply) {
    const usdt = account.markets.find((m) => m.vToken.toLowerCase() === VUSDT.toLowerCase());
    const amount = usdt ? min(cap, usdt.walletUnderlying) : 0n;
    if (amount === 0n) {
      return {
        kind: "blocked",
        reason:
          "Belum ada posisi Venus dan wallet tidak punya USDT untuk mint buffer. Danai akun lalu approve vUSDT.",
      };
    }
    return {
      kind: "execute",
      label: "guard-open",
      reason: `Tick pertama: mint vUSDT ${amount} sebagai buffer collateral.`,
      calls: [encodeVenusMint(VUSDT, amount)],
    };
  }

  return {
    kind: "noop",
    reason: `HF ${hf === null ? "n/a (tidak ada borrow)" : hf.toFixed(3)} ≥ ${threshold}; tidak perlu aksi.`,
  };
}

export function aprGap(variant: RiskProfile): number {
  return variant === "aggressive" ? 0.005 : 0.02;
}

export function planYield(
  variant: RiskProfile,
  account: Awaited<ReturnType<typeof readVenusAccount>>,
  notional: bigint,
): TickAction {
  const gap = aprGap(variant);
  const ranked = [...account.markets].sort(
    (a, b) => b.supplyAprApprox - a.supplyAprApprox,
  );
  const best = ranked[0];
  if (!best) {
    return { kind: "blocked", reason: "Tidak ada pasar Venus yang terbaca." };
  }

  // Each vToken has a different underlying. Session allowlist is mint/redeem
  // only — no swap — so park each idle asset in its matching market.
  const idle = ranked.find((m) => m.walletUnderlying > 0n && m.vTokenBalance === 0n);
  if (idle && idle.walletUnderlying > 0n) {
    const amount = min(notional, idle.walletUnderlying);
    if (amount > 0n) {
      return {
        kind: "execute",
        label: "yield-mint",
        reason: `Parkir ${idle.symbol} (APR tes ~${(idle.supplyAprApprox * 100).toFixed(2)}%).`,
        calls: [encodeVenusMint(idle.vToken, amount)],
      };
    }
  }

  const current = account.markets
    .filter((m) => m.vTokenBalance > 0n)
    .sort((a, b) => (a.underlyingSupplied > b.underlyingSupplied ? -1 : 1))[0];

  if (!current) {
    return {
      kind: "blocked",
      reason:
        "Tidak ada vToken dan tidak ada underlying (USDT/USDC/BNB) untuk mint. Rute testnet: Venus saja.",
    };
  }

  if (
    best.vToken.toLowerCase() !== current.vToken.toLowerCase() &&
    best.supplyAprApprox - current.supplyAprApprox >= gap
  ) {
    return {
      kind: "noop",
      reason: `${best.symbol} APR lebih tinggi (${(best.supplyAprApprox * 100).toFixed(2)}% vs ${(current.supplyAprApprox * 100).toFixed(2)}%), tapi pindah lintas underlying butuh swap. Allowlist hanya mint/redeem vToken — tidak di-execute.`,
    };
  }

  return {
    kind: "noop",
    reason: `Tetap di ${current.symbol}; selisih APR ke ${best.symbol} di bawah ambang ${(gap * 100).toFixed(2)}%.`,
  };
}

export async function planRebalance(
  variant: RiskProfile,
  owner: Address,
  notional: bigint,
): Promise<{ action: TickAction; snapshot: Record<string, unknown> }> {
  const [pool, positions, bal] = await Promise.all([
    readPool(),
    readLpPositions(owner),
    tokenBalances(owner),
  ]);
  const width = rangeWidth(variant);
  const snapshot = {
    tick: pool.tick,
    width,
    wbnb: bal.wbnb.toString(),
    usdt: bal.usdt.toString(),
    positions: positions.map((p) => ({
      tokenId: p.tokenId.toString(),
      tickLower: p.tickLower,
      tickUpper: p.tickUpper,
      liquidity: p.liquidity.toString(),
      inRange: p.inRange,
    })),
  };
  const live = positions.find((p) => p.liquidity > 0n);
  const amount0 =
    pool.token0.toLowerCase() === USDT.toLowerCase()
      ? min(notional, bal.usdt)
      : min(notional, bal.wbnb);
  const amount1 =
    pool.token1.toLowerCase() === USDT.toLowerCase()
      ? min(notional, bal.usdt)
      : min(notional, bal.wbnb);

  if (!live) {
    if (amount0 === 0n || amount1 === 0n) {
      return {
        snapshot,
        action: {
          kind: "blocked",
          reason:
            "Tidak ada NFT LP dan saldo WBNB/USDT(Venus) tidak cukup untuk mint. Seed pool + danai kedua token.",
        },
      };
    }
    return {
      snapshot,
      action: {
        kind: "execute",
        label: "rebalance-open",
        reason: `Buka LP WBNB/USDT fee 100 di tick ${pool.tick} ± ${width}.`,
        calls: [
          encodeMintRange({
            owner,
            pool,
            width,
            amount0,
            amount1,
          }),
        ],
      },
    };
  }

  if (live.inRange) {
    return {
      snapshot,
      action: {
        kind: "noop",
        reason: `NFT ${live.tokenId} in-range [${live.tickLower}, ${live.tickUpper}) @ ${pool.tick}.`,
      },
    };
  }

  return {
    snapshot,
    action: {
      kind: "execute",
      label: "rebalance-reset",
      reason: `NFT ${live.tokenId} out-of-range; reset ke tick ${pool.tick} ± ${width}.`,
      calls: encodeRebalanceOutOfRange({
        owner,
        tokenId: live.tokenId,
        liquidity: live.liquidity,
        pool,
        width,
        amount0: amount0 === 0n ? live.liquidity : amount0,
        amount1: amount1 === 0n ? live.liquidity : amount1,
      }),
    },
  };
}

export async function planGrid(
  variant: RiskProfile,
  owner: Address,
): Promise<{ action: TickAction; snapshot: Record<string, unknown> }> {
  const [pool, bal] = await Promise.all([readPool(), tokenBalances(owner)]);
  const key = owner.toLowerCase();
  const prev = lastGridTick.get(key);
  lastGridTick.set(key, pool.tick);
  const spacing = gridSpacingBps(variant);
  const snapshot = {
    tick: pool.tick,
    prevTick: prev ?? null,
    spacingBps: spacing,
    wbnb: bal.wbnb.toString(),
    usdt: bal.usdt.toString(),
  };
  if (prev === undefined) {
    const sellWbnb = clipSwapSize(variant, bal.wbnb);
    if (sellWbnb > 0n) {
      return {
        snapshot,
        action: {
          kind: "execute",
          label: "grid-seed-sell",
          reason: `Grid seed fill @ tick ${pool.tick}: jual ${sellWbnb} WBNB → USDT (testnet jarang geser ≥ ambang).`,
          calls: [
            encodeExactInputSingle({
              owner,
              tokenIn: WBNB,
              tokenOut: USDT,
              amountIn: sellWbnb,
            }),
          ],
        },
      };
    }
    const buyWbnb = clipSwapSize(variant, bal.usdt);
    if (buyWbnb > 0n) {
      return {
        snapshot,
        action: {
          kind: "execute",
          label: "grid-seed-buy",
          reason: `Grid seed fill @ tick ${pool.tick}: beli WBNB dengan ${buyWbnb} USDT.`,
          calls: [
            encodeExactInputSingle({
              owner,
              tokenIn: USDT,
              tokenOut: WBNB,
              amountIn: buyWbnb,
            }),
          ],
        },
      };
    }
    return {
      snapshot,
      action: {
        kind: "noop",
        reason: `Grid armed @ tick ${pool.tick}. Tidak ada WBNB/USDT untuk seed fill.`,
      },
    };
  }
  const delta = pool.tick - prev;
  const threshold = Math.max(1, Math.round((spacing / 10_000) * 200));
  if (delta <= -threshold) {
    const amountIn = clipSwapSize(variant, bal.usdt);
    if (amountIn === 0n) {
      return {
        snapshot,
        action: {
          kind: "blocked",
          reason: `Harga turun (tick ${prev} → ${pool.tick}) tapi tidak ada USDT untuk beli WBNB.`,
        },
      };
    }
    return {
      snapshot,
      action: {
        kind: "execute",
        label: "grid-buy",
        reason: `Tick ${prev} → ${pool.tick}: beli WBNB dengan ${amountIn} USDT.`,
        calls: [
          encodeExactInputSingle({
            owner,
            tokenIn: USDT,
            tokenOut: WBNB,
            amountIn,
          }),
        ],
      },
    };
  }
  if (delta >= threshold) {
    const amountIn = clipSwapSize(variant, bal.wbnb);
    if (amountIn === 0n) {
      return {
        snapshot,
        action: {
          kind: "blocked",
          reason: `Harga naik (tick ${prev} → ${pool.tick}) tapi tidak ada WBNB untuk dijual.`,
        },
      };
    }
    return {
      snapshot,
      action: {
        kind: "execute",
        label: "grid-sell",
        reason: `Tick ${prev} → ${pool.tick}: jual ${amountIn} WBNB ke USDT.`,
        calls: [
          encodeExactInputSingle({
            owner,
            tokenIn: WBNB,
            tokenOut: USDT,
            amountIn,
          }),
        ],
      },
    };
  }
  return {
    snapshot,
    action: {
      kind: "noop",
      reason: `Tick ${pool.tick} dalam grid (prev ${prev}, ambang ${threshold}).`,
    },
  };
}

export async function runGuardTick(opts: {
  session: Session;
  variant: RiskProfile;
  execute: ExecuteFn;
}): Promise<TickReport> {
  const wallet = opts.session.walletAddress;
  const account = await readVenusAccount(wallet);
  const action = planGuard(opts.variant, account, defaultNotionalWei());
  const execution = await maybeExecute(opts.session, opts.execute, action);
  return finish(
    "healthfactor",
    opts.variant,
    wallet,
    snapshotVenus(account),
    action,
    execution,
  );
}

export async function runYieldTick(opts: {
  session: Session;
  variant: RiskProfile;
  execute: ExecuteFn;
}): Promise<TickReport> {
  const wallet = opts.session.walletAddress;
  const account = await readVenusAccount(wallet);
  const action = planYield(opts.variant, account, defaultNotionalWei());
  const execution = await maybeExecute(opts.session, opts.execute, action);
  return finish(
    "yieldrouter",
    opts.variant,
    wallet,
    snapshotVenus(account),
    action,
    execution,
  );
}

export async function runRebalanceTick(opts: {
  session: Session;
  variant: RiskProfile;
  execute: ExecuteFn;
}): Promise<TickReport> {
  const wallet = opts.session.walletAddress;
  const planned = await planRebalance(opts.variant, wallet, defaultNotionalWei());
  const execution = await maybeExecute(opts.session, opts.execute, planned.action);
  return finish(
    "rebalancing",
    opts.variant,
    wallet,
    planned.snapshot,
    planned.action,
    execution,
  );
}

export async function runGridTick(opts: {
  session: Session;
  variant: RiskProfile;
  execute: ExecuteFn;
}): Promise<TickReport> {
  const wallet = opts.session.walletAddress;
  const planned = await planGrid(opts.variant, wallet);
  const execution = await maybeExecute(opts.session, opts.execute, planned.action);
  return finish(
    "gridtrading",
    opts.variant,
    wallet,
    planned.snapshot,
    planned.action,
    execution,
  );
}

export type DeskRunner = (opts: {
  session: Session;
  variant: RiskProfile;
  execute: ExecuteFn;
}) => Promise<TickReport>;
