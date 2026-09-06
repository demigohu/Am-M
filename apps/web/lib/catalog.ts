export type DeskSlug = "rebalance" | "grid" | "yield" | "guard";
export type StatusTone = "green" | "amber" | "char";

export type Desk = {
  slug: DeskSlug;
  code: string;
  name: string;
  mark: string;
  color: string;
  job: string;
  blurb: string;
  protocol: string;
  protocolHref: string;
  listingsLabel: string;
};

export type Agent = {
  id: string;
  name: string;
  desk: DeskSlug;
  variant: string;
  listed: boolean;
  /** ERC-8183 list price from studio.toml, 18-decimal $U wei. */
  priceWei: string;
  status: string;
  statusTone: StatusTone;
  reputation: number | null;
  liveMetric: string;
  liveHint: string;
  pair: string;
  inRange?: string;
  lastAction: string;
  wallet: `0x${string}`;
  registryId: number;
  endpoint: string;
  strategyUrl: string;
  summary: string;
  engine: string;
  executes: string;
  firstAction: string;
  firstActionCode: string;
  allowed: string[];
  rejected: string[];
};

/** 0.1 $U — `[payments.erc8183].price` on every seller. */
export const LIST_PRICE_WEI = "100000000000000000";

export const DESKS: Desk[] = [
  {
    slug: "rebalance",
    code: "DSK-01",
    name: "Rebalance",
    mark: "LP RANGE",
    color: "bg-desk-rebalance",
    job: "Keeps a PancakeSwap v3 WBNB/USDT (Venus) fee-100 LP in range on BSC testnet.",
    blurb:
      "One seller process. Out of range → decreaseLiquidity + collect + burn + mint a new range around the current tick. Pair is WBNB/USDT Venus testnet, not Pancake mock USDT.",
    protocol: "PancakeSwap v3 NFPM",
    protocolHref: "https://pancakeswap.finance",
    listingsLabel: "2 SELLERS",
  },
  {
    slug: "grid",
    code: "DSK-02",
    name: "Grid",
    mark: "SWAP GRID",
    color: "bg-desk-grid",
    job: "Synthetic buy-the-dip / sell-the-rip on PancakeSwap v3 SwapRouter.",
    blurb:
      "No on-chain limit orders. Swaps clipped size on WBNB/USDT (Venus) fee 100 when the pool tick moves past the variant spacing.",
    protocol: "PancakeSwap v3 SwapRouter",
    protocolHref: "https://pancakeswap.finance",
    listingsLabel: "2 SELLERS",
  },
  {
    slug: "yield",
    code: "DSK-03",
    name: "Yield",
    mark: "VENUS PARK",
    color: "bg-desk-yield",
    job: "Routes wallet funds to the top Venus Core Pool vToken by testnet APR.",
    blurb:
      "Ranks ~46 Core Pool markets via Venus API, rotates with Venus SwapRouter. Testnet APR on /strategy — not mainnet context.",
    protocol: "Venus Core Pool (testnet)",
    protocolHref: "https://app.venus.io",
    listingsLabel: "2 SELLERS",
  },
  {
    slug: "guard",
    code: "DSK-04",
    name: "Guard",
    mark: "HF WATCH",
    color: "bg-desk-guard",
    job: "If Venus health factor breaks the variant floor, repayBorrow or mint inside the cap.",
    blurb:
      "A transaction, not an alert. Deliverable is the rescue tx hash or an honest cap/permission failure.",
    protocol: "Venus Comptroller (testnet)",
    protocolHref: "https://app.venus.io",
    listingsLabel: "2 SELLERS",
  },
];

export const AGENTS: Agent[] = [
  {
    id: "rebalancing",
    name: "rebalancing-agent",
    desk: "rebalance",
    variant: "conservative",
    listed: true,
    priceWei: LIST_PRICE_WEI,
    status: "Idle",
    statusTone: "amber",
    reputation: null,
    liveMetric: "awaiting session",
    liveHint: "Live · /strategy",
    pair: "WBNB / USDT (Venus) fee 100",
    lastAction: "—",
    wallet: "0x7f3FA089a0D2F0c48d7EcacF843a03D69793C878",
    registryId: 2057,
    endpoint: "https://rebalancing.ammlabs.fun/",
    strategyUrl: "https://rebalancing.ammlabs.fun/strategy",
    summary:
      "Keep a PancakeSwap V3 WBNB/USDT(Venus) fee-100 LP in range. Out of range → decreaseLiquidity + collect + burn + mint a new range.",
    engine: "packages/agent-strategy · runRebalanceTick",
    executes:
      "Reads the fee-100 pool at 0xced0…887c. If no LP NFT, mints around current tick. If the NFT is out of range, resets it. Inventory stays in your Altana vault.",
    firstAction: "After grant, the next tick mints a range if WBNB and USDT are in the vault.",
    firstActionCode:
      "nfpm.mint({ token0, token1, fee: 100, tickLower, tickUpper, recipient: vault })",
    allowed: [
      "nfpm.mint((address,address,uint24,int24,int24,uint256,uint256,uint256,uint256,address,uint256))",
      "nfpm.increaseLiquidity((uint256,uint256,uint256,uint256,uint256,uint256))",
      "nfpm.decreaseLiquidity((uint256,uint128,uint256,uint256,uint256))",
      "nfpm.collect((uint256,address,uint128,uint128))",
      "nfpm.burn(uint256)",
    ],
    rejected: ["approve", "transfer", "transferFrom", "withdraw"],
  },
  {
    id: "gridtrading",
    name: "gridtrading-agent",
    desk: "grid",
    variant: "conservative",
    listed: true,
    priceWei: LIST_PRICE_WEI,
    status: "Idle",
    statusTone: "amber",
    reputation: null,
    liveMetric: "awaiting session",
    liveHint: "Live · /strategy",
    pair: "WBNB / USDT (Venus) fee 100",
    lastAction: "—",
    wallet: "0xB4E7De3592E237ceE295499f2D3d876A378698C6",
    registryId: 2058,
    endpoint: "https://gridtrading.ammlabs.fun/",
    strategyUrl: "https://gridtrading.ammlabs.fun/strategy",
    summary:
      "Synthetic buy-the-dip / sell-the-rip on PancakeSwap V3 SwapRouter. Pair WBNB/USDT(Venus) fee 100.",
    engine: "packages/agent-strategy · runGridTick",
    executes:
      "Compares the pool tick to the last fill. Past the variant spacing, swaps a clipped size via exactInputSingle. Often noop until the tick moves.",
    firstAction: "Arms the grid. First swap only fires after the pool tick crosses the spacing.",
    firstActionCode:
      "swapRouter.exactInputSingle({ tokenIn, tokenOut, fee: 100, recipient: vault })",
    allowed: [
      "swapRouter.exactInputSingle((address,address,uint24,address,uint256,uint256,uint256,uint160))",
    ],
    rejected: ["approve", "transfer", "transferFrom", "withdraw"],
  },
  {
    id: "yieldrouter",
    name: "yieldrouter-agent",
    desk: "yield",
    variant: "conservative",
    listed: true,
    priceWei: LIST_PRICE_WEI,
    status: "Idle",
    statusTone: "amber",
    reputation: null,
    liveMetric: "awaiting session",
    liveHint: "Live · /strategy",
    pair: "vUSDT / vUSDC / vBNB",
    lastAction: "—",
    wallet: "0x670F9ECAfd03215cE3094097d8172bC3B212Fc6c",
    registryId: 2059,
    endpoint: "https://yieldrouter.ammlabs.fun/",
    strategyUrl: "https://yieldrouter.ammlabs.fun/strategy",
    summary:
      "Route wallet funds to the top Venus Core Pool vToken by testnet APR. Rotates via Venus SwapRouter when the gap exceeds the variant threshold.",
    engine: "packages/agent-strategy · runYieldTick",
    executes:
      "Mints the matching vToken for idle USDT, USDC, or BNB. Will not swap across underlyings — that is outside the session allowlist.",
    firstAction: "Next tick mints vUSDT/vUSDC/vBNB if matching underlying sits idle in the vault.",
    firstActionCode: "vToken.mint(amount) · vBNB.mint{value}()",
    allowed: [
      "vUSDT/vUSDC.mint(uint256)",
      "vBNB.mint()",
      "redeem(uint256)",
      "redeemUnderlying(uint256)",
      "comptroller.enterMarkets(address[])",
    ],
    rejected: ["approve", "repayBorrow", "exactInputSingle", "transfer"],
  },
  {
    id: "healthfactor",
    name: "healthfactor-agent",
    desk: "guard",
    variant: "conservative",
    listed: true,
    priceWei: LIST_PRICE_WEI,
    status: "Idle",
    statusTone: "amber",
    reputation: null,
    liveMetric: "awaiting session",
    liveHint: "Live · /strategy",
    pair: "Venus account",
    lastAction: "—",
    wallet: "0xDF977e03657B96C43663c28430274031266072b4",
    registryId: 2056,
    endpoint: "https://healthfactor.ammlabs.fun/",
    strategyUrl: "https://healthfactor.ammlabs.fun/strategy",
    summary:
      "If Venus HF on BSC testnet drops below the variant threshold, repayBorrow or mint inside the session cap. Deliverable includes the rescue tx hash or an honest cap/permission failure — not an alert.",
    engine: "packages/agent-strategy · runGuardTick",
    executes:
      "Reads Comptroller account liquidity. Below the floor it repayBorrows the largest debt, or mints collateral if repay inventory is missing.",
    firstAction: "Next tick reads HF. If already above the floor, noop. If not, repay or mint.",
    firstActionCode: "vToken.repayBorrow(amount) or vToken.mint(amount)",
    allowed: [
      "vToken.mint(uint256) / mint()",
      "vToken.repayBorrow(uint256) / repayBorrow()",
      "vToken.redeem(uint256)",
      "comptroller.enterMarkets(address[])",
    ],
    rejected: ["approve", "transfer", "transferFrom", "withdraw"],
  },
  {
    id: "rebalancingagg",
    name: "rebalancing-agent-aggressive",
    desk: "rebalance",
    variant: "aggressive",
    listed: true,
    priceWei: LIST_PRICE_WEI,
    status: "Idle",
    statusTone: "amber",
    reputation: null,
    liveMetric: "awaiting session",
    liveHint: "Live · /strategy",
    pair: "WBNB / USDT (Venus) fee 100",
    lastAction: "—",
    wallet: "0x0000000000000000000000000000000000000000",
    registryId: 0,
    endpoint: "https://rebalancingagg.ammlabs.fun/",
    strategyUrl: "https://rebalancingagg.ammlabs.fun/strategy",
    summary:
      "Aggressive LP range (width 60). Resets faster when price leaves the band — higher turnover, tighter range.",
    engine: "packages/agent-strategy · runRebalanceTick · AGENT_VARIANT=aggressive",
    executes:
      "Same NFPM flow as conservative, but mints a narrow range (width 60 vs 200). More frequent rebalance when tick drifts.",
    firstAction: "After grant, the next tick mints a tight range if WBNB and USDT are in the vault.",
    firstActionCode:
      "nfpm.mint({ token0, token1, fee: 100, tickLower, tickUpper, recipient: vault })",
    allowed: [
      "nfpm.mint((address,address,uint24,int24,int24,uint256,uint256,uint256,uint256,address,uint256))",
      "nfpm.increaseLiquidity((uint256,uint256,uint256,uint256,uint256,uint256))",
      "nfpm.decreaseLiquidity((uint256,uint128,uint256,uint256,uint256))",
      "nfpm.collect((uint256,address,uint128,uint128))",
      "nfpm.burn(uint256)",
    ],
    rejected: ["approve", "transfer", "transferFrom", "withdraw"],
  },
  {
    id: "gridtradingagg",
    name: "gridtrading-agent-aggressive",
    desk: "grid",
    variant: "aggressive",
    listed: true,
    priceWei: LIST_PRICE_WEI,
    status: "Idle",
    statusTone: "amber",
    reputation: null,
    liveMetric: "awaiting session",
    liveHint: "Live · /strategy",
    pair: "WBNB / USDT (Venus) fee 100",
    lastAction: "—",
    wallet: "0x0000000000000000000000000000000000000000",
    registryId: 0,
    endpoint: "https://gridtradingagg.ammlabs.fun/",
    strategyUrl: "https://gridtradingagg.ammlabs.fun/strategy",
    summary:
      "Tighter synthetic grid (80 bps spacing, ~20% clip). More fills when the pool tick moves.",
    engine: "packages/agent-strategy · runGridTick · AGENT_VARIANT=aggressive",
    executes:
      "Swaps on 80 bps tick moves (vs 200 bps conservative) with up to ~20% inventory per leg.",
    firstAction: "Arms the grid. First swap fires after a smaller tick move than conservative.",
    firstActionCode:
      "swapRouter.exactInputSingle({ tokenIn, tokenOut, fee: 100, recipient: vault })",
    allowed: [
      "swapRouter.exactInputSingle((address,address,uint24,address,uint256,uint256,uint256,uint160))",
    ],
    rejected: ["approve", "transfer", "transferFrom", "withdraw"],
  },
  {
    id: "yieldrouteragg",
    name: "yieldrouter-agent-aggressive",
    desk: "yield",
    variant: "aggressive",
    listed: true,
    priceWei: LIST_PRICE_WEI,
    status: "Idle",
    statusTone: "amber",
    reputation: null,
    liveMetric: "awaiting session",
    liveHint: "Live · /strategy",
    pair: "vUSDT / vUSDC / vBNB",
    lastAction: "—",
    wallet: "0x0000000000000000000000000000000000000000",
    registryId: 0,
    endpoint: "https://yieldrouteragg.ammlabs.fun/",
    strategyUrl: "https://yieldrouteragg.ammlabs.fun/strategy",
    summary:
      "Rotates Venus Core Pool positions when APR gap ≥ 0.5% (vs 2% conservative). Chases yield faster.",
    engine: "packages/agent-strategy · runYieldTick · AGENT_VARIANT=aggressive",
    executes:
      "Ranks Core Pool markets via Venus API. Exits and enters when the APR spread exceeds 0.5%.",
    firstAction: "Next tick mints or rotates if a better vToken beats the current position by ≥ 0.5%.",
    firstActionCode: "vToken.redeem(uint256) · vToken.mint(amount)",
    allowed: [
      "vUSDT/vUSDC.mint(uint256)",
      "vBNB.mint()",
      "redeem(uint256)",
      "redeemUnderlying(uint256)",
      "comptroller.enterMarkets(address[])",
    ],
    rejected: ["approve", "repayBorrow", "exactInputSingle", "transfer"],
  },
  {
    id: "healthfactoragg",
    name: "healthfactor-agent-aggressive",
    desk: "guard",
    variant: "aggressive",
    listed: true,
    priceWei: LIST_PRICE_WEI,
    status: "Idle",
    statusTone: "amber",
    reputation: null,
    liveMetric: "awaiting session",
    liveHint: "Live · /strategy",
    pair: "Venus account",
    lastAction: "—",
    wallet: "0x0000000000000000000000000000000000000000",
    registryId: 0,
    endpoint: "https://healthfactoragg.ammlabs.fun/",
    strategyUrl: "https://healthfactoragg.ammlabs.fun/strategy",
    summary:
      "HF floor 1.2 (vs 1.5 conservative). Uses full session cap on rescue — acts earlier with more size.",
    engine: "packages/agent-strategy · runGuardTick · AGENT_VARIANT=aggressive",
    executes:
      "Repay or mint when HF drops below 1.2. Rescue size uses the full daily cap instead of ~20%.",
    firstAction: "Next tick reads HF. Below 1.2 → repay largest debt or mint collateral at full cap.",
    firstActionCode: "vToken.repayBorrow(amount) or vToken.mint(amount)",
    allowed: [
      "vToken.mint(uint256) / mint()",
      "vToken.repayBorrow(uint256) / repayBorrow()",
      "vToken.redeem(uint256)",
      "comptroller.enterMarkets(address[])",
    ],
    rejected: ["approve", "transfer", "transferFrom", "withdraw"],
  },
];

/** @deprecated Hire/checkout use `agent.wallet` per listing. Kept for desk-level docs only. */
export const DESK_PROVIDER: Record<DeskSlug, `0x${string}`> = {
  rebalance: "0x7f3FA089a0D2F0c48d7EcacF843a03D69793C878",
  grid: "0xB4E7De3592E237ceE295499f2D3d876A378698C6",
  yield: "0x670F9ECAfd03215cE3094097d8172bC3B212Fc6c",
  guard: "0xDF977e03657B96C43663c28430274031266072b4",
};

const ID_ALIASES: Record<string, string> = {
  "equilibrium-bnb": "rebalancing",
  "multi-asset-dynamic": "rebalancing",
  "range-bound-cake": "gridtrading",
  "bnb-asymmetric": "gridtrading",
  "venus-vault-router": "yieldrouter",
  "liquid-staking-auto": "yieldrouter",
  "margin-sentinel": "healthfactor",
  "rebalancing-aggressive": "rebalancingagg",
  "gridtrading-aggressive": "gridtradingagg",
  "yieldrouter-aggressive": "yieldrouteragg",
  "healthfactor-aggressive": "healthfactoragg",
};

export function deskBySlug(slug: string): Desk | undefined {
  return DESKS.find((d) => d.slug === slug);
}

export function agentById(id: string): Agent | undefined {
  const resolved = ID_ALIASES[id] ?? id;
  return AGENTS.find((a) => a.id === resolved);
}

export function agentsForDesk(slug: DeskSlug): Agent[] {
  return AGENTS.filter((a) => a.desk === slug);
}

export function deskOf(agent: Agent): Desk {
  const desk = deskBySlug(agent.desk);
  if (!desk) throw new Error(`Unknown desk ${agent.desk}`);
  return desk;
}
