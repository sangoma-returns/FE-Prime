# Detailed Component Specificiation

## 1. Scope and intent
This document is an exhaustive frontend component specification for the current code in this repository.

It is designed to support backend implementation by explicitly documenting:
- Every page-level and shared FE component.
- Every major interactive control path (button/input -> handler -> state/service calls -> system impact).
- Which interactions are currently UI-only vs. which already call APIs/stores.
- Full exported component inventory (including UI primitives).

Conventions used below:
- `UI Control`: visible button/input/toggle/list action.
- `Handler`: function directly bound in JSX.
- `Calls`: store methods / hooks / API functions.
- `Impact`: resulting state mutation, side effect, navigation, or backend write.

---

## 2. Application shell and routing

### `src/main.tsx`
Component(s): bootstrap render pipeline.

Role:
- Mounts React into `#root`.
- Wraps app with `React.StrictMode` and `ErrorBoundary`.
- Imports global CSS (`src/styles/globals.css`).

Impact:
- Any render/runtime exception under the tree bubbles to `ErrorBoundary`.

### `src/App.tsx`
Component(s): `App`, internal `AppContent`.

Role:
- Top-level orchestrator for wallet/session/navigation/modals/page routing.

State and stores read:
- `useAppStore`: deposit, exchange setup, orders, preselected trade, strategies, history, balances, volume.
- `useAuthStore`: auth session state.
- `useMockWallet`: wallet connection state.

Main effects:
- Restores 24h session cache via `loadSession()`.
- Persists app/auth/wallet snapshots via `saveSession()` (debounced 300ms).
- Clears app wallet state on disconnect transitions.
- Syncs selected exchanges to `useMarketDataStore.setExchanges(...)`.
- Loads initial market data with `useMarketDataStore.refreshAllAssets()`.

Key handlers and impacts:
- `handleDisconnect` -> `disconnect()` + `disconnectWallet()` + `clearSession()`.
- `handleDeposit(amount)` -> best-effort `depositPortfolio(amount)` -> onboarding deposit path or direct deposit update.
- `handleWithdraw(amount)` -> `updateDepositAmount(max(0, depositAmount-amount))`.
- `handleTransfer(exchange, amount, direction)` -> `transferFunds(...)` + vault balance adjustment.
- `handleOrderCreate(orderRequest)` -> delegated to `useOrderManagement.handleCreateOrder`.
- `handleNavigateToStrategy(strategyId)` -> route to `/portfolio?strategyId=...`.

### `src/components/AppRouter/AppRouter.tsx`
Component(s): `AppRouter`.

Role:
- URL-path router using `window.location.pathname`.
- Handles page rendering for:
  - `/explore`
  - `/aggregator`
  - `/trade`
  - `/market-maker`
  - `/portfolio`
  - `/more`
  - `/blockchain-explorer`

Key behavior:
- Subscribes to `popstate` and custom `navigation` event.
- Patches `history.pushState` / `history.replaceState` to trigger local route updates.
- Parses query params for portfolio strategy deep-linking.

### `src/components/Navigation/Navigation.tsx`
Component(s): `Navigation`.

Role:
- Global top nav bar and account controls.

UI controls:
- Page tabs (`Explore`, `Aggregator`, `Market Maker`, `Carry`, `Portfolio`) -> `onNavigate(page)`.
- `More` dropdown:
  - `Explorer` -> manual `history.pushState('/blockchain-explorer')` + `popstate` dispatch.
  - `Documentation` -> external link.
- Theme button -> `useThemeStore.toggleTheme()`.
- `Disconnect` -> parent `onDisconnect`.
- Notifications bell -> local dropdown state only.

System impact:
- Navigation changes route and page component.
- Theme toggle changes global theme store.
- Wallet disconnect clears wallet/auth/session via parent handler.

### `src/components/AppModals/AppModals.tsx`
Component(s): `AppModals`.

Role:
- Centralized modal renderer.

Rendered modal map:
- `login` -> `LoginModal` (only when wallet disconnected).
- `deposit` -> `DepositModal`.
- `withdraw` -> `WithdrawModal`.
- `transfer` -> `TransferModal`.
- `exchangeSelection` -> `ExchangeSelectionModal`.

System impact:
- Delegates all callbacks to parent (`App.tsx`) handlers.

---

## 3. Cross-cutting wallet/auth components

### `src/contexts/MockWalletContext.tsx`
Component(s): `MockWalletProvider`, hook `useMockWallet`.

Role:
- Demo wallet provider for connect/disconnect with static mock address.

Calls/impact:
- `connect()` sets address.
- `disconnect()` clears address.
- `isConnected` derived from address truthiness.

### `src/components/CustomConnectButton/CustomConnectButton.tsx`
Component(s): `CustomConnectButton`.

Role:
- Active wallet connect UI used in navigation and login modal.

UI controls:
- `Connect Wallet` -> `handleConnect()`.
- Menu toggle -> show account dropdown.
- `Copy Address` -> clipboard write.
- `Disconnect` -> `handleDisconnect()`.

Calls and impact:
- `handleConnect` -> `useMockWallet.connect()` -> `useAuthStore.setUser(...)` + `setStatus('authenticated')` + toast.
- `handleDisconnect` -> `useMockWallet.disconnect()` + `useAuthStore.setUser(null)` + `setStatus('unauthenticated')` + toast.

### Legacy wallet/auth components (kept for compatibility)

`src/components/ConnectButton.tsx`
- Older connect dropdown; not current primary path.
- Uses `useMockWallet` and local dropdown state.

`src/components/SiwePrompt.tsx`
- Legacy SIWE-like prompt; not currently rendered in active flow.
- Auto-authenticates through `useAuthStore` when wallet connected.

---

## 4. Modal components

### `src/components/LoginModal/LoginModal.tsx`
Component(s): `LoginModal`.

Role:
- Blocking modal requesting wallet connection.

UI control:
- Renders `CustomConnectButton` only; connect action handled there.

### `src/components/DepositModal/DepositModal.tsx`
Component(s): `DepositModal`.

UI controls and impacts:
- Amount input -> local `amount` state.
- Preset buttons (`$100/$500/$1000/$5000`) -> set `amount`.
- `Deposit & Continue` -> `handleDeposit()` -> `onDeposit(parsedAmount)`.

Backend/system impact path:
- Parent `App.tsx` then runs `depositPortfolio(amount)` (best effort) and updates app store onboarding/deposit state.

### `src/components/WithdrawModal/WithdrawModal.tsx`
Component(s): `WithdrawModal`.

UI controls and impacts:
- Amount input with max bound.
- Preset buttons capped by `maxAmount`.
- `Withdraw & Continue` -> `onWithdraw(parsedAmount)`.

System impact path:
- Parent reduces `depositAmount` in app store.

### `src/components/TransferModal/TransferModal.tsx`
Component(s): `TransferModal`.

UI controls and impacts:
- Direction toggle (`fromExchange` <-> `toExchange`) -> resets amount.
- Exchange select -> local selected exchange.
- Amount input, `Max`, percent quick buttons.
- `Transfer` -> `onTransfer(exchange, amount, direction)`.

System impact path:
- Parent applies `transferFunds(...)` + vault balance adjustment.

### `src/components/ExchangeSelectionModal/ExchangeSelectionModal.tsx`
Component(s): `ExchangeSelectionModal`.

Role:
- Onboarding exchange selection/allocation.

Current behavior:
- Allowed toggles limited to `hyperliquid` and `paradex`.
- `Continue to Allocation` forces 50/50 allocation split.
- Allocation sliders currently disabled (`Coming soon` tooltip).

UI controls and impacts:
- Exchange tile -> `toggleExchange(exchangeId)`.
- `Continue to Allocation` -> `handleContinue()`.
- `Back` -> step reset to selection.
- `Initialize Accounts` -> `onComplete(selectedExchanges)`.

System impact path:
- Parent calls exchange setup (`useAppStore.setupExchanges`).

---

## 5. Explore page (`/explore`)

### `src/components/ExplorePage.tsx`
Component(s): `ExplorePage`.
Used shared: `Tooltip`.

Role:
- Funding Yield Explorer with watchlist + funding rate matrix.

Data dependencies:
- `useFundingRatesStore`: `rates`, `getTokenRates`, `fetchLiveFundingRates`, `getMarketCapRank`.
- `useMarketDataStore`: exchanges/assets for watchlist prices and volume.

Polling:
- Fetch funding rates on mount and every 60s.

Major UI controls and impacts:
- Watchlist sort buttons (`Volume`, `Price`) -> `setSortBy` (UI-only sorting).
- Watchlist search input -> `setWatchlistSearch`.
- Search result click -> `toggleFavorite(token)`.
- Favorite row click -> `handleFavoriteClick(token)` (sets token filter).
- Star icon -> `toggleFavorite(token)`.
- Main search input -> `setSearchQuery` for table filtering.
- Capacity weighting input -> numeric validation + `setCapacityWeightedValue`.
- Timeframe tabs (`Day/Week/Month/Year`) -> `setTimeframe` and display conversion.
- Funding matrix cell click -> `handleCellClick(token, exchange, rate)`:
  - Maintains up to two selected cells.
  - On second valid selection calls `onTradeSelect(buyCell, sellCell)` with arbitrage ordering (lower funding buy, higher funding sell).

Backend/system impact:
- No direct backend writes.
- Can trigger route transition to Carry flow through parent `onTradeSelect`.

---

## 6. Aggregator page (`/aggregator`)

### `src/components/AggregatorPage.tsx`
Component(s): `AggregatorPage`.
Used shared: `TradingChart`, `OrdersSection`, `TradeHistory`, `Tooltip`.

Role:
- Single-order execution builder with crypto + HIP-3/RWA support.

Core local state domains:
- Asset selection (`assetType`, `selectedAsset`, RWA category/dex filters).
- Execution config (side, exchange, strategy, quantity/USDC, leverage, duration, trajectory, flags, exit conditions).
- Live market data (`orderBook`, `ticker24h`, `marketMetrics`, `solverData`).
- Template management (`savedTemplates`, save/load modal states).

Key service/store dependencies:
- Stores: `useAppStore`, `useTradesStore`, `usePricesStore`, `useMarketDataStore`, `usePositionsStore`, `useFundingRatesStore`.
- APIs/services:
  - `fetchCurrentPrice`, `subscribeToPrice`, `subscribeToOrderBook`, `fetch24hTicker`.
  - `getMarketMetrics`, `subscribeToHyperliquidOrderBook`, `fetchPerpDexs`.
  - `fetchAllDexsRWAData`, `fetchSingleDexRWAData`.
  - `createTrade` backend persistence.

Critical input rules currently implemented:
- Exchange support constrained to `Hyperliquid` (`SUPPORTED_EXCHANGE`).
- BTC and USDC inputs are mutually locking:
  - If USDC has value -> BTC input disabled.
  - If BTC has value -> USDC input disabled.
- Numeric sanitization via `sanitizeNumberInput`.
- Leverage slider range supports 1–50 and is displayed as `x` multiplier.

Important UI control -> handler -> impact map:
- Asset dropdown tabs (`Crypto`/`RWAs`) -> `setAssetType`.
- RWA sub-tabs and DEX filter buttons -> `setRwaCategory`, `setSelectedDex`.
- Asset row selection -> `setSelectedAsset`.
- Exchange dropdown and selection -> `setSelectedExchanges` (enforced to Hyperliquid).
- Buy/Sell toggle -> `setOrderSide`.
- Strategy selection -> `setSelectedStrategies`.
- Quantity/USDC inputs -> `setBtcAmount` / `setUsdtAmount` with sanitization and locking.
- Limit price mode/input -> `setLimitPriceMode` / `setLimitPrice`.
- Leverage slider -> `setLeverage`.
- IOC/Pause/Grid toggles -> `setIoc` / `setPause` / `setGrid`.
- Duration/timezone/timestamps/trajectory -> local execution params.
- Exit conditions and urgency controls -> local state only.
- `Save Templates` -> opens modal then `handleSaveTemplate` persists to `localStorage['aggregatorTemplates']`.
- `Load Templates` -> opens modal then `handleLoadTemplate(template)` restores full form state.
- Template delete -> `handleDeleteTemplate(id)` updates local state + localStorage.

Execution path (`Confirm and Execute` button):
- Closes confirmation modal.
- Creates open order object and pushes via `useAppStore.addOpenOrder`.
- Creates order in global trades store via `addOrder(...)`.
- Creates trade via `addTrade(...)`.
- Computes leveraged volume notional:
  - `volume = usdcNotional * leverage * (arbitrage ? 2 : 1)`.
- Appends history via `addHistoryEntry(...)` with leverage and buy/sell metadata.
- Best-effort backend persistence via `createTrade({ symbol, side, notionalUsd, leverage, entryPrice })`.
- Creates position legs and pushes via `usePositionsStore.addPosition(...)` including entry funding rates.
- Calls parent `onCreateOrder(orderRequest)` to register active order / navigation flow.

Backend implications from this component:
- Backend must support trade creation + portfolio aggregation consistent with:
  - leverage-aware volume.
  - position legs (long/short, exchange, entry price, entry funding).
  - notional and margin derived metrics used by portfolio page.

### `src/components/AggregatorPageOrders.tsx`
Component(s): `OrdersSection`.

Role:
- Lower panel tabs (`Open Orders`, `Rebalancing`, `Funding History`, `Deposits/Withdrawals`).
- Simulates order fill progression for pending/in-progress orders.

Key logic:
- `useEffect` scans `orders` and starts timers for unprocessed pending orders.
- Calls `useTradesStore.updateOrderProgress(orderId, filled, status)` until `filled`.

Impact:
- Mutates `openOrders` visual progress/status in store.
- Most non-open-orders tabs are static placeholder rows.

### `src/components/AggregatorPageFetchHelper.tsx`
Component(s): helper module (no React component export).

Role:
- RWA fetch helper for Aggregator + ExchangePairSelector.

Functions:
- `fetchAllDexsRWAData(...)`: parallel multi-DEX symbol/details fetch + merge by category.
- `fetchSingleDexRWAData(...)`: single-DEX path.
- 30s in-memory cache (`Map`) keyed by dex mode.

Impact:
- Reports `source` (`live`/`mock`) and error state back to caller.

### `src/components/TradingChart.tsx`
Component(s): `TradingChart`, internal `CandlestickChart`.

Role:
- Instrument chart widget for selected asset.

Controls:
- Timeframe buttons (`1m`..`1w`) -> `setTimeframe` and reload OHLC.
- Chart type toggle (`line`/`candle`) -> `setChartType`.

Data path:
- `fetchKlineData(selectedAsset, timeframe, 100)`.
- Live updates via `subscribeToPrice(...)`.
- Line chart refresh interval: 30s.
- Candlestick live update throttled to ~1s.

Impact:
- Visual analytics only (no backend write).

---

## 7. Carry page (`/trade`)

### `src/components/FundingRateArbPage.tsx`
Component(s): `FundingRateArbPage`.
Used shared: `ExchangePairSelector`, `MultiOrderConfirmation`, `OrdersSection`, `FundingRateArbChart`.

Role:
- Funding rate arbitrage builder with long/short legs.

Current exchange policy:
- Constrained to Hyperliquid (`SUPPORTED_EXCHANGES = ['Hyperliquid']`).

Key controls and impacts:
- Buy/Sell exchange buttons -> selector modal open.
- Buy/Sell pair buttons -> selector modal open.
- Quantity/leverage text inputs for both legs.
- Mode tabs (`advanced`/`automated`) and strategy sliders/toggles.
- `Execute` button -> opens `MultiOrderConfirmation`.
- `Deposit`/`Withdraw`/`Transfer` buttons -> open global modals.

Execution path (`MultiOrderConfirmation.onConfirm`):
- Closes modal.
- Computes buy/sell token, sizes, leverage, live prices from prices store.
- Adds leverage-adjusted volume with `useAppStore.getState().addVolume(totalVolume)`.
- Adds carry order via `useTradesStore.addOrder({ type:'carry', carryTrade: ... })`.
- Adds long and short legs via `addTrade(..., skipAutoHistory=true)`.
- Adds single consolidated history entry via `addHistoryEntry(...)` (side `Multi`).
- Creates 2-leg arbitrage position in `usePositionsStore.addPosition(...)` with funding rates.
- Navigates to `/portfolio?tab=history&trade=multi&detailTab=execution`.

Backend implications:
- Position model must support multi-leg long/short pair representation.
- Volume and PnL on portfolio must include both legs.

### `src/components/FundingRateArbChart.tsx`
Component(s): `FundingRateArbChart`.

Role:
- Live spread/earnings projection chart for configured carry trade.

Data path:
- Funding rates from `useFundingRatesStore.getRate(...)`.
- HIP-3 pair handling:
  - Detects HIP-3 pair prefixes.
  - Fetches live funding via `getMarketMetrics(pair, dex)`.

Computed outputs:
- Buy/sell funding, spread, annual and period earnings.
- Timeframe projections (`Day`, `Week`, `Month`, `Year`).

Impact:
- Read-only analytics.

### `src/components/MultiOrderConfirmation/MultiOrderConfirmation.tsx`
Component(s): `MultiOrderConfirmation`.

Role:
- Confirmation modal for carry multi-leg order submission.

Controls:
- `Cancel` -> `onClose()`.
- `Submit Multi Order` -> `onConfirm()`.

Impact:
- Delegated; actual state/API changes happen in parent `FundingRateArbPage`.

---

## 8. Market Maker page (`/market-maker`)

### `src/components/MarketMakerPage/MarketMakerPage.tsx` (active runtime version)
Component(s): `MarketMakerPage`.
Used shared: `ExchangePairSelector`, `Tooltip`.

Role:
- Multi-mode market-maker UI with `advanced`, `automated`, `multiOrder`, `exchangePoints`, `enterprise` tabs.

Top tab controls:
- `setActiveTab('advanced'|'automated'|'multiOrder'|'exchangePoints'|'enterprise')`.

#### Advanced tab
Main controls:
- Exchange/pair selector buttons -> open `ExchangePairSelector`.
- Margin/leverage/spread/order params/refresh/inventory/risk fields -> local state.
- Participation rate chips (`passive/neutral/aggressive`).
- Auto-repeat and tolerance switches.
- `Start Market Making` button:
  - Builds `ActiveMarketMakerStrategy` object.
  - Calls `useAppStore.deployMarketMakerStrategies([strategy])`.
  - Calls `useTradesStore.addOrder(...)` and `addTrade(...)`.
  - Navigates to strategy monitor via `onNavigateToStrategy(strategyId)`.

#### Automated tab (vault workflows)
Controls:
- Vault card click -> `setSelectedVault(id)`.
- Deploy capital / leverage / slippage / drawdown inputs.
- Vault management actions:
  - `handleVaultDeposit()` updates creator deposit state.
  - `handleVaultWithdraw()` applies min 5% TVL condition then updates state.
  - `handleTakeProfit()` reduces accumulated profits.
- Vault creation modal flow:
  - Steps: `name -> deposit -> confirm -> success`.
  - `handleCreateVault()` simulates async create then success state.

Impact:
- Current implementation is local/mock state only (no backend writes).

#### Multi-Order tab
Controls:
- Strategy card expansion, remove, upload JSON.
- Validation submit per strategy (`validateAndSubmitStrategy(strategyId)`).
- `Run Simulation` -> `runSimulation()` computes mock portfolio metrics and opens modal.
- `Deploy All Strategies` -> opens confirmation modal.
- Confirmation `Confirm & Deploy` -> `confirmDeployAllStrategies()`:
  - Converts valid strategies to `ActiveMarketMakerStrategy[]`.
  - Calls `deployMarketMakerStrategies(activeStrategies)`.
  - For each strategy calls `addOrder(...)` and `addTrade(...)`.
  - Navigates to first deployed strategy monitor.

#### Exchange Points tab
- Displays point status cards from static `EXCHANGE_POINTS`.
- No backend calls; informational UI.

#### Enterprise tab
Controls:
- Enterprise auth input + submit (`handleEnterpriseSubmit`) accepts code `1234`.
- Feature selection cards (`analytics`, `support`, `strategies`, `api`).
- API key generation (`generateApiKey()`).
- Strategy JSON upload (`handleStrategyFileUpload`, drag/drop handlers).
- Deploy/clear buttons for uploaded strategy (`handleDeployStrategy`, `handleClearStrategy`).

Impact:
- Mostly UI/mock state + console logs.
- No actual enterprise backend integration in current runtime implementation.

### Refactor files present but not primary runtime

`src/components/MarketMakerPage/MarketMakerPageRefactored.tsx`
- Alternative form-driven architecture using `react-hook-form` + zod schemas.
- References tab components (`AutomatedTab`, `EnterpriseTab`) not present in current tree.
- Not wired through router; `MarketMakerPage.tsx` is active page component.

`src/components/MarketMakerPage/AdvancedTab.tsx`
- Truncated/incomplete file; currently not production-ready.

`src/components/MarketMakerPage/MultiOrderTab.tsx`
- Form-driven multi-strategy tab component for refactor architecture.

`src/components/MarketMakerPage/ExchangePointsTab.tsx`
- Refactor tab component for points display.

`src/components/MarketMakerPage/StrategyCard.tsx`
- Refactor multi-strategy card with computed estimates.

`src/components/MarketMakerPage/StrategySummary.tsx`
- Refactor summary block with reactive estimate computations.

`src/components/MarketMakerPage/FormField.tsx`
- Shared form input component with tooltip + RHF support.

`src/components/MarketMakerPage/types.ts`
- Zod schemas and typed form models for refactor path.

---

## 9. Portfolio page (`/portfolio`)

### `src/components/PortfolioPage/PortfolioPage.tsx`
Component(s): `PortfolioPage`.
Used shared: `PortfolioOverview`, `PortfolioExchanges`, `TradeHistory`, `StrategyMonitorPage`.

Role:
- Portfolio shell with top stats cards and tabbed sub-views.

Core data dependencies:
- `useAppStore`: exchange allocations, MM strategies, disconnect.
- `useTradesStore`: history + clear.
- `usePositionsStore`: clear positions.
- `useLivePositions`: live PnL and open position legs.
- Backend APIs: `getPortfolioSummary`, `resetPortfolio`.

Main controls and impacts:
- Top action buttons:
  - `Deposit` -> open modal.
  - `Withdraw` -> open modal.
  - `Transfer` -> open modal.
  - `Reset Account` -> confirmation then:
    - best-effort `resetPortfolio()` API.
    - `clearAllTrades()`.
    - `clearPositions()`.
    - `disconnectWallet()`.
    - `clearSession()`.
    - reset UI tab/summary.
- Tab buttons (`overview`, `exchanges`, `history`, `marketMaker`) -> `setActiveTab`.
- Strategy row click in market maker tab -> opens `StrategyMonitorPage`.

URL behavior:
- Reads `tab`, `detailTab`, and `trade` query params and initializes corresponding state.
- Reads `initialStrategyId` and auto-opens strategy monitor.

### `src/components/PortfolioOverview.tsx`
Component(s): `PortfolioOverview`.

Role:
- Main equity, volume, distribution, and balances/positions table panel.

Computed metrics (`useMemo`):
- `unlockedVaultEquity` from deposit.
- `exchangeEquity` from allocations.
- `lockedMarginEquity` from open positions + active MM strategy margin.
- `unlockedMarginEquity` = exchange - locked.
- `totalEquity` = base equity + combined PnL (fallback to backend summary if needed).
- `totalVolume` from history entries (`entry.volume`) with fallback.

Controls:
- Volume timeframe selector (display-only currently).
- PNL timeframe selector (display-only currently).
- Lower table tab buttons (`Balances`, `Positions`, `Trade History`, `Funding History`, `Rebalancing`, `Deposits & Withdrawals`).

Impact:
- Mostly computed display.
- No direct backend writes.

### `src/components/PortfolioExchanges/PortfolioExchanges.tsx`
Component(s): `PortfolioExchanges`.

Role:
- Exchange-level portfolio analytics panel with left exchange list and right chart cards.

Controls:
- Exchange selection buttons (`setSelectedExchange`).
- Analytics tabs (`portfolio`, `funding`).
- Time period tabs (`1d`, `7d`, `30d`, `1y`).
- `Configure Accounts` button calls parent callback.

Impact:
- Presently mock/data-visual UI, no backend mutation.

### `src/components/TradeHistory.tsx`
Component(s): `TradeHistory`.

Role:
- Trade list and filter/pagination; opens `TradeDetailView`.

Data source merge strategy:
- Backend orders (`GET /api/v1/orders`) polled every 15s.
- `useTradesStore.history` converted to display trades.
- `useAppStore.tradeHistory` legacy entries.
- Static mock trades.

Controls and impacts:
- Filter tabs (`Active`, `Canceled`, `Finished`, ... `Multi`) -> `setActiveFilter`.
- Row click -> `setSelectedTrade(trade)` and open detail page.
- Pagination arrows -> `setCurrentPage`.

Deep-link behavior:
- `initialTradeType='multi'` auto-selects latest real multi trade from global history when ready.

### `src/components/TradeDetailView.tsx`
Component(s): `TradeDetailView`.
Internal subcomponents: `StatusTab`, `ExecutionTab`, `RebalancingTab`.

Role:
- Detailed execution page for a selected trade.

Controls:
- Back/close -> `onBack()`.
- Tab switch (`status`, `execution`, `rebalancing`) -> `setActiveTab`.

`StatusTab` behavior:
- Uses `usePricesStore.getPrice` for live mark prices.
- Recomputes buy/sell leg unrealized PnL and PnL %.
- Displays leg tables and charts.

`ExecutionTab` behavior:
- Shows execution rows and metrics cards.
- For `Single` side uses `ExchangeExecutionChart` with selected/trade exchanges.
- For `Multi` side shows custom net-exposure SVG.

`RebalancingTab` behavior:
- Static dashboard cards for threshold and rebalance data.

Impact:
- Read-only visualization of prior execution and live pricing.

### `src/components/ExchangeExecutionChart.tsx`
Component(s): `ExchangeExecutionChart`.

Role:
- Synthetic line chart for exchange execution percentage over time.

Notes:
- Uses randomized dataset generation in `useMemo`.
- Regenerates when exchange set changes.

### `src/components/StrategyMonitorPage/StrategyMonitorPage.tsx`
Component(s): `StrategyMonitorPage`.
Used shared: `SimpleLineChart`, `SimpleAreaChart`, `SimpleComposedChart`.

Role:
- Detailed strategy analytics view (multi-strategy + single position drill-down).

Controls:
- `Back to Portfolio` or `Back to Multi-Strategy` based on drill-down state.
- Time range buttons (`1h`, `4h`, `24h`, `7d`).
- Position row click toggles position-specific analytics.

Data:
- Generated synthetic time series and derived metrics (PnL, volume, spread, fill rates, exposure).

Impact:
- Analytics UI; no backend writes.

### Simple chart components

`src/components/SimpleLineChart.tsx`
- Generic SVG line chart with optional gradient fill and custom formatter.

`src/components/SimpleAreaChart.tsx`
- Generic SVG area/line chart.

`src/components/SimpleComposedChart.tsx`
- Generic composed chart supporting line/area/bar overlays.

Impact for all three:
- Pure presentation components, no store/API writes.

---

## 10. More and blockchain explorer pages

### `src/components/MorePage/MorePage.tsx`
Component(s): `MorePage`.

Role:
- Additional cards for documentation/support/settings placeholders.

Controls:
- `Documentation` card is external link to GitBook.
- Other cards currently static placeholders.

### `src/components/BlockchainExplorerPage/BlockchainExplorerPage.tsx`
Component(s): `BlockchainExplorerPage`.

Role:
- Mock live transaction explorer feed.

Behavior:
- Injects random new transactions every ~2-5 seconds.
- Tracks and highlights fresh rows.

Controls:
- Search input -> `setSearchQuery`.
- Status filter buttons (`all/success/pending/failed`) -> `setFilterStatus`.
- Rows-per-page select -> `setRowsPerPage` + reset page.
- Pagination arrows -> `handlePageChange`.
- External link icon -> opens transaction URL on explorer domain.

Impact:
- No backend writes; simulated data source.

---

## 11. Shared/support components

### `src/components/ExchangePairSelector/ExchangePairSelector.tsx`
Component(s): `ExchangePairSelector`.

Role:
- Unified modal for selecting exchanges or trading pairs across pages.

Data sources:
- `useMarketDataStore` exchanges/assets.
- RWA load via `fetchAllDexsRWAData(...)` when RWAs tab selected.

Controls and impacts:
- Search input + category tabs (`all`, `favorites`, `spot`, `perps`, `rwas`).
- Exchange/DEX filter chips.
- Favorite star toggle.
- Pair row click:
  - `mode='exchange'` -> select exchange+pair (`onSelect(exchange, pair)`).
  - `mode='pair'` -> select pair for current exchange.
  - RWA selection enforces Hyperliquid.

### `src/components/ExchangeLogos/ExchangeLogos.tsx`
Component(s): `ExchangeLogo`.

Role:
- Inline SVG logos for known exchanges with letter fallback.

Impact:
- Presentation only.

### `src/components/Tooltip.tsx`
Component(s): custom `Tooltip`.

Role:
- Lightweight hover tooltip used in Explore/Aggregator/MM components.

Behavior:
- Local `isVisible` state on mouse enter/leave.

### `src/components/figma/ImageWithFallback.tsx`
Component(s): `ImageWithFallback`.

Role:
- Image wrapper replacing broken image with embedded fallback SVG.

### Error boundaries and error displays

`src/components/ErrorBoundary.tsx`
- Root crash boundary used in `main.tsx`; provides reload and stack details.

`src/components/Common/ErrorBoundary.tsx`
`src/components/Common/ErrorBoundary/ErrorBoundary.tsx`
- Alternate reusable boundary variant (duplicate implementation in both paths).

`src/components/Common/ErrorMessage.tsx`
- `ErrorMessage` and `ErrorAlert` with retry/dismiss variants.

### Loading skeletons

`src/components/Common/LoadingSkeleton.tsx`
- Internal primitives: `SkeletonBox`, `SkeletonText`, `SkeletonCircle`.
- Exported skeleton sets:
  - `PortfolioSkeleton`
  - `TableSkeleton`
  - `StatsCardSkeleton`
  - `ExchangeCardSkeleton`
  - `FundingRateTableSkeleton`
  - `CardSkeleton`
  - `ListSkeleton`
  - `Spinner`
  - `PageSpinner`

Impact:
- Presentation-only loading placeholders.

---

## 12. UI primitives (`src/components/ui/*`)

All components in `src/components/ui/*` are generic UI primitives/wrappers.

Design role:
- Provide reusable composition layer for forms, dialogs, menus, tables, tabs, tooltips, etc.
- Most are thin wrappers around Radix primitives + Tailwind class variants.

Backend/system impact:
- None directly.
- They emit callbacks to parent feature components; business logic always lives in page/shared feature components.

### UI primitive export inventory by file
- `src/components/ui/accordion.tsx`: `Accordion`, `AccordionItem`, `AccordionTrigger`, `AccordionContent`
- `src/components/ui/alert-dialog.tsx`: `AlertDialog`, `AlertDialogPortal`, `AlertDialogOverlay`, `AlertDialogTrigger`, `AlertDialogContent`, `AlertDialogHeader`, `AlertDialogFooter`, `AlertDialogTitle`, `AlertDialogDescription`, `AlertDialogAction`, `AlertDialogCancel`
- `src/components/ui/alert.tsx`: `Alert`, `AlertTitle`, `AlertDescription`
- `src/components/ui/aspect-ratio.tsx`: `AspectRatio`
- `src/components/ui/avatar.tsx`: `Avatar`, `AvatarImage`, `AvatarFallback`
- `src/components/ui/badge.tsx`: `Badge`, `badgeVariants`
- `src/components/ui/breadcrumb.tsx`: `Breadcrumb`, `BreadcrumbList`, `BreadcrumbItem`, `BreadcrumbLink`, `BreadcrumbPage`, `BreadcrumbSeparator`, `BreadcrumbEllipsis`
- `src/components/ui/button.tsx`: `Button`, `buttonVariants`
- `src/components/ui/calendar.tsx`: `Calendar`
- `src/components/ui/card.tsx`: `Card`, `CardHeader`, `CardFooter`, `CardTitle`, `CardAction`, `CardDescription`, `CardContent`
- `src/components/ui/carousel.tsx`: `CarouselApi` (type), `Carousel`, `CarouselContent`, `CarouselItem`, `CarouselPrevious`, `CarouselNext`
- `src/components/ui/chart.tsx`: `ChartContainer`, `ChartTooltip`, `ChartTooltipContent`, `ChartLegend`, `ChartLegendContent`, `ChartStyle`
- `src/components/ui/checkbox.tsx`: `Checkbox`
- `src/components/ui/collapsible.tsx`: `Collapsible`, `CollapsibleTrigger`, `CollapsibleContent`
- `src/components/ui/command.tsx`: `Command`, `CommandDialog`, `CommandInput`, `CommandList`, `CommandEmpty`, `CommandGroup`, `CommandItem`, `CommandShortcut`, `CommandSeparator`
- `src/components/ui/context-menu.tsx`: `ContextMenu`, `ContextMenuTrigger`, `ContextMenuContent`, `ContextMenuItem`, `ContextMenuCheckboxItem`, `ContextMenuRadioItem`, `ContextMenuLabel`, `ContextMenuSeparator`, `ContextMenuShortcut`, `ContextMenuGroup`, `ContextMenuPortal`, `ContextMenuSub`, `ContextMenuSubContent`, `ContextMenuSubTrigger`, `ContextMenuRadioGroup`
- `src/components/ui/dialog.tsx`: `Dialog`, `DialogClose`, `DialogContent`, `DialogDescription`, `DialogFooter`, `DialogHeader`, `DialogOverlay`, `DialogPortal`, `DialogTitle`, `DialogTrigger`
- `src/components/ui/dropdown-menu.tsx`: `DropdownMenu`, `DropdownMenuPortal`, `DropdownMenuTrigger`, `DropdownMenuContent`, `DropdownMenuGroup`, `DropdownMenuLabel`, `DropdownMenuItem`, `DropdownMenuCheckboxItem`, `DropdownMenuRadioGroup`, `DropdownMenuRadioItem`, `DropdownMenuSeparator`, `DropdownMenuShortcut`, `DropdownMenuSub`, `DropdownMenuSubTrigger`, `DropdownMenuSubContent`
- `src/components/ui/form.tsx`: `useFormField`, `Form`, `FormItem`, `FormLabel`, `FormControl`, `FormDescription`, `FormMessage`, `FormField`
- `src/components/ui/hover-card.tsx`: `HoverCard`, `HoverCardTrigger`, `HoverCardContent`
- `src/components/ui/input-otp.tsx`: `InputOTP`, `InputOTPGroup`, `InputOTPSlot`, `InputOTPSeparator`
- `src/components/ui/input.tsx`: `Input`
- `src/components/ui/label.tsx`: `Label`
- `src/components/ui/menubar.tsx`: `Menubar`, `MenubarPortal`, `MenubarMenu`, `MenubarTrigger`, `MenubarContent`, `MenubarGroup`, `MenubarSeparator`, `MenubarLabel`, `MenubarItem`, `MenubarShortcut`, `MenubarCheckboxItem`, `MenubarRadioGroup`, `MenubarRadioItem`, `MenubarSub`, `MenubarSubTrigger`, `MenubarSubContent`
- `src/components/ui/navigation-menu.tsx`: `NavigationMenu`, `NavigationMenuList`, `NavigationMenuItem`, `NavigationMenuContent`, `NavigationMenuTrigger`, `NavigationMenuLink`, `NavigationMenuIndicator`, `NavigationMenuViewport`, `navigationMenuTriggerStyle`
- `src/components/ui/pagination.tsx`: `Pagination`, `PaginationContent`, `PaginationLink`, `PaginationItem`, `PaginationPrevious`, `PaginationNext`, `PaginationEllipsis`
- `src/components/ui/popover.tsx`: `Popover`, `PopoverTrigger`, `PopoverContent`, `PopoverAnchor`
- `src/components/ui/progress.tsx`: `Progress`
- `src/components/ui/radio-group.tsx`: `RadioGroup`, `RadioGroupItem`
- `src/components/ui/resizable.tsx`: `ResizablePanelGroup`, `ResizablePanel`, `ResizableHandle`
- `src/components/ui/scroll-area.tsx`: `ScrollArea`, `ScrollBar`
- `src/components/ui/select.tsx`: `Select`, `SelectContent`, `SelectGroup`, `SelectItem`, `SelectLabel`, `SelectScrollDownButton`, `SelectScrollUpButton`, `SelectSeparator`, `SelectTrigger`, `SelectValue`
- `src/components/ui/separator.tsx`: `Separator`
- `src/components/ui/sheet.tsx`: `Sheet`, `SheetTrigger`, `SheetClose`, `SheetContent`, `SheetHeader`, `SheetFooter`, `SheetTitle`, `SheetDescription`
- `src/components/ui/sidebar.tsx`: `Sidebar`, `SidebarContent`, `SidebarFooter`, `SidebarGroup`, `SidebarGroupAction`, `SidebarGroupContent`, `SidebarGroupLabel`, `SidebarHeader`, `SidebarInput`, `SidebarInset`, `SidebarMenu`, `SidebarMenuAction`, `SidebarMenuBadge`, `SidebarMenuButton`, `SidebarMenuItem`, `SidebarMenuSkeleton`, `SidebarMenuSub`, `SidebarMenuSubButton`, `SidebarMenuSubItem`, `SidebarProvider`, `SidebarRail`, `SidebarSeparator`, `SidebarTrigger`, `useSidebar`
- `src/components/ui/skeleton.tsx`: `Skeleton`
- `src/components/ui/slider.tsx`: `Slider`
- `src/components/ui/sonner.tsx`: `Toaster`
- `src/components/ui/switch.tsx`: `Switch`
- `src/components/ui/table.tsx`: `Table`, `TableHeader`, `TableBody`, `TableFooter`, `TableHead`, `TableRow`, `TableCell`, `TableCaption`
- `src/components/ui/tabs.tsx`: `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent`
- `src/components/ui/textarea.tsx`: `Textarea`
- `src/components/ui/toggle-group.tsx`: `ToggleGroup`, `ToggleGroupItem`
- `src/components/ui/toggle.tsx`: `Toggle`, `toggleVariants`
- `src/components/ui/tooltip.tsx`: `Tooltip`, `TooltipTrigger`, `TooltipContent`, `TooltipProvider`
- `src/components/ui/use-mobile.ts`: `useIsMobile` (hook)
- `src/components/ui/utils.ts`: `cn` (utility)

---

## 13. Full exported component inventory (all files in `src/components`)

This is the exhaustive export map from the current tree.

- `src/components/AggregatorPage.tsx`: `AggregatorPage`
- `src/components/AggregatorPageOrders.tsx`: `OrdersSection`
- `src/components/AppModals/AppModals.tsx`: `AppModals`
- `src/components/AppModals/index.ts`: `default`
- `src/components/AppRouter/AppRouter.tsx`: `AppRouter`
- `src/components/AppRouter/index.ts`: `default`
- `src/components/BlockchainExplorerPage/BlockchainExplorerPage.tsx`: `BlockchainExplorerPage`
- `src/components/Common/ErrorBoundary.tsx`: `ErrorBoundary`
- `src/components/Common/ErrorBoundary/ErrorBoundary.tsx`: `ErrorBoundary`
- `src/components/Common/ErrorBoundary/index.ts`: `default`
- `src/components/Common/ErrorMessage.tsx`: `ErrorMessage`, `ErrorAlert`
- `src/components/Common/LoadingSkeleton.tsx`: `PortfolioSkeleton`, `TableSkeleton`, `StatsCardSkeleton`, `ExchangeCardSkeleton`, `FundingRateTableSkeleton`, `CardSkeleton`, `ListSkeleton`, `Spinner`, `PageSpinner`
- `src/components/ConnectButton.tsx`: `default` (`ConnectButton`)
- `src/components/CustomConnectButton/CustomConnectButton.tsx`: `CustomConnectButton`
- `src/components/CustomConnectButton/index.ts`: `CustomConnectButton`, `default`
- `src/components/DepositModal/DepositModal.tsx`: `DepositModal`
- `src/components/DepositModal/index.ts`: `default`
- `src/components/ErrorBoundary.tsx`: `ErrorBoundary`
- `src/components/ExchangeExecutionChart.tsx`: `ExchangeExecutionChart`
- `src/components/ExchangeLogos/ExchangeLogos.tsx`: `ExchangeLogo`
- `src/components/ExchangeLogos/index.ts`: `default`
- `src/components/ExchangePairSelector/ExchangePairSelector.tsx`: `ExchangePairSelector`
- `src/components/ExchangePairSelector/index.ts`: `ExchangePairSelector`, `default`
- `src/components/ExchangeSelectionModal/ExchangeSelectionModal.tsx`: `ExchangeSelectionModal`
- `src/components/ExchangeSelectionModal/index.ts`: `default`
- `src/components/ExplorePage.tsx`: `ExplorePage`
- `src/components/FundingRateArbChart.tsx`: `FundingRateArbChart`
- `src/components/FundingRateArbPage.tsx`: `FundingRateArbPage`
- `src/components/LoginModal/LoginModal.tsx`: `LoginModal`
- `src/components/LoginModal/index.ts`: `default`
- `src/components/MarketMakerPage/AdvancedTab.tsx`: `AdvancedTab`
- `src/components/MarketMakerPage/ExchangePointsTab.tsx`: `ExchangePointsTab`
- `src/components/MarketMakerPage/FormField.tsx`: `FormField`
- `src/components/MarketMakerPage/MarketMakerPage.tsx`: `MarketMakerPage`
- `src/components/MarketMakerPage/MarketMakerPageRefactored.tsx`: `MarketMakerPage`
- `src/components/MarketMakerPage/MultiOrderTab.tsx`: `MultiOrderTab`
- `src/components/MarketMakerPage/StrategyCard.tsx`: `StrategyCard`
- `src/components/MarketMakerPage/StrategySummary.tsx`: `StrategySummary`
- `src/components/MarketMakerPage/index.ts`: `default`
- `src/components/MarketMakerPage/types.ts`: `marketMakerFormSchema`, `vaultFormSchema`, `strategySchema`, `multiOrderFormSchema`, `enterpriseFormSchema`, `TOOLTIPS`, `VAULTS`, `EXCHANGE_POINTS`
- `src/components/MorePage/MorePage.tsx`: `MorePage`
- `src/components/MorePage/index.ts`: `default`
- `src/components/MultiOrderConfirmation/MultiOrderConfirmation.tsx`: `MultiOrderConfirmation`
- `src/components/MultiOrderConfirmation/index.ts`: `MultiOrderConfirmation`
- `src/components/Navigation/Navigation.tsx`: `Navigation`
- `src/components/Navigation/index.ts`: `default`
- `src/components/PortfolioExchanges/PortfolioExchanges.tsx`: `PortfolioExchanges`
- `src/components/PortfolioExchanges/index.ts`: `default`
- `src/components/PortfolioOverview.tsx`: `PortfolioOverview`
- `src/components/PortfolioPage/PortfolioPage.tsx`: `PortfolioPage`
- `src/components/PortfolioPage/index.ts`: `default`
- `src/components/SimpleAreaChart.tsx`: `SimpleAreaChart`
- `src/components/SimpleComposedChart.tsx`: `SimpleComposedChart`
- `src/components/SimpleLineChart.tsx`: `SimpleLineChart`
- `src/components/SiwePrompt.tsx`: `SiwePrompt`
- `src/components/StrategyMonitorPage/StrategyMonitorPage.tsx`: `StrategyMonitorPage`
- `src/components/StrategyMonitorPage/index.ts`: `default`
- `src/components/Tooltip.tsx`: `Tooltip`
- `src/components/TradeDetailView.tsx`: `TradeDetailView`
- `src/components/TradeHistory.tsx`: `TradeHistory`
- `src/components/TradingChart.tsx`: `TradingChart`
- `src/components/TransferModal/TransferModal.tsx`: `TransferModal`
- `src/components/TransferModal/index.ts`: `default`
- `src/components/WithdrawModal/WithdrawModal.tsx`: `WithdrawModal`
- `src/components/WithdrawModal/index.ts`: `default`
- `src/components/figma/ImageWithFallback.tsx`: `ImageWithFallback`
- `src/components/ui/accordion.tsx`: `Accordion`, `AccordionItem`, `AccordionTrigger`, `AccordionContent`
- `src/components/ui/alert-dialog.tsx`: `AlertDialog`, `AlertDialogPortal`, `AlertDialogOverlay`, `AlertDialogTrigger`, `AlertDialogContent`, `AlertDialogHeader`, `AlertDialogFooter`, `AlertDialogTitle`, `AlertDialogDescription`, `AlertDialogAction`, `AlertDialogCancel`
- `src/components/ui/alert.tsx`: `Alert`, `AlertTitle`, `AlertDescription`
- `src/components/ui/aspect-ratio.tsx`: `AspectRatio`
- `src/components/ui/avatar.tsx`: `Avatar`, `AvatarImage`, `AvatarFallback`
- `src/components/ui/badge.tsx`: `Badge`, `badgeVariants`
- `src/components/ui/breadcrumb.tsx`: `Breadcrumb`, `BreadcrumbList`, `BreadcrumbItem`, `BreadcrumbLink`, `BreadcrumbPage`, `BreadcrumbSeparator`, `BreadcrumbEllipsis`
- `src/components/ui/button.tsx`: `Button`, `buttonVariants`
- `src/components/ui/calendar.tsx`: `Calendar`
- `src/components/ui/card.tsx`: `Card`, `CardHeader`, `CardFooter`, `CardTitle`, `CardAction`, `CardDescription`, `CardContent`
- `src/components/ui/carousel.tsx`: `CarouselApi`, `Carousel`, `CarouselContent`, `CarouselItem`, `CarouselPrevious`, `CarouselNext`
- `src/components/ui/chart.tsx`: `ChartContainer`, `ChartTooltip`, `ChartTooltipContent`, `ChartLegend`, `ChartLegendContent`, `ChartStyle`
- `src/components/ui/checkbox.tsx`: `Checkbox`
- `src/components/ui/collapsible.tsx`: `Collapsible`, `CollapsibleTrigger`, `CollapsibleContent`
- `src/components/ui/command.tsx`: `Command`, `CommandDialog`, `CommandInput`, `CommandList`, `CommandEmpty`, `CommandGroup`, `CommandItem`, `CommandShortcut`, `CommandSeparator`
- `src/components/ui/context-menu.tsx`: `ContextMenu`, `ContextMenuTrigger`, `ContextMenuContent`, `ContextMenuItem`, `ContextMenuCheckboxItem`, `ContextMenuRadioItem`, `ContextMenuLabel`, `ContextMenuSeparator`, `ContextMenuShortcut`, `ContextMenuGroup`, `ContextMenuPortal`, `ContextMenuSub`, `ContextMenuSubContent`, `ContextMenuSubTrigger`, `ContextMenuRadioGroup`
- `src/components/ui/dialog.tsx`: `Dialog`, `DialogClose`, `DialogContent`, `DialogDescription`, `DialogFooter`, `DialogHeader`, `DialogOverlay`, `DialogPortal`, `DialogTitle`, `DialogTrigger`
- `src/components/ui/dropdown-menu.tsx`: `DropdownMenu`, `DropdownMenuPortal`, `DropdownMenuTrigger`, `DropdownMenuContent`, `DropdownMenuGroup`, `DropdownMenuLabel`, `DropdownMenuItem`, `DropdownMenuCheckboxItem`, `DropdownMenuRadioGroup`, `DropdownMenuRadioItem`, `DropdownMenuSeparator`, `DropdownMenuShortcut`, `DropdownMenuSub`, `DropdownMenuSubTrigger`, `DropdownMenuSubContent`
- `src/components/ui/form.tsx`: `useFormField`, `Form`, `FormItem`, `FormLabel`, `FormControl`, `FormDescription`, `FormMessage`, `FormField`
- `src/components/ui/hover-card.tsx`: `HoverCard`, `HoverCardTrigger`, `HoverCardContent`
- `src/components/ui/input-otp.tsx`: `InputOTP`, `InputOTPGroup`, `InputOTPSlot`, `InputOTPSeparator`
- `src/components/ui/input.tsx`: `Input`
- `src/components/ui/label.tsx`: `Label`
- `src/components/ui/menubar.tsx`: `Menubar`, `MenubarPortal`, `MenubarMenu`, `MenubarTrigger`, `MenubarContent`, `MenubarGroup`, `MenubarSeparator`, `MenubarLabel`, `MenubarItem`, `MenubarShortcut`, `MenubarCheckboxItem`, `MenubarRadioGroup`, `MenubarRadioItem`, `MenubarSub`, `MenubarSubTrigger`, `MenubarSubContent`
- `src/components/ui/navigation-menu.tsx`: `NavigationMenu`, `NavigationMenuList`, `NavigationMenuItem`, `NavigationMenuContent`, `NavigationMenuTrigger`, `NavigationMenuLink`, `NavigationMenuIndicator`, `NavigationMenuViewport`, `navigationMenuTriggerStyle`
- `src/components/ui/pagination.tsx`: `Pagination`, `PaginationContent`, `PaginationLink`, `PaginationItem`, `PaginationPrevious`, `PaginationNext`, `PaginationEllipsis`
- `src/components/ui/popover.tsx`: `Popover`, `PopoverTrigger`, `PopoverContent`, `PopoverAnchor`
- `src/components/ui/progress.tsx`: `Progress`
- `src/components/ui/radio-group.tsx`: `RadioGroup`, `RadioGroupItem`
- `src/components/ui/resizable.tsx`: `ResizablePanelGroup`, `ResizablePanel`, `ResizableHandle`
- `src/components/ui/scroll-area.tsx`: `ScrollArea`, `ScrollBar`
- `src/components/ui/select.tsx`: `Select`, `SelectContent`, `SelectGroup`, `SelectItem`, `SelectLabel`, `SelectScrollDownButton`, `SelectScrollUpButton`, `SelectSeparator`, `SelectTrigger`, `SelectValue`
- `src/components/ui/separator.tsx`: `Separator`
- `src/components/ui/sheet.tsx`: `Sheet`, `SheetTrigger`, `SheetClose`, `SheetContent`, `SheetHeader`, `SheetFooter`, `SheetTitle`, `SheetDescription`
- `src/components/ui/sidebar.tsx`: `Sidebar`, `SidebarContent`, `SidebarFooter`, `SidebarGroup`, `SidebarGroupAction`, `SidebarGroupContent`, `SidebarGroupLabel`, `SidebarHeader`, `SidebarInput`, `SidebarInset`, `SidebarMenu`, `SidebarMenuAction`, `SidebarMenuBadge`, `SidebarMenuButton`, `SidebarMenuItem`, `SidebarMenuSkeleton`, `SidebarMenuSub`, `SidebarMenuSubButton`, `SidebarMenuSubItem`, `SidebarProvider`, `SidebarRail`, `SidebarSeparator`, `SidebarTrigger`, `useSidebar`
- `src/components/ui/skeleton.tsx`: `Skeleton`
- `src/components/ui/slider.tsx`: `Slider`
- `src/components/ui/sonner.tsx`: `Toaster`
- `src/components/ui/switch.tsx`: `Switch`
- `src/components/ui/table.tsx`: `Table`, `TableHeader`, `TableBody`, `TableFooter`, `TableHead`, `TableRow`, `TableCell`, `TableCaption`
- `src/components/ui/tabs.tsx`: `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent`
- `src/components/ui/textarea.tsx`: `Textarea`
- `src/components/ui/toggle-group.tsx`: `ToggleGroup`, `ToggleGroupItem`
- `src/components/ui/toggle.tsx`: `Toggle`, `toggleVariants`
- `src/components/ui/tooltip.tsx`: `Tooltip`, `TooltipTrigger`, `TooltipContent`, `TooltipProvider`
- `src/components/ui/use-mobile.ts`: `useIsMobile`
- `src/components/ui/utils.ts`: `cn`

---

## 14. Internal (non-exported) component declarations to account for

These are still part of FE behavior even though they are not exported as module-level public components.

- `src/App.tsx`: `AppContent`
- `src/components/TradeDetailView.tsx`: `StatusTab`, `ExecutionTab`, `RebalancingTab`
- `src/components/TradingChart.tsx`: `CandlestickChart`
- `src/components/Common/LoadingSkeleton.tsx`: `SkeletonBox`, `SkeletonText`, `SkeletonCircle`

---

## 15. Backend-facing requirements implied by current FE

To make backend fully align with current FE behavior, these data contracts are required:

### Trades and positions
- Create trade endpoint accepting:
  - `symbol`
  - `side`
  - `notionalUsd`
  - `leverage`
  - `entryPrice`
- Position representation must support:
  - Multi-leg positions (long+short on different exchanges).
  - Per-leg `exchange`, `side`, `quantity`, `entryPrice`, `leverage`, `entryFundingRate`.

### Portfolio summary
- `getPortfolioSummary()` should return at least:
  - `totalEquity`
  - `lockedMargin`
  - `totalVolume`
  - `cashUsd`
  - `unrealizedPnL`
  - `directionalBiasPercent` (optional but consumed if available)

### Volume semantics (already expected by FE)
- Trade history volume should be leverage-adjusted notional.
- For arbitrage (two-leg) entries, FE uses `x2` notional convention in some flows.

### Session/cache expectations
- Frontend persists session state for 24h in local cache.
- Backend should tolerate reconnect with stale or missing auth session and return safe defaults.

### Optional APIs currently polled by FE
- `/api/v1/orders` for Trade History table.
- Portfolio reset endpoint used by `Reset Account`.
- Funding and market data endpoints used by stores/services.

---

## 16. Notes on current implementation gaps

- Several views (especially in PortfolioExchanges, parts of TradeDetailView, and MarketMaker enterprise/vault areas) still rely on mock/static datasets.
- Refactor files under `src/components/MarketMakerPage/*` are partially implemented and not the active routed page.
- Some feature buttons are intentionally placeholder/UI-only and do not call backend yet.
- `src/components/ui/drawer.tsx` currently appears truncated and does not export usable drawer primitives in this snapshot.
