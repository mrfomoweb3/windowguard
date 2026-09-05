import type { MarketId, TrackedMarket } from "../../lib/types";
export const A = (`0x${"a".repeat(64)}`) as MarketId;
export const B = (`0x${"b".repeat(64)}`) as MarketId;
export const market = (marketId=A):TrackedMarket=>({marketId,symbol:"BTC-5M",upSymbol:"BTC-UP",downSymbol:"BTC-DOWN",asset:"BTC",cadenceSec:300,venueId:"dreamdex",pool:"0x1111111111111111111111111111111111111111",marketAddress:"0x2222222222222222222222222222222222222222",outcomeToken:"0x3333333333333333333333333333333333333333",yesId:1n,noId:2n,expirySec:2_000,status:"TRADING",firstSeenAtMs:0,lastSeenAtMs:0});
