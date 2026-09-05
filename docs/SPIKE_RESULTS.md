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

## Write evidence

- Maker gas funding to taker: `0x49e6a102cec4ce399217093052acda3c7a9f580ce55f2529e1ac539bf2162bd9`.
- Maker tUSDC faucet: `0xf0370f10e87676c8a59d653485ea92918211b5e5b95a59805a906bf8917f7033`.
- Taker tUSDC faucet: `0x727204916be6e6e66fd3344d1dd423ea256aa20229a29979f81258f3072d08ed`.
- IOC trade: `0x9892c5460eadc7aadf0b3d5ca4763fecdda6a9026c8e62823231c6e8220b6b61`. Requested and filled 0.01 Up at actual VWAP 0.804, equal to the expected average and below the 0.99 maximum.
- Complete-set mint for a deterministic claim candidate: `0x8ea11666df3ec0c1d64c8580b606d95b938f0d3f2ccce687151fe2501f8c1631` in market `0x000000000000000000000000000000000000000000000000000000000001430e`.
- Resolution: status 4, Up winner, raw Up balance 10000.
- Redemption: `0x37a82ed068c2abb6e0f2960a6cbfc52bfa4fdddb0ad898c6b7fca26d9e870b22`. The application selected only outcome 0, required a successful receipt, and verified the winning outcome balance became zero.

Read feasibility: PASS. Write feasibility: PASS. Spike decision: GO.

## Observed limitations

The testnet WebSocket intermittently returns `getBookLevels` request failures. The UI expires snapshots and offers reconnect. Indexer discovery can have noticeable startup latency. Receipt events supplied the tested fill immediately; indexed-fill lag was not needed or measured.
