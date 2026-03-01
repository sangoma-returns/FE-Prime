# Detailed Component Specificiation

## 1. Scope and Audit Basis
This document is a code-verified frontend specification for:

- `/Users/justin/Documents/New Projects AI/funding-rate-arbitrage-mvp`

Audit basis used for this update:

- Runtime page components and shared components in `/Users/justin/Documents/New Projects AI/funding-rate-arbitrage-mvp/src/components`
- Orchestration hooks/stores in `/Users/justin/Documents/New Projects AI/funding-rate-arbitrage-mvp/src/hooks` and `/Users/justin/Documents/New Projects AI/funding-rate-arbitrage-mvp/src/stores`
- API service callsites in `/Users/justin/Documents/New Projects AI/funding-rate-arbitrage-mvp/src/services/api`

Conventions used:

- `UI Control`: clickable/editable control in JSX.
- `Handler`: function/state setter bound by `onClick`, `onChange`, etc.
- `Calls`: store methods, hooks, or API calls invoked by that action.
- `Impact`: resulting FE state changes, route changes, and backend writes.
- `unknown`: FE does not define reliable formula/logic in code.

---

## 2. FE vs Previous Document Diff (Verified Corrections)

| Area | Previous statement (or ambiguity) | Actual FE behavior now |
|---|---|---|
| Session cache TTL | Not always explicit in all sections | `24 hours` (`SESSION_TTL_MS = 24 * 60 * 60 * 1000`) in `/Users/justin/Documents/New Projects AI/funding-rate-arbitrage-mvp/src/utils/sessionCache.ts` |
| Routing events | Could read as single event source | Routing updates from `useNavigation` custom event and `AppRouter` listeners/patches (`popstate`, `navigation`, patched `pushState/replaceState`) |
| More -> Explorer nav | Ambiguous | Uses direct `window.history.pushState('/blockchain-explorer')` and dispatches `PopStateEvent('popstate')` in `/Users/justin/Documents/New Projects AI/funding-rate-arbitrage-mvp/src/components/Navigation/Navigation.tsx` |
| Aggregator exchanges | Previously broad exchange wording | Aggregator enforces `SUPPORTED_EXCHANGE = 'Hyperliquid'`; exchange toggle ignores non-Hyperliquid selections |
| Carry exchanges | Could be interpreted as multi-exchange | Carry page hardcodes `SUPPORTED_EXCHANGES = ['Hyperliquid']` for selectors |
| Market Maker exchanges | Could be interpreted as multi-exchange execution | Active runtime page constrains advanced strategy exchange list to Hyperliquid (`EXCHANGES = [SUPPORTED_EXCHANGE]`) |
| Aggregator amount fields | Earlier summary too high-level | Mutual lock implemented: BTC input disabled if USDC has value; USDC input disabled if BTC has value |
| Aggregator input type | Could imply unconstrained text | Numeric sanitization via `sanitizeNumberInput`; `inputMode='decimal'`; regex-like pattern hint in inputs |
| Aggregator leverage | Not always explicit | Slider is `min=1`, `max=50`, `step=1`, label `x` |
| Aggregator confirmation modal | Missing fields in older spec | Includes `USDC Amount`, `Leverage`, and `Position Amount = usdtAmount * leverage` |
| Aggregator volume semantics | Partially documented | History volume written as `usdcNotional * leverage * (arbitrage ? 2 : 1)` |
| Carry volume semantics | Not explicit in all sections | On confirm: `totalVolume = buyQty*buyLev + sellQty*sellLev`; added via `addVolume(totalVolume)` and history entry `volume` |
| Carry navigation after execute | Previously generic | Explicit navigation to `/portfolio?tab=history&trade=multi&detailTab=execution` |
| Market Maker Start button behavior | Previously ambiguous due older bug reports | Advanced tab `Start Market Making` creates strategy, adds order/trade, then calls `onNavigateToStrategy(strategyId)` |
| TradeHistory source | Previously simplified | Trade list merges backend `/api/v1/orders`, `tradesStore.history`, `appStore.tradeHistory`, and `MOCK_TRADES` |
| Trade detail target notional columns | Not fully spelled out | Left `Target Notional` = `leverage x quantity USDC`; right `Target Notional` = `quantity * leverage` |
| Portfolio top cards | Could look backend-only | Uses computed FE values first, then backend fallback when computed values are zero/empty |
| Directional bias | Previously broad | Computed from live leg exposures `quantity * entryPrice * leverage`, then `net / totalEquity * 100`, with backend fallback |
| Portfolio volume card | Could appear backend-only | Uses `history.filter(type='trade').reduce(sum volume)` first; backend fallback if computed volume is 0 |
| Portfolio charts | Previously partially marked | Several are static/mock/hardcoded (see Graph Spec) and do not represent live backend data |
| ExchangeExecutionChart | Previously could be mistaken as execution-derived | Synthetic randomized curves generated in `useMemo`; not sourced from fills |
| StrategyMonitor charts | Previously could be mistaken as live | Fully simulated correlated series from local generator; no backend fills used |
| Reset account | Previously high-level | `resetPortfolio()` (best effort), `clearAllTrades()`, `clearPositions()`, `disconnectWallet()`, `clearSession()`, clear local summary/tab |
| Login modal | Could be interpreted as automatic auth gate | Rendered only when `modals.login` and wallet disconnected; active navigation mostly uses top-right connect button |
| ExchangeSelection onboarding | Needed precision | Selector shows multiple exchanges, but only `hyperliquid`/`paradex` togglable; allocations locked at 50/50 with disabled sliders |

---

## 3. Application Shell and Component Interaction Map

### 3.1 Root Mount and Crash Handling
- File: `/Users/justin/Documents/New Projects AI/funding-rate-arbitrage-mvp/src/main.tsx`
- `ReactDOM.createRoot(...).render(...)` wraps `App` in `ErrorBoundary` + `React.StrictMode`.
- Any uncaught render/runtime exception is surfaced by root boundary UI.

### 3.2 Top-Level Orchestrator (`App.tsx`) Interaction Chains

**Chain: session restore on initial load**
1. `AppContent` mounts.
2. `loadSession()` reads `localStorage` `bitfrost_session_v1`.
3. If valid and not expired:
- wallet reconnect attempted via `connect()`.
- `useAuthStore.setState(...)` with cached auth snapshot.
- `useAppStore.setState(...)` with cached app snapshot.

**Chain: session persistence**
1. App/auth/wallet state dependencies change.
2. 300ms debounce timer.
3. `saveSession({ appState, authState, walletConnected })`.

**Chain: disconnect**
1. Nav `Disconnect` click.
2. `handleDisconnect` in `App.tsx`.
3. Calls `disconnect()`, `disconnectWallet()`, `clearSession()`.
4. UI returns to disconnected state.

**Chain: onboarding first deposit**
1. `DepositModal` submit -> `onDeposit(amount)`.
2. `App.handleDeposit` best-effort calls backend `depositPortfolio(amount)`.
3. If first deposit (`hasDeposited === false`):
- `useOnboarding.handleDeposit` -> `completeDeposit(amount)`.
- closes deposit modal.
- opens `exchangeSelection` modal.
4. Exchange modal `Initialize Accounts` -> `setupExchanges(exchanges)`.

**Chain: route changes**
- `Navigation` uses `onNavigate(page)` from `useNavigation` for major tabs.
- `useNavigation.navigateTo` does `pushState` and dispatches `navigation` event.
- `AppRouter` also listens to `popstate` and patched history methods.

### 3.3 Router Map (`AppRouter`)
- `/explore` -> `ExplorePage`
- `/aggregator` -> `AggregatorPage`
- `/trade` -> `FundingRateArbPage`
- `/market-maker` -> `MarketMakerPage`
- `/portfolio` -> `PortfolioPage`
- `/more` -> `MorePage`
- `/blockchain-explorer` -> `BlockchainExplorerPage`

---

## 4. Global Navigation and Modal Controls

### 4.1 Navigation (`/src/components/Navigation/Navigation.tsx`)

| UI Control | Handler / State | Calls | Impact |
|---|---|---|---|
| `Explore` tab | `onClick -> onNavigate('explore')` | `useNavigation.navigateTo` | URL to `/explore`; page rerender |
| `Aggregator` tab | `onNavigate('aggregator')` | same | URL to `/aggregator` |
| `Market Maker` tab | `onNavigate('market-maker')` | same | URL to `/market-maker` |
| `Carry` tab | `onNavigate('funding-arb')` | same | URL to `/trade` |
| `Portfolio` tab | `onNavigate('portfolio')` | same | URL to `/portfolio` |
| `More` button | `setShowMoreDropdown(!)` | local state | opens/closes dropdown |
| Dropdown `Explorer` | direct `pushState('/blockchain-explorer')` + dispatch `popstate` | browser history | route to explorer page |
| Dropdown `Documentation` | anchor external link | browser navigation | opens GitBook |
| Dropdown `API`/`Settings` | disabled buttons | none | UI-only, no side effect |
| Connected badge | no click handler | none | display-only |
| `Disconnect` | `onDisconnect` | `App.handleDisconnect` chain | clears wallet/app session |
| Theme button | `toggleTheme()` | `useThemeStore` | global theme toggle |
| Bell notifications | toggles `showNotifications` | local state | shows notification dropdown |
| Notification row | `handleNotificationClick(id)` | local state | marks row as read |
| `View all notifications` | button with no bound callback | none | UI-only |

### 4.2 Modal Host (`/src/components/AppModals/AppModals.tsx`)

| Modal key | Render condition | Primary callback target |
|---|---|---|
| `login` | `modals.login && !isWalletConnected` | wallet connect via `CustomConnectButton` |
| `deposit` | `modals.deposit` | `App.handleDeposit` |
| `withdraw` | `modals.withdraw` | `App.handleWithdraw` |
| `transfer` | `modals.transfer` | `App.handleTransfer` |
| `exchangeSelection` | `modals.exchangeSelection` | `App.handleExchangeSetup` |

### 4.3 Modal Control Details

**Deposit modal** (`/src/components/DepositModal/DepositModal.tsx`)
- Amount input (`type=number`), presets `$100/$500/$1000/$5000`.
- `Deposit & Continue`:
- parses amount.
- calls `onDeposit(parsedAmount)` only if `parsedAmount > 0`.

**Withdraw modal** (`/src/components/WithdrawModal/WithdrawModal.tsx`)
- Amount input with `max=maxAmount`.
- Presets capped by available max.
- `Withdraw & Continue` calls `onWithdraw(parsedAmount)` only when `0 < amount <= maxAmount`.

**Transfer modal** (`/src/components/TransferModal/TransferModal.tsx`)
- Direction toggle (`fromExchange`/`toExchange`) resets amount.
- Exchange selector restricted to currently selected exchanges from app store.
- `Max` and `%` quick-fill buttons.
- `Transfer` calls `onTransfer(exchange, amount, direction)` if amount valid and within computed max.

**Exchange selection modal** (`/src/components/ExchangeSelectionModal/ExchangeSelectionModal.tsx`)
- Exchange list renders many options, but only IDs in `ALLOWED_EXCHANGES=['hyperliquid','paradex']` are selectable.
- Defaults selected: `['hyperliquid','paradex']`.
- `Continue to Allocation` requires at least 2 exchanges then hard-sets allocation to 50/50.
- Allocation sliders are disabled (tooltip `Coming soon`).
- `Initialize Accounts` calls `onComplete(selectedExchanges)` only if total allocation is ~100.

**Login modal + wallet connect**
- `CustomConnectButton` connect:
- `useMockWallet.connect()`.
- delayed auth set: `setUser({address})`, `setStatus('authenticated')`.
- disconnect:
- `useMockWallet.disconnect()`, `setUser(null)`, `setStatus('unauthenticated')`.

---

## 5. Explore Page (`/explore`) — Explicit Interaction Spec

Primary component: `/Users/justin/Documents/New Projects AI/funding-rate-arbitrage-mvp/src/components/ExplorePage.tsx`

### 5.1 Data and polling
- On mount: `fetchLiveFundingRates()` from `useFundingRatesStore`.
- Poll every 60s via `setInterval`.
- Watchlist price/volume/24h change read from `useMarketDataStore.assets`.

### 5.2 Controls and effects

| UI Control | Handler / State | Calls | Impact |
|---|---|---|---|
| Watchlist sort `Volume` | `setSortBy('volume')` | none | sort mode updates local UI order |
| Watchlist sort `Price` | `setSortBy('price')` | none | sort mode updates local UI order |
| Watchlist search input | `setWatchlistSearch` | none | filters search dropdown |
| Search result row click | inline callback | `toggleFavorite(token)` | adds token to favorites; clears search |
| Favorite row click | `handleFavoriteClick(token)` | none | toggles selected favorite filter |
| Favorite star click | `toggleFavorite(token)` | none | add/remove from favorites |
| Main matrix search | `setSearchQuery` | none | filters funding matrix rows |
| Capacity weighted input | numeric parse + `setCapacityWeightedValue` | none | affects displayed rates via attenuation function |
| Timeframe tabs Day/Week/Month/Year | `setTimeframe(tab)` | none | display conversion (`daily`, `*7`, `*30`, `*365`) |
| Funding matrix cell click | `handleCellClick(token, exchange, rate)` | `onTradeSelect(buy,sell)` when 2 valid cells selected | selects up to 2 cells; second selection triggers Carry navigation flow |

### 5.3 Cross-component interaction (Explore -> Carry)
1. User selects two valid funding cells.
2. `ExplorePage` computes arbitrage ordering (lower funding = buy, higher = sell).
3. Calls `onTradeSelect(buyCell, sellCell)` (prop from `AppRouter`/`App`).
4. `useTradeSelection.handleTradeSelect` stores `preselectedTrade` in app store.
5. `useNavigation.navigateTo('funding-arb')` routes to `/trade`.

---

## 6. Aggregator Page (`/aggregator`) — Explicit Interaction Spec

Primary component: `/Users/justin/Documents/New Projects AI/funding-rate-arbitrage-mvp/src/components/AggregatorPage.tsx`

### 6.1 Input constraints and defaults
- Execution venue enforced to Hyperliquid (`SUPPORTED_EXCHANGE='Hyperliquid'`).
- Base/quote placeholders from selected asset:
- base token = selected symbol (`BTC`, `ETH`, etc).
- quote token constant `'USD'` (display) while confirmation shows `USDC` amount string variable.
- Mutual lock:
- `isBtcAmountLocked = usdtAmount.trim().length > 0`
- `isUsdtAmountLocked = btcAmount.trim().length > 0`
- Numeric sanitization for both fields via `sanitizeNumberInput`.
- Leverage slider range `1..50`.

### 6.2 Main form controls

| UI Control | Handler / State | Calls | Impact |
|---|---|---|---|
| Asset dropdown open/close | `setAssetDropdownOpen` | none | opens asset menu |
| Asset type tabs `Crypto`/`RWAs` | `setAssetType` | none | changes asset list source |
| RWA category tabs | `setRwaCategory` | none | filters RWA assets |
| RWA DEX filter chips | `setSelectedDex` | none | filters RWA assets by DEX |
| Asset row click | `setSelectedAsset` | market fetch effects | updates selected instrument and dependent data |
| Exchange dropdown toggle | `setExchangesDropdownOpen` | none | opens exchange menu |
| Exchange checkbox row | `toggleExchange(exchange)` | none | keeps Hyperliquid only (ignores unsupported exchange) |
| Side buttons `Buy` / `Sell` | `setOrderSide` | none | side changes confirmation and order payload |
| Base amount input | `setBtcAmount(sanitizeNumberInput(...))` | none | numeric-only value; can disable quote input |
| Quote amount input | `setUsdtAmount(sanitizeNumberInput(...))` | none | numeric-only value; can disable base input |
| Upper slider under amount fields | `<input type='range'>` no state binding | none | UI-only currently |
| Leverage slider | `setLeverage(parseInt(...))` | none | updates leverage and downstream notional/volume |
| Strategy dropdown | `toggleStrategy(strategy)` | none | multi-select strategies in local state |
| Limit price text | `setLimitPrice` | none | manual limit value |
| Limit price mode toggle | `setLimitPriceMode('Dynamic'/'Manual')` | none | toggles manual input disabled state |
| IOC/Pause/Grid | `setIoc/setPause/setGrid` | none | flag values added to order payload |
| Duration input | `setDuration` | none | execution param |
| Timezone select | `setTimezone` | none | execution param |
| Time Start / End inputs | `setTimeStart/setTimeEnd` | none | execution param |
| Exit Conditions accordion | `setExitConditionsOpen` | none | shows take-profit/stop-loss controls |
| TP/SL urgency buttons | `setTakeProfitUrgency` / `setStopLossUrgency` | none | urgency metadata |
| Scale Orders accordion | `setScaleOrdersOpen` | none | exposes mostly UI-only parameter controls |
| `%/$` price unit buttons | `setPriceUnit('%'|'$')` | none | local display mode |
| Advanced Settings accordion | `setAdvancedSettingsOpen` | none | reveals additional settings |
| Trajectory select | `setTrajectory` | none | included in order payload |
| Save Templates | `setShowSaveTemplateModal(true)` | none | opens save modal |
| Load Templates | `setShowLoadTemplateModal(true)` | none | opens load modal |
| Bottom `Submit Buy Order` | no handler | none | UI-only |
| Bottom `Confirmation` | `setShowConfirmationModal(true)` | none | opens order confirmation modal |

### 6.3 Template modal controls

| Control | Calls | Impact |
|---|---|---|
| Save modal name input | local `setTemplateName` | staged template name |
| Save modal `Cancel` | close + clear name | modal close |
| Save modal `Save` | `handleSaveTemplate` | writes template to state + `localStorage['aggregatorTemplates']` |
| Load modal `Load` per row | `handleLoadTemplate(template)` | restores full form state |
| Load modal delete icon | `handleDeleteTemplate(id)` | removes template from state + localStorage |

### 6.4 Confirmation modal controls and execution chain

| Control | Calls | Impact |
|---|---|---|
| `Cancel` | close modal | no order created |
| `Confirm and Execute` | see chain below | creates order/trade/history/position + navigates to portfolio history detail |

**Execution chain (`Confirm and Execute`)**
1. Closes confirmation modal.
2. Creates open-order row in app store via `addOpenOrder`.
3. Creates trade store order via `addOrder(...)`.
4. Creates trade store position via `addTrade(..., skipAutoHistory=true)`.
5. Computes `amount`, `price`, `usdcNotional`.
6. Computes `volumeNotional = usdcNotional * leverage * (isArbitrage ? 2 : 1)`.
7. Writes consolidated history entry via `addHistoryEntry(...)`.
8. Best-effort backend persistence: `createTrade({symbol, side, notionalUsd, leverage, entryPrice})`.
9. Creates `positionsStore` position with 1 leg (single) or 2 legs (arbitrage).
10. Calls parent `onCreateOrder(orderRequest)`.
11. Parent hook `useOrderManagement.handleCreateOrder` attempts backend `createOrderApi`, then always routes to:
- `/portfolio?tab=history&filter=Single&detailTab=execution`.

### 6.5 Subcomponents in Aggregator page

**Orders panel** (`/src/components/AggregatorPageOrders.tsx`)
- Tabs:
- `Open Orders`, `Rebalancing`, `Funding History`, `Deposits/Withdrawals`.
- `Open Orders` tab:
- Simulates fill progression for pending orders by timers.
- calls `updateOrderProgress(orderId, filled, status)` until filled.
- Most non-open tabs are static table rows.

**Trading chart** (`/src/components/TradingChart.tsx`)
- Timeframe buttons and chart type toggle.
- Fetches OHLC via `fetchKlineData(...)`.
- Live update via `subscribeToPrice(...)`.
- Line chart refresh interval 30s; candlestick last-point update throttled to ~1s.

---

## 7. Carry Page (`/trade`) — Explicit Interaction Spec

Primary component: `/Users/justin/Documents/New Projects AI/funding-rate-arbitrage-mvp/src/components/FundingRateArbPage.tsx`

### 7.1 Constraints and prefill
- Exchanges constrained to Hyperliquid: `SUPPORTED_EXCHANGES=['Hyperliquid']`.
- Prefill from Explore path (`preselectedTrade`) sets buy/sell exchanges to `hyperliquid` and pairs to provided token strings.

### 7.2 Controls and effects

| UI Control | Handler / State | Calls | Impact |
|---|---|---|---|
| Time range tabs `Day/Week/Month/Year` (chart header) | `setTimeRange` | none | changes projection period in chart |
| Buy exchange button | `setShowBuyExchangeSelector(true)` | opens `ExchangePairSelector` | selecting sets `selectedBuyAccount` |
| Buy pair button | `setShowBuyPairSelector(true)` | selector callback | sets `selectedBuyPair` |
| Buy quantity input | `setBuyQuantity` | none | notional input |
| Buy leverage input | strips non-digits, caps at 50 | none | leverage input with `x` display |
| Buy side mini buttons (`⇄`, `✖`) | no bound handlers | none | UI-only |
| Sell exchange button | `setShowSellExchangeSelector(true)` | selector callback | sets `selectedSellAccount` |
| Sell pair button | `setShowSellPairSelector(true)` | selector callback | sets `selectedSellPair` |
| Sell quantity input | `setSellQuantity` | none | notional input |
| Sell leverage input | strips non-digits, caps at 50 | none | leverage input |
| Sell side mini buttons (`⇄`, `✖`) | no bound handlers | none | UI-only |
| Mode tabs `Advanced`/`Automated` | `setTradeMode` | none | disables/enables parameter sections |
| Duration input | `setDuration` | none | execution metadata |
| Timeframe select | `setTimeframe` | none | execution metadata |
| Strategy sliders (exposure/passiveness/discretion/alphaTilt/directionalBias) | `set...` | none | used in confirmation display |
| Clip size input | `setClipSize` | none | used in confirmation display |
| Strategy checkboxes | `setActiveStrategies({...})` | none | used in confirmation display |
| `Submit Multi Order` | `setShowConfirmation(true)` | none | opens `MultiOrderConfirmation` |
| `Reset Default` | no handler | none | UI-only |
| Account buttons `Deposit/Withdraw/Transfer` | `onOpenDeposit/onOpenWithdraw/onOpenTransfer` | parent modal handlers | opens corresponding global modal |

### 7.3 Multi-order confirmation modal (`MultiOrderConfirmation`)

| Control | Calls | Impact |
|---|---|---|
| `Cancel` | `onClose` | closes modal |
| `Submit Multi Order` | `onConfirm` | executes carry flow below |

**Carry execution chain (`onConfirm`)**
1. Close modal.
2. Parse token/qty/leverage from inputs.
3. Read live prices from `usePricesStore.getPrice`.
4. Compute `totalVolume = buyQty*buyLev + sellQty*sellLev`.
5. `useAppStore.getState().addVolume(totalVolume)`.
6. Add combined carry order (`addOrder` with `type:'carry'`).
7. Add long trade and short trade (`addTrade(..., true)` for both).
8. Add one combined history entry via `addHistoryEntry` including:
- buy/sell quantities and leverages
- buy/sell exchanges
- buy/sell pairs
- buy/sell prices
- duration
9. Add 2-leg arbitrage position via `positionsStore.addPosition`.
10. Navigate to `/portfolio?tab=history&trade=multi&detailTab=execution` by pushState + `navigation` event.

### 7.4 Funding arbitrage chart (`FundingRateArbChart`)
- Uses store rates and optional HIP-3 live metrics from `getMarketMetrics`.
- Computes:
- `buyNotional = buyQty * buyLev`
- `sellNotional = sellQty * sellLev`
- `positionNotional = max(buyNotional, sellNotional)`
- `currentRateDiff = sellFundingRate - buyFundingRate`
- `annualDollarReturn = positionNotional * (currentRateDiff / 100)`
- `dailyDollarReturn = annualDollarReturn / 365`
- Projection PnL points are linear over elapsed days for selected range.

---

## 8. Market Maker Page (`/market-maker`) — Explicit Interaction Spec

Primary runtime component: `/Users/justin/Documents/New Projects AI/funding-rate-arbitrage-mvp/src/components/MarketMakerPage/MarketMakerPage.tsx`

### 8.1 Global tab controls
| Tab button | Handler | Impact |
|---|---|---|
| `Advanced` | `setActiveTab('advanced')` | show advanced market making form |
| `Automated` | `setActiveTab('automated')` | show vault UI |
| `Multi-Order` | `setActiveTab('multiOrder')` | show multi-strategy builder |
| `Exchange Points` | `setActiveTab('exchangePoints')` | show points cards |
| `Enterprise` | `setActiveTab('enterprise')` | show enterprise/auth/API UI |

### 8.2 Advanced tab controls

| UI Control | Handler / State | Calls | Impact |
|---|---|---|---|
| Exchange selector button | `setShowExchangePairSelector(true)` | selector callback | sets `selectedExchange` |
| Pair selector button | `setShowExchangePairSelector(true)` | selector callback | sets `selectedPair` |
| Margin/leverage/spread/order params inputs | `set...` | none | local strategy params |
| Participation buttons (`passive/neutral/aggressive`) | `setParticipationRate` | none | changes runtime estimate assumptions |
| Auto-repeat toggle and config | `setEnableAutoRepeat`, etc | none | modifies estimate + strategy payload |
| PnL tolerance toggle and value | `setEnablePnlTolerance`, `setTolerancePercent` | none | modifies strategy payload |
| `Start Market Making` | inline onClick | `deployMarketMakerStrategies`, `addOrder`, `addTrade`, `onNavigateToStrategy` | creates active strategy + trade/order entries then navigates strategy monitor |

**Start button preconditions**
- Disabled unless `selectedExchange && selectedPair && margin`.

**Advanced estimated performance calculations (`calculateStrategyEstimates`)**
- `volumePerRun = margin * leverage * 20`
- `timePerRunMinutes`: aggressive 5, neutral 15, passive 45
- `maxPossibleRunsPerDay = floor(24*60 / timePerRunMinutes)`
- `actualRunsPerDay = enableAutoRepeat ? min(maxPossibleRunsPerDay, maxRuns) : 1`
- `dailyVolume = volumePerRun * actualRunsPerDay`
- `makerFees = dailyVolume * abs(-0.0001)`
- `spreadCaptureRate = (spreadBps/10000)/2`
- `spreadProfit = dailyVolume * spreadCaptureRate`
- `dailyReturn = spreadProfit + makerFees`
- `dailyReturnPercent = dailyReturn / margin * 100`
- `monthlyReturn = dailyReturn * 30`

### 8.3 Automated tab controls (vault workflow)

| UI Control | Handler | Impact |
|---|---|---|
| Vault card select | `setSelectedVault(vault.id)` | selects vault context |
| Deploy capital, leverage, slippage, max drawdown inputs | `set...` | local config only |
| `Deploy to Vault` | inline button (current logic is local/mock) | no backend order flow |
| Vault management deposit | `handleVaultDeposit` | updates local vault management state |
| Vault management withdraw | `handleVaultWithdraw` | local update with min-liquidity guard |
| Take profit from vault | `handleTakeProfit` | local update |
| `Create New Vault` | opens creation modal (`setShowVaultCreationModal`) | starts wizard |
| Creation wizard `Next/Back/Create` | `setVaultCreationStep`, `handleCreateVault` | local simulated async create |

### 8.4 Multi-Order tab controls

| UI Control | Handler | Impact |
|---|---|---|
| Add strategy | append strategy object | new card in list |
| Remove strategy | remove from array | deletes card |
| Expand/collapse strategy card | `toggleStrategyExpansion` | show/hide form details |
| Upload JSON per strategy | upload modal + `processStrategyJsonFile` | maps JSON fields into strategy form |
| `Submit Strategy` | `validateAndSubmitStrategy(id)` | validates required fields then marks card submitted |
| `Run a Simulation` | `runSimulation()` | computes and opens simulation results modal |
| `Deploy All Strategies` | `setShowDeployConfirmation(true)` | opens confirmation |
| `Confirm & Deploy` | `confirmDeployAllStrategies` | deploys all valid strategies to app store, adds order/trades, navigates to first strategy monitor |

### 8.5 Exchange Points tab
- Renders static `EXCHANGE_POINTS` dataset.
- No execution/API mutation.

### 8.6 Enterprise tab controls

| UI Control | Handler | Impact |
|---|---|---|
| Enterprise code input + `Submit` | `handleEnterpriseSubmit` | authenticates only for code `1234` |
| Feature cards (`analytics/support/strategies/api`) | `setSelectedEnterpriseFeature` | toggles feature subview |
| API key generate/regenerate | `generateApiKey` | local random key state |
| JSON strategy upload | `handleStrategyFileUpload` | parses and validates file locally |
| `Deploy Strategy` | `handleDeployStrategy` | marks deployed locally (no real backend deploy) |
| `Clear` | `handleClearStrategy` | clears uploaded data |

---

## 9. Portfolio Page (`/portfolio`) — Explicit Interaction Spec

Primary component: `/Users/justin/Documents/New Projects AI/funding-rate-arbitrage-mvp/src/components/PortfolioPage/PortfolioPage.tsx`

### 9.1 Top-level controls

| UI Control | Handler | Calls | Impact |
|---|---|---|---|
| `Deposit` | `onOpenDeposit` | parent modal hook | opens deposit modal |
| `Withdraw` | `onOpenWithdraw` | parent modal hook | opens withdraw modal |
| `Transfer` | `onOpenTransfer` | parent modal hook | opens transfer modal |
| `Reset Account` | `handleResetAccount` | `resetPortfolio` (best effort), `clearAllTrades`, `clearPositions`, `disconnectWallet`, `clearSession` | clears local trading/account state and session; returns to overview |
| Tab `Overview` | `setActiveTab('overview')` | none | renders `PortfolioOverview` |
| Tab `Exchanges` | `setActiveTab('exchanges')` | none | renders `PortfolioExchanges` |
| Tab `History` | `setActiveTab('history')` | none | renders `TradeHistory` |
| Tab `Market Maker` | `setActiveTab('marketMaker')` | none | renders MM summary list and strategy cards |
| Strategy name click in MM tab | `setSelectedStrategy({id,name})` | none | opens `StrategyMonitorPage` |

### 9.2 Portfolio metrics formulas (top cards)
- `exchangeEquity = sum(exchangeAllocations)`
- `realizedPnl = sum(history trade entries with pnl)`
- `liveLockedMargin = sum(leg.quantity*leg.entryPrice/leg.leverage)` over live open legs
- `baseEquity = depositAmount + exchangeEquity`
- `effectiveBaseEquity = baseEquity > 0 ? baseEquity : liveLockedMargin`
- `totalEquity = effectiveBaseEquity + realizedPnl + unrealizedPnl`
- `directionalBiasPercent = (longExposure - shortExposure) / totalEquity * 100`
- exposures in bias calc include leverage: `quantity * entryPrice * leverage`

### 9.3 Portfolio Overview (`/src/components/PortfolioOverview.tsx`)

| UI Control | Handler | Impact |
|---|---|---|
| Volume period select | local select value only | display-only currently |
| PNL period select | local select value only | display-only currently |
| Lower table tabs (`Balances`,`Positions`,`Trade History`,`Funding History`,`Rebalancing`,`Deposits & Withdrawals`) | `setPositionsTab(...)` | switches table body |

**Overview metric formulas**
- `unlockedVaultEquity = depositAmount`
- `exchangeEquity = sum(exchangeAllocations)`
- `positionsMargin = sum(openTrades size*entryPrice / leverage)` from `tradesStore.positions`
- `marketMakerMargin = sum(activeMarketMakerStrategies.margin)`
- `lockedMarginEquity = computedLockedMargin > 0 ? computedLockedMargin : backendSummary.lockedMargin`
- `unlockedMarginEquity = max(0, exchangeEquity - lockedMarginEquity)`
- `combinedPnL = oldPnL + livePnL`
- `totalEquity = computedTotalEquity > 0 ? computedTotalEquity : fallback`
- `totalVolume = computed trade history volume sum or backend fallback`

### 9.4 Portfolio Exchanges (`/src/components/PortfolioExchanges/PortfolioExchanges.tsx`)

| UI Control | Handler | Impact |
|---|---|---|
| Exchange list row | `setSelectedExchange(name)` | updates right-panel selected exchange |
| Analytics tab (`Portfolio`/`Funding`) | `setAnalyticsTab` | switches visible analytics block |
| Time range (`1d/7d/30d/1y`) | `setTimePeriod` | switches selected button styling; chart dataset remains static mock arrays |
| `Configure Accounts` | `onConfigureAccounts` | opens onboarding exchange modal |
| CSV buttons | no callback | UI-only |
| Deposit/Withdraw/Transfer buttons in exchange header | no callback wired in this component | UI-only |
| Toggle switches in side settings | uncontrolled checkbox inputs | visual toggle only |

### 9.5 Trade History (`/src/components/TradeHistory.tsx`)

| UI Control | Handler | Impact |
|---|---|---|
| Filter tabs (`Active`,`Canceled`,`Finished`,`...`,`Multi`,`Batch`) | `setActiveFilter(filter)` | visual filter state (table still renders combined list) |
| `Cancel All` | no callback | UI-only |
| Trade row click | `setSelectedTrade(trade)` | opens `TradeDetailView` |
| Pagination arrows | `setCurrentPage` | page index update |

**Trade source merge order**
- backend `/api/v1/orders` mapped rows
- `useTradesStore.history` rows
- `useAppStore.tradeHistory` rows
- `MOCK_TRADES`

### 9.6 Trade Detail View (`/src/components/TradeDetailView.tsx`)

| UI Control | Handler | Impact |
|---|---|---|
| Close `X` | `onBack()` | returns to history table |
| Tabs `status/execution/rebalancing` | `setActiveTab` | changes detail pane |
| Left footer `Pause`/`Cancel` | no callbacks | UI-only |

**Status tab key calculations**
- `buyPnl = (currentBuyPrice - buyPrice) * buyQuantity`
- `sellPnl (short leg) = (sellPrice - currentSellPrice) * sellQuantity`
- `totalPnl = buyPnl + sellPnl`
- `pnlPercent = totalPnl / (buyQuantity + sellQuantity) * 100`
- PnL chart path is simulated interpolation with noise (`generatePnlPath`), not historical trade PnL data.

**Execution tab key calculations**
- `Target Notional` (left column): `formatTargetNotional(leverage, quantity)` -> `${leverage}x $${quantity} USDC`
- `Target Notional` (right column): `quantity * leverage`.
- Single-side execution chart uses `ExchangeExecutionChart` synthetic data.
- Multi-side exposure chart is static hardcoded SVG bars/lines.

### 9.7 Strategy Monitor (`/src/components/StrategyMonitorPage/StrategyMonitorPage.tsx`)

| UI Control | Handler | Impact |
|---|---|---|
| `Back to Portfolio` / `Back to Multi-Strategy` | `onBack` or `setSelectedPosition(null)` | return navigation within portfolio context |
| Time range buttons (`1h`,`4h`,`24h`,`7d`) | `setTimeRange` | regenerates simulated timeseries |
| Position row click | `setSelectedPosition(id)` | enters single-position drilldown mode |

**Data source**
- Generated locally by `generateTimeSeriesData()`.
- No backend chart source in current implementation.

---

## 10. More and Blockchain Explorer Pages

### 10.1 More page (`/src/components/MorePage/MorePage.tsx`)

| Control | Handler | Impact |
|---|---|---|
| Documentation card | external link anchor | opens GitBook |
| Support/Settings/Analytics/API/Community cards | no handler | UI-only cards |

### 10.2 Blockchain Explorer (`/src/components/BlockchainExplorerPage/BlockchainExplorerPage.tsx`)

| UI Control | Handler | Impact |
|---|---|---|
| Search input | `setSearchQuery` | filters transaction table by hash/action/user |
| Status buttons `All/Success/Pending/Failed` | `setFilterStatus` | filters table rows |
| Tx external-link icon | `window.open(explorerUrl, '_blank')` | opens tx on explorer domain |
| Rows-per-page select | `setRowsPerPage`, `setCurrentPage(1)` | changes pagination window |
| Prev/Next arrows | `handlePageChange` | changes page number |

**Live feed behavior**
- Adds synthetic transaction every ~2-5s.
- Marks new row as highlighted for 2s.

---

## 11. Graph and Metric Calculation Specification (Explicit)

### 11.1 Graph registry

| Graph / Visual | Component | Data source | Calculation / mapping |
|---|---|---|---|
| Funding matrix heat cells | `ExplorePage` | `useFundingRatesStore.getTokenRates` | Daily rate displayed per timeframe conversion (`day`,`*7`,`*30`,`*365`); optional capacity attenuation using exchange capacity/log ratio |
| Watchlist volume/price | `ExplorePage` | `useMarketDataStore.assets` | `volume24h` converted to billions (`/1e9`), price/24h change from store |
| Trading price chart (line/candle) | `TradingChart` | `fetchKlineData` + `subscribeToPrice` | OHLC and line series from service; live last point update only for candle mode |
| Carry projection chart | `FundingRateArbChart` | store rates and optional HIP-3 live metrics | Position notional from qty*lev; funding spread drives projected cumulative PnL over selected range |
| Portfolio top-card mini bars | `PortfolioPage` | hardcoded array | Static visual bars; no data binding |
| Portfolio overview donut | `PortfolioOverview` | selected exchanges + allocations | pie segments from each exchange `% = amount / total * 100` |
| Portfolio overview right PNL chart | `PortfolioOverview` | hardcoded polyline points | Static SVG path; unknown business derivation |
| Portfolio exchanges top equity chart | `PortfolioExchanges` | `equityChartData` static | Recharts `LineChart` with fixed dataset |
| Portfolio exchanges notional chart | `PortfolioExchanges` | `notionalExposureData` static | Recharts line chart, static values |
| Portfolio exchanges unrealized chart | `PortfolioExchanges` | `unrealizedPnLData` static | Recharts line chart, static values |
| Trade detail status PnL chart | `TradeDetailView` `StatusTab` | computed current PnL + simulated progression | Path generated from current totalPnl with sinusoidal noise over 30 points |
| Trade detail single execution chart | `ExchangeExecutionChart` | random generator | per-exchange random curves normalized to ~100%, regenerated when exchanges array changes |
| Trade detail multi execution chart | `TradeDetailView` `ExecutionTab` | hardcoded SVG bars/lines | static net exposure/tolerance rendering |
| Trade detail price/spread charts | `TradeDetailView` `ExecutionTab` | hardcoded SVG paths | static demo visuals |
| Strategy monitor line/area/composed charts | `StrategyMonitorPage` + `Simple*` components | synthetic timeseries from generator | simulated correlated fields (PnL, volume, spreads, imbalance, fill rate); no backend source |

### 11.2 Generic chart components (`SimpleLineChart`, `SimpleAreaChart`, `SimpleComposedChart`)
- These components are presentation engines.
- They compute axis min/max and normalize supplied `data` points into SVG coordinates.
- They do not fetch or mutate data.
- Business interpretation of values is `unknown` to these components; interpretation is provided by parent component.

### 11.3 Portfolio metric cards formulas

| Metric | Formula in FE |
|---|---|
| Total Equity | computed equity fallback chain (local calculated first, backend summary fallback) |
| PnL card | primarily realized/history based in `PortfolioPage`; fallback currently uses backend `unrealizedPnL` when local is zero |
| Unrealized PnL | from `useLivePositions.totalPnl` fallback to backend summary |
| Directional Bias | `(longExposure - shortExposure) / totalEquity * 100`, leverage-weighted exposures, backend fallback if available |
| Volume (overview) | `sum(history entry.volume for trade entries)` with fallback |

### 11.4 Calculations marked unknown by code constraints
- Any chart panel that uses hardcoded arrays/SVG paths has no derivable market formula in FE (`unknown`).
- Placeholder table metrics (`Slippage`, `Minimal Exposure`, many MM/portfolio subcards) are static labels/values (`unknown` backend formula).

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
