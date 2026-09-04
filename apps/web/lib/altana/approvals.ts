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
