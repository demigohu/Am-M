export const KEYSTORE = "0x6b8361C29d05D498b1a12B54A37310f94171E94A" as const;
export const TOKEN_U = "0xc70B8741B8B07A6d61E54fd4B20f22Fa648E5565" as const;

export const USDT = "0xA11c8D9DC9b66E209Ef60F0C8D969D3CD988782c" as const;
export const USDC = "0x16227D60f7a0e586C66B005219dfc887D13C9531" as const;
export const WBNB = "0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd" as const;
export const VUSDT = "0xb7526572FFE56AB9D7489838Bf2E18e3323b441A" as const;
export const VUSDC = "0xD5C4C2e2facBEB59D0216D0595d63FcDc6F9A1a7" as const;
export const VBNB = "0x2E7222e51c0f6e98610A1543Aa3836E092CDe62c" as const;

export const SELLERS: Record<string, `0x${string}`> = {
  guard: "0xDF977e03657B96C43663c28430274031266072b4",
  rebalance: "0x7f3FA089a0D2F0c48d7EcacF843a03D69793C878",
  grid: "0xB4E7De3592E237ceE295499f2D3d876A378698C6",
  yield: "0x670F9ECAfd03215cE3094097d8172bC3B212Fc6c",
};

export const SELLER_SET = new Set(
  Object.values(SELLERS).map((a) => a.toLowerCase()),
);

export const FIRST_PARTY_8004: { desk: string; id: number; wallet: `0x${string}` }[] = [
  { desk: "guard", id: 2056, wallet: SELLERS.guard! },
  { desk: "rebalance", id: 2057, wallet: SELLERS.rebalance! },
  { desk: "grid", id: 2058, wallet: SELLERS.grid! },
  { desk: "yield", id: 2059, wallet: SELLERS.yield! },
];

/** Mainnet context only — not execution. */
export const MAINNET = {
  vUsdt: "0xfD5840Cd36d94D72294328904f8A5d36a34b7F32" as const,
  wbnb: "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c" as const,
  usdt: "0x55d398326f99059fF775485246999027B3197955" as const,
  pcsPool: "0x36696169C63e42cd08ce11f5deeBbCeBae652570" as const, // WBNB/USDT 0.01%
};

export const DESKS = ["rebalance", "grid", "yield", "guard"] as const;
export type Desk = (typeof DESKS)[number];

export function isDesk(value: string): value is Desk {
  return (DESKS as readonly string[]).includes(value);
}
