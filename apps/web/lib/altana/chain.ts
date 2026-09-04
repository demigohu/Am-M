import { encodeFunctionData, type Address, type Hex } from "viem";
import type { SessionPermissions } from "@altananetwork/sdk";
import type { DeskSlug } from "../catalog";

export const CHAIN_ID = 97;
export const RPC_URL = "https://bsc-testnet-rpc.publicnode.com";
export const EXPLORER = "https://testnet.bscscan.com";
export const ALTANA_EXPLORER = "https://testnet.altana.network";
export const SCAN_8004 = "https://8004scan.io";
export const FAUCET_TBNB = "https://www.bnbchain.org/en/testnet-faucet";
export const FAUCET_U = "https://united-coin-u.github.io/u-faucet/";

export function urlBscAddress(address: string): string {
  return `${EXPLORER}/address/${address}`;
}

export function urlBscTx(hash: string): string {
  return `${EXPLORER}/tx/${hash}`;
}

export const COMPTROLLER = "0x94d1820b2D1c7c7452A163983Dc888CEC546b77D" as Address;
export const VUSDT = "0xb7526572FFE56AB9D7489838Bf2E18e3323b441A" as Address;
export const USDT = "0xA11c8D9DC9b66E209Ef60F0C8D969D3CD988782c" as Address;
export const VUSDC = "0xD5C4C2e2facBEB59D0216D0595d63FcDc6F9A1a7" as Address;
export const USDC = "0x16227D60f7a0e586C66B005219dfc887D13C9531" as Address;
export const VBNB = "0x2E7222e51c0f6e98610A1543Aa3836E092CDe62c" as Address;
export const WBNB = "0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd" as Address;
export const PCS_NFPM = "0x427bF5b37357632377eCbEC9de3626C71A5396c1" as Address;
export const PCS_SWAP_ROUTER = "0x1b81D678ffb9C0263b24A97847620C99d213eB14" as Address;
export const TOKEN_U = "0xc70B8741B8B07A6d61E54fd4B20f22Fa648E5565" as Address;

export const SIG = {
  venusMint: "mint(uint256)",
  venusMintBnb: "mint()",
  venusRedeem: "redeem(uint256)",
  venusRedeemUnderlying: "redeemUnderlying(uint256)",
  venusRepay: "repayBorrow(uint256)",
  venusRepayBnb: "repayBorrow()",
  pcsMint:
    "mint((address,address,uint24,int24,int24,uint256,uint256,uint256,uint256,address,uint256))",
  pcsIncrease: "increaseLiquidity((uint256,uint256,uint256,uint256,uint256,uint256))",
  pcsDecrease: "decreaseLiquidity((uint256,uint128,uint256,uint256,uint256))",
  pcsCollect: "collect((uint256,address,uint128,uint128))",
  pcsBurn: "burn(uint256)",
  pcsExactInputSingle:
    "exactInputSingle((address,address,uint24,address,uint256,uint256,uint256,uint160))",
  venusEnterMarkets: "enterMarkets(address[])",
} as const;

const DAY_USDT = 100n * 10n ** 18n;
const DAY_NATIVE = 10n ** 17n;
export const MAX_UINT256 = (1n << 256n) - 1n;
export const SESSION_DAYS = 30;
export const MIN_NATIVE_WEI = 2n * 10n ** 16n; // 0.02 tBNB
export const WRAP_WEI = 2n * 10n ** 16n;

export const ERC20_ABI = [
  {
    type: "function",
    name: "balanceOf",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "allowance",
    stateMutability: "view",
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "approve",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ type: "bool" }],
  },
] as const;

export const COMPTROLLER_ABI = [
  {
    type: "function",
    name: "getAssetsIn",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ type: "address[]" }],
  },
  {
    type: "function",
    name: "enterMarkets",
    stateMutability: "nonpayable",
    inputs: [{ name: "vTokens", type: "address[]" }],
    outputs: [{ type: "uint256[]" }],
  },
] as const;

export const WBNB_DEPOSIT_ABI = [
  {
    type: "function",
    name: "deposit",
    stateMutability: "payable",
    inputs: [],
    outputs: [],
  },
] as const;

export type RelayCall = { to: Address; data: Hex; value?: bigint };

export function permissionsForDesk(desk: DeskSlug): SessionPermissions {
  if (desk === "rebalance") {
    return {
      calls: [
        { to: PCS_NFPM, signature: SIG.pcsMint },
        { to: PCS_NFPM, signature: SIG.pcsIncrease },
        { to: PCS_NFPM, signature: SIG.pcsDecrease },
        { to: PCS_NFPM, signature: SIG.pcsCollect },
        { to: PCS_NFPM, signature: SIG.pcsBurn },
      ],
      spend: [
        { token: USDT, limit: DAY_USDT, period: "day" },
        { token: WBNB, limit: DAY_USDT, period: "day" },
        { limit: DAY_NATIVE, period: "day" },
      ],
    };
  }
  if (desk === "grid") {
    return {
      calls: [{ to: PCS_SWAP_ROUTER, signature: SIG.pcsExactInputSingle }],
      spend: [
        { token: USDT, limit: DAY_USDT, period: "day" },
        { token: WBNB, limit: DAY_USDT, period: "day" },
        { limit: DAY_NATIVE, period: "day" },
      ],
    };
  }
  if (desk === "yield") {
    return {
      calls: [
        { to: VUSDT, signature: SIG.venusMint },
        { to: VUSDC, signature: SIG.venusMint },
        { to: VBNB, signature: SIG.venusMintBnb },
        { to: VUSDT, signature: SIG.venusRedeem },
        { to: VUSDC, signature: SIG.venusRedeem },
        { to: VBNB, signature: SIG.venusRedeem },
        { to: VUSDT, signature: SIG.venusRedeemUnderlying },
        { to: VUSDC, signature: SIG.venusRedeemUnderlying },
        { to: VBNB, signature: SIG.venusRedeemUnderlying },
        { to: COMPTROLLER, signature: SIG.venusEnterMarkets },
      ],
      spend: [
        { token: USDT, limit: DAY_USDT, period: "day" },
        { token: USDC, limit: DAY_USDT, period: "day" },
        { limit: DAY_NATIVE, period: "day" },
      ],
    };
  }
  return {
    calls: [
      { to: VUSDT, signature: SIG.venusMint },
      { to: VUSDC, signature: SIG.venusMint },
      { to: VBNB, signature: SIG.venusMintBnb },
      { to: VUSDT, signature: SIG.venusRepay },
      { to: VUSDC, signature: SIG.venusRepay },
      { to: VBNB, signature: SIG.venusRepayBnb },
      { to: VUSDT, signature: SIG.venusRedeem },
      { to: VUSDC, signature: SIG.venusRedeem },
      { to: VBNB, signature: SIG.venusRedeem },
      { to: COMPTROLLER, signature: SIG.venusEnterMarkets },
    ],
    spend: [
      { token: USDT, limit: DAY_USDT, period: "day" },
      { token: USDC, limit: DAY_USDT, period: "day" },
      { limit: DAY_NATIVE, period: "day" },
    ],
  };
}

export function protocolOfDesk(desk: DeskSlug): { label: string; address: Address } {
  if (desk === "rebalance") return { label: "PancakeSwap v3 NFPM", address: PCS_NFPM };
  if (desk === "grid") return { label: "PancakeSwap v3 SwapRouter", address: PCS_SWAP_ROUTER };
  if (desk === "yield") return { label: "Venus Comptroller", address: COMPTROLLER };
  return { label: "Venus Comptroller", address: COMPTROLLER };
}

function approveCall(token: Address, spender: Address): RelayCall {
  return {
    to: token,
    data: encodeFunctionData({
      abi: ERC20_ABI,
      functionName: "approve",
      args: [spender, MAX_UINT256],
    }),
  };
}

export function encodeEnterMarkets(): RelayCall {
  return {
    to: COMPTROLLER,
    data: encodeFunctionData({
      abi: COMPTROLLER_ABI,
      functionName: "enterMarkets",
      args: [[VUSDT, VUSDC, VBNB]],
    }),
  };
}

export function encodeWrapNative(): RelayCall {
  return {
    to: WBNB,
    data: encodeFunctionData({ abi: WBNB_DEPOSIT_ABI, functionName: "deposit" }),
    value: WRAP_WEI,
  };
}

export function encodeApprove(token: Address, spender: Address): RelayCall {
  return approveCall(token, spender);
}
