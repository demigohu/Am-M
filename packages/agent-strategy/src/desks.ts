import type { Session } from "@altananetwork/sdk";
import { encodeFunctionData } from "viem";
import { COMPTROLLER, USDC, USDT, VUSDT, WBNB, type Address } from "./addresses.js";
import {
  min,
  type ExecuteFn,
  type RiskProfile,
  type TickAction,
  type TickReport,
} from "./types.js";
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
import { fetchCorePoolMarkets, filterYieldSessionMarkets } from "./venus-api.js";
import {
  encodeVenusNativeSwapAndSupply,
  encodeVenusSwapAndSupply,
  pickFundingToken,
} from "./venus-swap.js";
import {
  fmtApyPct,
  isNativeVToken,
  notionalForMarket,
  readYieldAccount,
  snapshotYield,
  walletBalanceForMarket,
  type YieldAccount,
} from "./yield-account.js";
import {
  DEFAULT_STABLE_NOTIONAL,
  defaultNotionalForToken,
} from "./decimals.js";
import {
  clipPlanAmount,
  spendCapBlockedReason,
  spendTargetForToken,
} from "./plan-amount.js";
import { clipToSessionSpend, summarizeSessionPolicy } from "./session-policy.js";
import { COMPTROLLER_ABI } from "./abi.js";
import {
  encodeVenusMint,
  encodeVenusRedeemUnderlying,
  encodeVenusRepay,
  hfThreshold,
  maxSaveWei,
  readVenusAccount,
} from "./venus.js";

const lastGridTick = new Map<string, number>();

function tokenLabel(token: Address): string {
  const lower = token.toLowerCase();
  if (lower === USDT.toLowerCase()) return "USDT";
  if (lower === USDC.toLowerCase()) return "USDC";
  if (lower === WBNB.toLowerCase()) return "WBNB";
  return token;
}

function encodeEnterMarket(vToken: Address) {
  return {
    to: COMPTROLLER,
    data: encodeFunctionData({
      abi: COMPTROLLER_ABI,
      functionName: "enterMarkets",
      args: [[vToken]],
    }),
  };
}

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
    wbnbWallet: account.wbnbWallet.toString(),
  };
}

function finish(
  desk: TickReport["desk"],
  variant: RiskProfile,
  wallet: Address,
  snapshot: Record<string, unknown>,
  action: TickAction,
  execution?: TickReport["execution"],
  sessionPolicy?: TickReport["sessionPolicy"],
): TickReport {
  return {
    desk,
    variant,
    wallet,
    at: new Date().toISOString(),
    snapshot,
    action,
    execution,
    sessionPolicy,
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
        `[strategy.tick] InvalidNonce ${action.label} (attempt ${i}/${tries}), waiting ${delayMs / 1000}s…`,
      );
      await new Promise((done) => setTimeout(done, delayMs));
    }
  }
  throw last;
}

export function planGuard(
  variant: RiskProfile,
  account: Awaited<ReturnType<typeof readVenusAccount>>,
  session?: Session,
): TickAction {
  const threshold = hfThreshold(variant);
  const cap = maxSaveWei(variant, DEFAULT_STABLE_NOTIONAL);
  const hf = account.healthFactor;
  const needsSave =
    account.shortfall > 0n || (hf !== null && hf < threshold);

  if (needsSave) {
    const borrowed = [...account.markets]
      .filter((m) => m.borrowStored > 0n)
      .sort((a, b) => (a.borrowStored > b.borrowStored ? -1 : 1));
    if (borrowed[0]) {
      const m = borrowed[0];
      const target = spendTargetForToken(m.underlying, m.native);
      const repay = clipPlanAmount(
        session,
        min(cap, min(m.borrowStored, m.walletUnderlying)),
        target,
      );
      if (repay === 0n) {
        return {
          kind: "blocked",
          reason:
            hf !== null && hf < threshold
              ? `HF ${hf.toFixed(3)} below ${threshold} but no underlying to repay (cap/balance).`
              : spendCapBlockedReason(target),
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
      const target = spendTargetForToken(supplier.underlying, supplier.native);
      const amount = clipPlanAmount(
        session,
        min(cap, supplier.walletUnderlying),
        target,
      );
      if (amount === 0n) {
        return {
          kind: "blocked",
          reason: spendCapBlockedReason(target),
        };
      }
      return {
        kind: "execute",
        label: "guard-mint",
        reason: `HF ${hf ?? "shortfall"} < ${threshold}: mint collateral ${supplier.symbol} ${amount}.`,
        calls: [encodeVenusMint(supplier.vToken, amount)],
      };
    }
    return {
      kind: "blocked",
      reason: `HF broken (${hf ?? "shortfall"}) but session has no balance/permission to repay or mint.`,
    };
  }

  const hasSupply = account.markets.some((m) => m.vTokenBalance > 0n);
  if (!hasSupply) {
    const usdt = account.markets.find((m) => m.vToken.toLowerCase() === VUSDT.toLowerCase());
    const target = spendTargetForToken(USDT, false);
    const amount = usdt
      ? clipPlanAmount(session, min(cap, usdt.walletUnderlying), target)
      : 0n;
    if (amount === 0n) {
      return {
        kind: "blocked",
        reason:
          "No Venus position and wallet has no USDT for buffer mint. Fund the vault and approve vUSDT.",
      };
    }
    return {
      kind: "execute",
      label: "guard-open",
      reason: `First tick: mint vUSDT ${amount} as collateral buffer.`,
      calls: [encodeVenusMint(VUSDT, amount)],
    };
  }

  return {
    kind: "noop",
    reason: `HF ${hf === null ? "n/a (no borrow)" : hf.toFixed(3)} ≥ ${threshold}; no action needed.`,
  };
}

export function aprGap(variant: RiskProfile): number {
  return variant === "aggressive" ? 0.005 : 0.02;
}

export function planYield(
  variant: RiskProfile,
  account: YieldAccount,
  owner: Address,
  session?: Session,
): TickAction {
  const gap = aprGap(variant);
  const best = account.ranked[0];
  if (!best) {
    return { kind: "blocked", reason: "No Venus Core Pool markets from API." };
  }

  const spendCapReason = (symbol: string) =>
    `Blocked: daily session spend cap reached for ${symbol}. Revoke or re-hire with a higher cap.`;

  const current = account.positions[0];
  const bestWallet = walletBalanceForMarket(best, account.wallet);

  // 1) Exit lower-APR position when gap clears threshold.
  if (
    current &&
    current.vToken.toLowerCase() !== best.vToken.toLowerCase() &&
    best.supplyApy - current.supplyApy >= gap
  ) {
    const amount = min(
      notionalForMarket(current, variant),
      current.underlyingSupplied,
    );
    if (amount > 0n) {
      return {
        kind: "execute",
        label: "yield-exit",
        reason: `Redeem ${current.symbol} (${fmtApyPct(current.supplyApy)}%) toward ${best.symbol} (${fmtApyPct(best.supplyApy)}%).`,
        calls: [encodeVenusRedeemUnderlying(current.vToken, amount)],
      };
    }
  }

  // 2) Direct mint when wallet already holds the best underlying.
  if (bestWallet > 0n) {
    let amount = min(notionalForMarket(best, variant), bestWallet);
    amount = clipToSessionSpend(session, amount, {
      token: best.native ? undefined : best.underlying,
      native: best.native,
    });
    if (amount === 0n) {
      return {
        kind: "blocked",
        reason: spendCapReason(best.native ? "native" : tokenLabel(best.underlying)),
      };
    }
    if (amount > 0n) {
      const calls = [];
      if (
        !account.inMarkets.some(
          (v) => v.toLowerCase() === best.vToken.toLowerCase(),
        )
      ) {
        calls.push(encodeEnterMarket(best.vToken));
      }
      calls.push(
        encodeVenusMint(
          best.vToken,
          isNativeVToken(best.vToken) ? amount : amount,
        ),
      );
      return {
        kind: "execute",
        label: "yield-mint",
        reason: `Mint ${best.symbol} (${fmtApyPct(best.supplyApy)}% APR, top Core Pool).`,
        calls,
      };
    }
  }

  // 3) Venus SwapRouter — swap + supply in one tx.
  const funding = pickFundingToken(best, account.wallet);
  if (funding && funding.balance > 0n) {
    let amount = min(notionalForMarket(best, variant), funding.balance);
    amount = clipToSessionSpend(session, amount, {
      token: funding.payNative ? undefined : funding.token,
      native: funding.payNative,
    });
    if (amount === 0n) {
      return {
        kind: "blocked",
        reason: spendCapReason(
          funding.payNative ? "native" : tokenLabel(funding.token),
        ),
      };
    }
    const calls = [];
    if (
      !account.inMarkets.some(
        (v) => v.toLowerCase() === best.vToken.toLowerCase(),
      )
    ) {
      calls.push(encodeEnterMarket(best.vToken));
    }

    let swapCall;
    if (funding.payNative) {
      swapCall = encodeVenusNativeSwapAndSupply({
        owner,
        market: best,
        amountIn: amount,
      });
    } else {
      swapCall = encodeVenusSwapAndSupply({
        owner,
        market: best,
        tokenIn: funding.token,
        amountIn: amount,
      });
    }

    if (swapCall) {
      calls.push(swapCall);
      return {
        kind: "execute",
        label: "yield-swap-supply",
        reason: `Venus SwapRouter: deploy toward ${best.symbol} (${fmtApyPct(best.supplyApy)}% APR, top Core Pool).`,
        calls,
      };
    }
  }

  if (
    current &&
    current.vToken.toLowerCase() === best.vToken.toLowerCase()
  ) {
    return {
      kind: "noop",
      reason: `Parked in ${best.symbol}; top Core Pool APR ${fmtApyPct(best.supplyApy)}%.`,
    };
  }

  const hasFunds =
    account.wallet.usdt > 0n ||
    account.wallet.usdc > 0n ||
    account.wallet.wbnb > 0n ||
    account.wallet.bnb > 0n;

  if (!current && !hasFunds) {
    return {
      kind: "blocked",
      reason:
        "No Venus supply and no USDT/USDC/BNB to deploy. Fund the wallet, approve Venus + SwapRouter.",
    };
  }

  return {
    kind: "noop",
    reason: current
      ? `Hold ${current.symbol}; APR gap to ${best.symbol} below ${(gap * 100).toFixed(2)}% threshold.`
      : `Awaiting route to ${best.symbol} (${fmtApyPct(best.supplyApy)}%) or mid-tx settle.`,
  };
}

function legAmount(
  session: Session | undefined,
  token: Address,
  balance: bigint,
): bigint {
  return clipPlanAmount(
    session,
    balance,
    spendTargetForToken(token, false),
    defaultNotionalForToken(token),
  );
}

export async function planRebalance(
  variant: RiskProfile,
  owner: Address,
  session?: Session,
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
  const bal0 =
    pool.token0.toLowerCase() === USDT.toLowerCase() ? bal.usdt : bal.wbnb;
  const bal1 =
    pool.token1.toLowerCase() === USDT.toLowerCase() ? bal.usdt : bal.wbnb;
  const amount0 = legAmount(session, pool.token0, bal0);
  const amount1 = legAmount(session, pool.token1, bal1);

  if (!live) {
    if (amount0 === 0n || amount1 === 0n) {
      return {
        snapshot,
        action: {
          kind: "blocked",
          reason:
            "No LP NFT and insufficient WBNB/USDT balance to mint. Seed the pool and fund both tokens.",
        },
      };
    }
    return {
      snapshot,
      action: {
        kind: "execute",
        label: "rebalance-open",
        reason: `Open WBNB/USDT fee-100 LP at tick ${pool.tick} ± ${width}.`,
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
      reason: `NFT ${live.tokenId} out-of-range; reset to tick ${pool.tick} ± ${width}.`,
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

function gridSwapAmount(
  session: Session | undefined,
  variant: RiskProfile,
  tokenIn: Address,
  available: bigint,
): bigint {
  const desired = clipSwapSize(variant, available);
  return clipPlanAmount(
    session,
    desired,
    spendTargetForToken(tokenIn, false),
    defaultNotionalForToken(tokenIn),
  );
}

export async function planGrid(
  variant: RiskProfile,
  owner: Address,
  session?: Session,
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
    const sellWbnb = gridSwapAmount(session, variant, WBNB, bal.wbnb);
    if (sellWbnb > 0n) {
      return {
        snapshot,
        action: {
          kind: "execute",
          label: "grid-seed-sell",
          reason: `Grid seed fill @ tick ${pool.tick}: sell ${sellWbnb} WBNB → USDT.`,
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
    const buyWbnb = gridSwapAmount(session, variant, USDT, bal.usdt);
    if (buyWbnb > 0n) {
      return {
        snapshot,
        action: {
          kind: "execute",
          label: "grid-seed-buy",
          reason: `Grid seed fill @ tick ${pool.tick}: buy WBNB with ${buyWbnb} USDT.`,
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
        reason: `Grid armed @ tick ${pool.tick}. No WBNB/USDT for seed fill.`,
      },
    };
  }
  const delta = pool.tick - prev;
  const threshold = Math.max(1, Math.round((spacing / 10_000) * 200));
  if (delta <= -threshold) {
    const amountIn = gridSwapAmount(session, variant, USDT, bal.usdt);
    if (amountIn === 0n) {
      return {
        snapshot,
        action: {
          kind: "blocked",
          reason: `Price down (tick ${prev} → ${pool.tick}) but no USDT to buy WBNB.`,
        },
      };
    }
    return {
      snapshot,
      action: {
        kind: "execute",
        label: "grid-buy",
        reason: `Tick ${prev} → ${pool.tick}: buy WBNB with ${amountIn} USDT.`,
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
    const amountIn = gridSwapAmount(session, variant, WBNB, bal.wbnb);
    if (amountIn === 0n) {
      return {
        snapshot,
        action: {
          kind: "blocked",
          reason: `Price up (tick ${prev} → ${pool.tick}) but no WBNB to sell.`,
        },
      };
    }
    return {
      snapshot,
      action: {
        kind: "execute",
        label: "grid-sell",
        reason: `Tick ${prev} → ${pool.tick}: sell ${amountIn} WBNB for USDT.`,
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
      reason: `Tick ${pool.tick} within grid band (prev ${prev}, threshold ${threshold}).`,
    },
  };
}

export async function runGuardTick(opts: {
  session: Session;
  variant: RiskProfile;
  execute: ExecuteFn;
}): Promise<TickReport> {
  const wallet = opts.session.walletAddress;
  const sessionPolicy = await summarizeSessionPolicy(opts.session);
  const account = await readVenusAccount(wallet);
  const action = planGuard(opts.variant, account, opts.session);
  const execution = await maybeExecute(opts.session, opts.execute, action);
  return finish(
    "healthfactor",
    opts.variant,
    wallet,
    snapshotVenus(account),
    action,
    execution,
    sessionPolicy,
  );
}

export async function runYieldTick(opts: {
  session: Session;
  variant: RiskProfile;
  execute: ExecuteFn;
}): Promise<TickReport> {
  const wallet = opts.session.walletAddress;
  const sessionPolicy = await summarizeSessionPolicy(opts.session);
  let ranked;
  try {
    ranked = filterYieldSessionMarkets(await fetchCorePoolMarkets());
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return finish(
      "yieldrouter",
      opts.variant,
      wallet,
      { error: msg },
      {
        kind: "blocked",
        reason: `Venus API unavailable: ${msg}`,
      },
      undefined,
      sessionPolicy,
    );
  }
  const account = await readYieldAccount(wallet, ranked);
  const action = planYield(opts.variant, account, wallet, opts.session);
  const execution = await maybeExecute(opts.session, opts.execute, action);
  return finish(
    "yieldrouter",
    opts.variant,
    wallet,
    snapshotYield(account),
    action,
    execution,
    sessionPolicy,
  );
}

export async function runRebalanceTick(opts: {
  session: Session;
  variant: RiskProfile;
  execute: ExecuteFn;
}): Promise<TickReport> {
  const wallet = opts.session.walletAddress;
  const sessionPolicy = await summarizeSessionPolicy(opts.session);
  const planned = await planRebalance(opts.variant, wallet, opts.session);
  const execution = await maybeExecute(opts.session, opts.execute, planned.action);
  return finish(
    "rebalancing",
    opts.variant,
    wallet,
    planned.snapshot,
    planned.action,
    execution,
    sessionPolicy,
  );
}

export async function runGridTick(opts: {
  session: Session;
  variant: RiskProfile;
  execute: ExecuteFn;
}): Promise<TickReport> {
  const wallet = opts.session.walletAddress;
  const sessionPolicy = await summarizeSessionPolicy(opts.session);
  const planned = await planGrid(opts.variant, wallet, opts.session);
  const execution = await maybeExecute(opts.session, opts.execute, planned.action);
  return finish(
    "gridtrading",
    opts.variant,
    wallet,
    planned.snapshot,
    planned.action,
    execution,
    sessionPolicy,
  );
}

export type DeskRunner = (opts: {
  session: Session;
  variant: RiskProfile;
  execute: ExecuteFn;
}) => Promise<TickReport>;
