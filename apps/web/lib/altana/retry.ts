export const NONCE_RETRY_TRIES = 4;
export const NONCE_RETRY_DELAY_MS = 5_000;

export function sleep(ms: number): Promise<void> {
  return new Promise((done) => setTimeout(done, ms));
}

export function isNonceError(err: unknown): boolean {
  const msg = err instanceof Error ? `${err.message} ${err.cause ?? ""}` : String(err);
  return /InvalidNonce|nonce/i.test(msg);
}

export async function withNonceRetry<T>(fn: () => Promise<T>): Promise<T> {
  let last: unknown;
  for (let i = 1; i <= NONCE_RETRY_TRIES; i++) {
    try {
      return await fn();
    } catch (err) {
      last = err;
      if (!isNonceError(err) || i === NONCE_RETRY_TRIES) throw err;
      await sleep(NONCE_RETRY_DELAY_MS);
    }
  }
  throw last;
}
