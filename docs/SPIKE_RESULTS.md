# WindowGuard verification, 5 September 2026

## Installed versions

Node 24.9.0, npm 11.6.0, markets-sdk 0.28.1, Next.js 15.5.25. The committed lockfile records all transitive versions.

## Real read spike

Command: `npm run discover` (read-only, no wallet required).

The SDK discovered BTC five-minute market `0x000000000000000000000000000000000000000000000000000000000001424a`.

- Symbol: `BTC-7963595-05SEP26-1130/tUSDC`
- Pool: `0x3F7df92F1B73A0DE7be9d51B031ace9769f7a6A1`
- Market address: `0xcab4b894C0497e1AbE3C3cbb3bD73C6DB078E6E7`
- On-chain status: Trading (1)
- Expiry: 1788607800 Unix seconds
- Up asks: 200 at 0.515, 330 at 0.525, 460 at 0.536
- Up bids: 200 at 0.485, 330 at 0.474, 460 at 0.464
- Outcome symbols end in `#YES` and `#NO`; the SDK handles Down conversion.

This is historical evidence from one observed window, never a current market constant.

## Browser checks

Production server on localhost:3100, Chrome:

- Real market `…014286`, Trading, changing odds and snapshot age.
- Maximum 0.1 with quantity 5 produced `INSUFFICIENT_DEPTH`, zero quantity available, and a disabled submission button.
- A delayed snapshot produced `STALE_BOOK` and blocked submission.
- Switching to Down cleared the old book before rendering a Down book.
- At expiry, `WINDOW_CLOSING` prevented submission.
- The next live market `…014292` appeared with a new book. Old market data was discarded.
- Mobile layout inspected at 390 × 844. A 9-pixel navigation overflow was found and corrected; deployed recheck recorded separately.

## Automated verification

30 tests pass, including fresh pre-submit blocks, generation changes, actual partial fills, zero-fill confirmation, reverted receipts, wrong-outcome books, invalid timestamps, and per-level price protection. TypeScript and production compilation pass. ESLint is a separate real check (the original scaffold incorrectly aliased lint to typecheck).

## Outstanding live evidence

No `.env.local` with disposable funded wallets was present. No real order, approval, mint, cancellation, or redemption has been sent by this session. No transaction hash or payout has been invented.

Read feasibility: PASS. Write feasibility: PENDING funded wallet. Overall spike is not yet GO under the original brief, which requires a real IOC transaction.

## Observed limitations

The testnet WebSocket intermittently returns `getBookLevels` request failures. The UI expires snapshots and offers reconnect. Indexer discovery can have noticeable startup latency. Exact latency distribution and indexed-fill lag have not been measured.
