/** BSC testnet (97) addresses verified in docs/referensitechspec.md §1.1. */

export const BSC_TESTNET_CHAIN_ID = 97;
export const RPC_URL =
  process.env.BNB_TESTNET_RPC_URL ??
  "https://bsc-testnet-rpc.publicnode.com";

export const COMPTROLLER =
  "0x94d1820b2D1c7c7452A163983Dc888CEC546b77D" as const;
export const VUSDT = "0xb7526572FFE56AB9D7489838Bf2E18e3323b441A" as const;
export const USDT = "0xA11c8D9DC9b66E209Ef60F0C8D969D3CD988782c" as const;
export const VUSDC = "0xD5C4C2e2facBEB59D0216D0595d63FcDc6F9A1a7" as const;
export const USDC = "0x16227D60f7a0e586C66B005219dfc887D13C9531" as const;
export const VBNB = "0x2E7222e51c0f6e98610A1543Aa3836E092CDe62c" as const;
export const WBNB = "0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd" as const;

export const PCS_NFPM =
  "0x427bF5b37357632377eCbEC9de3626C71A5396c1" as const;
export const PCS_SWAP_ROUTER =
  "0x1b81D678ffb9C0263b24A97847620C99d213eB14" as const;
export const PCS_FACTORY =
  "0x0BFbCF9fa4f9C56B0F40a671Ad40E0805A091865" as const;
export const PCS_POOL_WBNB_USDT =
  "0xced0844e421f856d2de472f9e7037f873987887c" as const;
export const PCS_FEE_WBNB_USDT = 100;

export const VTOKENS = [
  { vToken: VUSDT, underlying: USDT, symbol: "vUSDT", native: false },
  { vToken: VUSDC, underlying: USDC, symbol: "vUSDC", native: false },
  { vToken: VBNB, underlying: WBNB, symbol: "vBNB", native: true },
] as const;

export type Address = `0x${string}`;

/** Canonical Altana session allowlist signatures (expanded structs, not `(...)`). */
export const SIG = {
  venusMint: "mint(uint256)",
  venusMintBnb: "mint()",
  venusRedeem: "redeem(uint256)",
  venusRedeemUnderlying: "redeemUnderlying(uint256)",
  venusRepay: "repayBorrow(uint256)",
  venusRepayBnb: "repayBorrow()",
  pcsMint:
    "mint((address,address,uint24,int24,int24,uint256,uint256,uint256,uint256,address,uint256))",
  pcsIncrease:
    "increaseLiquidity((uint256,uint256,uint256,uint256,uint256,uint256))",
  pcsDecrease:
    "decreaseLiquidity((uint256,uint128,uint256,uint256,uint256))",
  pcsCollect: "collect((uint256,address,uint128,uint128))",
  pcsBurn: "burn(uint256)",
  pcsExactInputSingle:
    "exactInputSingle((address,address,uint24,address,uint256,uint256,uint256,uint160))",
  erc20Approve: "approve(address,uint256)",
  venusEnterMarkets: "enterMarkets(address[])",
} as const;
