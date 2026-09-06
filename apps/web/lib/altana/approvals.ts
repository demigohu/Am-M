import type { Address } from "viem";
import type { DeskSlug } from "../catalog";
import {
  COMPTROLLER,
  COMPTROLLER_ABI,
  encodeApprove,
  encodeEnterMarkets,
  encodeWrapNative,
  ERC20_ABI,
  MIN_NATIVE_WEI,
  PCS_NFPM,
  PCS_SWAP_ROUTER,
  USDC,
  USDT,
  VBNB,
  VUSDC,
  VUSDT,
  WBNB,
  WRAP_WEI,
  type RelayCall,
} from "./chain";
import { publicClient } from "./rpc";
import { VENUS_SWAP_ROUTER } from "./yieldAllowlist";

export async function adminCallsForDesk(
  desk: DeskSlug,
  wallet: Address,
): Promise<RelayCall[]> {
  const native = await publicClient.getBalance({ address: wallet });
  const calls: RelayCall[] = [];

  if (desk === "rebalance" || desk === "grid") {
    const spender = desk === "rebalance" ? PCS_NFPM : PCS_SWAP_ROUTER;
    const [usdtAllow, wbnbAllow, wbnbBal] = await Promise.all([
      publicClient.readContract({
        address: USDT,
        abi: ERC20_ABI,
        functionName: "allowance",
        args: [wallet, spender],
      }),
      publicClient.readContract({
        address: WBNB,
        abi: ERC20_ABI,
        functionName: "allowance",
        args: [wallet, spender],
      }),
      publicClient.readContract({
        address: WBNB,
        abi: ERC20_ABI,
        functionName: "balanceOf",
        args: [wallet],
      }),
    ]);
    if (wbnbBal === 0n && native >= MIN_NATIVE_WEI + WRAP_WEI) {
      calls.push(encodeWrapNative());
    }
    if (usdtAllow === 0n) calls.push(encodeApprove(USDT, spender));
    if (wbnbAllow === 0n) calls.push(encodeApprove(WBNB, spender));
    return calls;
  }

  if (desk === "guard") {
    const [usdtAllow, usdcAllow, inMarkets] = await Promise.all([
      publicClient.readContract({
        address: USDT,
        abi: ERC20_ABI,
        functionName: "allowance",
        args: [wallet, VUSDT],
      }),
      publicClient.readContract({
        address: USDC,
        abi: ERC20_ABI,
        functionName: "allowance",
        args: [wallet, VUSDC],
      }),
      publicClient.readContract({
        address: COMPTROLLER,
        abi: COMPTROLLER_ABI,
        functionName: "getAssetsIn",
        args: [wallet],
      }),
    ]);
    const entered = new Set(inMarkets.map((a) => a.toLowerCase()));
    if (usdtAllow === 0n) calls.push(encodeApprove(USDT, VUSDT));
    if (usdcAllow === 0n) calls.push(encodeApprove(USDC, VUSDC));
    if (
      !entered.has(VUSDT.toLowerCase()) ||
      !entered.has(VUSDC.toLowerCase()) ||
      !entered.has(VBNB.toLowerCase())
    ) {
      calls.push(encodeEnterMarkets());
    }
    return calls;
  }

  if (desk === "yield") {
    const [usdtAllowV, usdcAllowV, usdtAllowSwap, wbnbAllowSwap, wbnbBal, inMarkets] =
      await Promise.all([
        publicClient.readContract({
          address: USDT,
          abi: ERC20_ABI,
          functionName: "allowance",
          args: [wallet, VUSDT],
        }),
        publicClient.readContract({
          address: USDC,
          abi: ERC20_ABI,
          functionName: "allowance",
          args: [wallet, VUSDC],
        }),
        publicClient.readContract({
          address: USDT,
          abi: ERC20_ABI,
          functionName: "allowance",
          args: [wallet, VENUS_SWAP_ROUTER],
        }),
        publicClient.readContract({
          address: WBNB,
          abi: ERC20_ABI,
          functionName: "allowance",
          args: [wallet, VENUS_SWAP_ROUTER],
        }),
        publicClient.readContract({
          address: WBNB,
          abi: ERC20_ABI,
          functionName: "balanceOf",
          args: [wallet],
        }),
        publicClient.readContract({
          address: COMPTROLLER,
          abi: COMPTROLLER_ABI,
          functionName: "getAssetsIn",
          args: [wallet],
        }),
      ]);
    const entered = new Set(inMarkets.map((a) => a.toLowerCase()));
    if (wbnbBal === 0n && native >= MIN_NATIVE_WEI + WRAP_WEI) {
      calls.push(encodeWrapNative());
    }
    if (usdtAllowV === 0n) calls.push(encodeApprove(USDT, VUSDT));
    if (usdcAllowV === 0n) calls.push(encodeApprove(USDC, VUSDC));
    if (usdtAllowSwap === 0n) calls.push(encodeApprove(USDT, VENUS_SWAP_ROUTER));
    if (wbnbAllowSwap === 0n) calls.push(encodeApprove(WBNB, VENUS_SWAP_ROUTER));
    if (
      !entered.has(VUSDT.toLowerCase()) ||
      !entered.has(VUSDC.toLowerCase()) ||
      !entered.has(VBNB.toLowerCase())
    ) {
      calls.push(encodeEnterMarkets());
    }
    return calls;
  }

  return calls;
}
