import { index, onchainTable } from "ponder";

export const hirePayment = onchainTable(
  "hire_payment",
  (t) => ({
    id: t.text().primaryKey(),
    txHash: t.hex().notNull(),
    from: t.hex().notNull(),
    to: t.hex().notNull(),
    value: t.bigint().notNull(),
    blockNumber: t.bigint().notNull(),
    timestamp: t.bigint().notNull(),
  }),
  (table) => ({
    toIdx: index().on(table.to),
    fromIdx: index().on(table.from),
  }),
);

export const keystoreKey = onchainTable(
  "keystore_key",
  (t) => ({
    id: t.text().primaryKey(),
    wallet: t.hex().notNull(),
    keyId: t.hex().notNull(),
    sessionId: t.text(),
    valid: t.boolean().notNull(),
    expiry: t.bigint().notNull(),
    checkedAt: t.bigint().notNull(),
  }),
  (table) => ({
    walletIdx: index().on(table.wallet),
  }),
);

export const agentExecution = onchainTable(
  "agent_execution",
  (t) => ({
    id: t.text().primaryKey(),
    sessionId: t.text().notNull(),
    wallet: t.hex().notNull(),
    txHash: t.hex().notNull(),
    target: t.hex().notNull(),
    value: t.bigint().notNull(),
    recipientsVerified: t.boolean().notNull(),
    timestamp: t.bigint().notNull(),
    blockNumber: t.bigint().notNull(),
  }),
  (table) => ({
    sessionIdx: index().on(table.sessionId),
    walletIdx: index().on(table.wallet),
  }),
);

export const positionSnapshot = onchainTable(
  "position_snapshot",
  (t) => ({
    id: t.text().primaryKey(),
    sessionId: t.text().notNull(),
    wallet: t.hex().notNull(),
    vUsdtUnderlying: t.bigint().notNull(),
    vUsdcUnderlying: t.bigint().notNull(),
    vBnbUnderlying: t.bigint().notNull(),
    takenAt: t.bigint().notNull(),
  }),
  (table) => ({
    sessionIdx: index().on(table.sessionId),
  }),
);

export const marketContext = onchainTable("market_context", (t) => ({
  id: t.text().primaryKey(),
  venusUsdtAprBps: t.integer().notNull(),
  pcsTick: t.integer().notNull(),
  pcsLiquidity: t.bigint().notNull(),
  takenAt: t.bigint().notNull(),
  label: t.text().notNull(),
}));

export const registryAgent = onchainTable("registry_agent", (t) => ({
  id: t.text().primaryKey(),
  chainId: t.integer().notNull(),
  tokenId: t.integer().notNull(),
  desk: t.text().notNull(),
  hireable: t.boolean().notNull(),
  name: t.text(),
  payload: t.json(),
  updatedAt: t.bigint().notNull(),
}));
