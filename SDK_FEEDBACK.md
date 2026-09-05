# SDK feedback

Verified against installed `@somnia-chain/markets-sdk@0.28.1`, Node 24.9.0, and a real Shannon read spike on 5 September 2026.

## Corrections to the initial scaffold report

The previous report incorrectly suggested `createOrder` and the unified API had been replaced. Both unified and raw methods are present. The installed declarations and implementation, not a starter's preferred call style, are the source of truth.

## Verified API behavior

- `new SomniaMarkets({chain,addresses,indexerUrl,wsRpcUrl})` supports public reads without a key.
- `setSigner({walletClient})` binds an injected viem browser wallet; `setSigner({})` removes it.
- `loadMarkets(true)` returns unified rows; `isBinaryMarket(row.info)` narrows them.
- BTC and cadence use structured `asset` and `intervalSec` fields. Symbols are not used to guess cadence.
- Outcome symbols come from `row.outcomes` indices 0 and 1.
- `fetchOrderBook(outcomeSymbol,10)` returned real on-chain depth. Down symbols already convert prices.
- `priceToPrecision` and `amountToPrecision` use market grids loaded by the SDK.
- `createOrder(symbol,'limit','buy',quantity,price,{timeInForce:'IOC'})` is supported. Its implementation converts using integer units and defaults binary expiry to the pool's market expiry.
- `order.info` contains `PlaceOrderResult`: `hash`, `receipt`, `fills`. Fills are decoded from receipt events. WindowGuard derives actual quantity and VWAP from these, including Down price conversion.
- `client.getOutcomeBalance({outcomeToken,account,id})` uses an object argument.
- `trader.redeem` accepts `marketId`, `outcomeIdx`, `amount`, and optional wiring fields.
- `listBinaryMarkets` has a limit but no pagination offset. `listPastBinaryMarkets` provides limit/offset. WindowGuard currently scans only up to 120 recorded IDs and labels that scope.

## Runtime observations

Discovery and order books work without funding. Intermittent WebSocket request failures were observed in Chrome; stale snapshots block orders. Actual write receipts, wallet rejection, indexed-fill lag, and redemption remain untested without funded disposable wallets.

## Prioritized suggestions

1. Put the browser `setSigner` recipe beside the Node private-key starter.
2. Document the distinction between limited finalized lists and paginated past-market scans explicitly.
3. Provide a timeout/reconnect recipe for polling clients and a typed unified-order receipt helper.

References: [starter](https://github.com/IronicDeGawd/ec-dreamdex-hackathon-template), [Event Contracts docs](https://docs.dreamdex.io/developers/event-contracts), installed `dist/unified/exchange.d.ts`, `dist/unified/exchange.js`, `dist/trade.d.ts`, `dist/markets.d.ts`.
