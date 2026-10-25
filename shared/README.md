# The Crophecy mockup mock data

Placeholder brand "The Crophecy". Fictional but plausible numbers; "now" is
`MOCK.asOf = '2026-10-25'`. Everything is deterministic (seeded) except
`makeBetStream()`.

```html
<script src="../shared/mock-data.js"></script>
<script> const { agents, markets, regions } = window.MOCK; </script>
```

Brand: `MOCK.brand = {name, tagline, colors}`. Each page should keep its own
`const BRAND = {name, tagline}` (or CSS variables) so it can be swapped later.

## `MOCK.agents[8]`
`id, name, emoji, color, worldModel` (one-liner), `conviction` (paragraph),
`brier` (lower is better), `brierHard`, `brierSoft`, `pnl` (USDC),
`winRate` (0-1), `bets`, `pnlHistory[16]` (cumulative USDC, one per
quarter, labels in `MOCK.quarters`, Q1 23 to Q4 26; last point equals `pnl`).
Ids: `climate_pessimist, em_skeptic, geo_hawk, adapt_optimist,
macro_dollar, land_grab, agronomist, crowd_follower`.

## `MOCK.markets[24]` (14 hard, 10 soft, 4 resolved)
`id` (`m01..m11` hard open, `s01..s09` soft open, `r01..r04` resolved),
`title`, `type` (`hard|soft`), `commodity` (key of `MOCK.commodities`, hard
only), `topic` (soft only), `regions[]` (ids), `category`,
`status` (`open|resolved`), `yes` (0-1, YES price),
`probHistory[40]` (weekly YES prob, ends at `historyEnd`, step
`historyStepDays`=7; `MOCK.historyDates(m)` gives ISO dates),
`change7d` / `change24h` (percentage points), `volume`, `volume24h`,
`liquidity` (USDC), `traders`, `createdAt`, `endDate`, `resolutionSource`,
`description`, `spot` (hard markets: current reference value), `tags`,
`dir` (+1: YES means more stress/higher price, -1: YES means relief),
`agentEstimate` (stake-weighted agent consensus), `positions[8]`:
`{agentId, side, estimate, stake, avgPrice, rationale, pnl?}`.
Resolved markets also have `outcome` (`YES|NO`), `resolvedAt`,
`resolvedValue`, `holdout: true`; their positions carry `pnl`.

## `MOCK.commodities`
`wheat, olive_oil, maize, coffee, cocoa, sugar, sunflower_oil, rice`, each
`{label, emoji, color, unit}`.

## `MOCK.regions[20]`
`id, name, country, lat, lng, crop, kind` (`production|capital_origin`),
`risk` (0-1; 0 for capital origins), `commodities[]`, `fund` (USDC
allocation, sums to `fund.balance`), `note`. Capital origins `riyadh` and
`abu_dhabi` have `flowsTo: [{regionId, usd}]` for arcs.

## `MOCK.fund`
`balance` (USDC), `currency`, `cutBps` (share of volume, 100 = 1%),
`allTimeVolume`, `inflows[12]` (`{month, amount}`), `inflows12m`,
`allocation[]` (`{regionId, amount, share}`, sorted desc), `disbursed[]`
(`{regionId, amount, date, purpose}`).

## `MOCK.users[30]`
`id, nick, rank, pnl, winRate, bets, streak, joined, country,
favCommodity`, sorted by rank (PnL).

## `MOCK.backtest`
Sealed-holdout result: `trainCutoff, holdoutWindow, holdoutQuestions,
shownMarketIds, baselines {marketPrice, coinFlip}`, `solana`
(`cluster:'devnet', program, sealTx, sealSlot, sealedAt, merkleRoot,
revealTx, revealSlot, revealedAt, note, explorer {seal, reveal}`), and
`perAgent[]` (`agentId, brier, brierHard, brierSoft, logLoss,
calibration[5] {predicted, observed, n}`).

## Live bets
```js
const stream = MOCK.makeBetStream({ minMs: 300, maxMs: 1500, mutate: true });
const off = stream.on(bet => { /* render */ });
stream.start();  // emits every 300-1500 ms; stream.stop() to pause
stream.next();   // emit one bet immediately
MOCK.recentBets(40); // newest-first array for first paint, no side effects
```
With `mutate: true` (default) each bet also updates the live `market.yes`,
`volume` and `volume24h`. Bet shape: `id, ts, actorType`
(`agent|external_agent|human`), `actorId, actorName, actorColor,
actorEmoji, marketId, marketTitle, side` (`YES|NO`), `stake` (USDC),
`priceBefore, priceAfter, priceImpact` (percentage points of YES),
`rationale` (one line), `tx` (fake Solana signature).

## Helpers
`MOCK.getAgent(id)`, `getMarket(id)`, `getRegion(id)`,
`MOCK.fmt.{usd, compact, pct, cents}`. Maps and globes can load from CDNs
(Leaflet, MapLibre, globe.gl, d3-geo + world-atlas on jsdelivr).
