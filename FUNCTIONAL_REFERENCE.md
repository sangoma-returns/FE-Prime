# Functional Button Map (Bitfrost Prime)

This document lists the interactive UI controls, the handler functions they call, and the impact those handlers have on state or behavior. It is generated from the current source in `src/`. If an element is labeled as "UI-only" it means it updates local component state only and does not touch stores or external services.

## Global Routing And State

Source files:
- `src/hooks/useNavigation.ts`
- `src/components/AppRouter/AppRouter.tsx`
- `src/hooks/useOrderManagement.ts`
- `src/hooks/useTradeSelection.ts`
- `src/stores/appStore.ts`
- `src/stores/tradesStore.ts`
- `src/stores/positionsStore.ts`

| System action | Handler/function | Impact |
|---|---|---|
| Navigate between pages | `useNavigation.navigateTo(page, query)` | Updates `window.history`, dispatches `navigation` event; `AppRouter` renders the matching page. |
| Direct URL navigation | `AppRouter` `useEffect` listener | Updates `currentPath` state and re-renders the correct page when history changes. |
| Create order | `useOrderManagement.handleCreateOrder` | Builds an `Order` object, calls `useAppStore.createOrder`, then navigates to `/portfolio?tab=history&filter=Single&detailTab=execution`. |
| Clear order | `useOrderManagement.handleClearOrder` | Calls `useAppStore.clearOrder`. |
| Trade selection from Explore | `useTradeSelection.handleTradeSelect` | Calls `useAppStore.setPreselectedTrade` and navigates to `/trade`. |
| Deposit completion | `useOnboarding.handleDeposit` | Calls `useAppStore.completeDeposit`, closes deposit modal, opens exchange selection modal. |
| Exchange setup completion | `useOnboarding.handleExchangeSetup` | Calls `useAppStore.setupExchanges` and closes exchange selection modal. |

## Top Navigation

Source file:
- `src/components/Navigation/Navigation.tsx`

| UI element | Handler/function | Impact |
|---|---|---|
| `Explore`, `Aggregator`, `Market Maker`, `Carry`, `Portfolio` tabs | `onNavigate(page)` | Calls `useNavigation.navigateTo` via parent; updates URL and page view. |
| `More` dropdown toggle | `setShowMoreDropdown` | UI-only dropdown visibility. |
| `More -> Explorer` | `window.history.pushState` + `PopStateEvent` | Routes to `/blockchain-explorer` without using `useNavigation`. |
| `More -> Documentation` | `<a>` link | Opens external documentation in new tab. |
| Theme toggle | `useThemeStore.toggleTheme` | Toggles light/dark theme in global theme store. |
| Notifications bell | `setShowNotifications` | Opens notifications panel (UI-only). |
| Notification item | `handleNotificationClick(id)` | Marks notification as read (UI-only). |
| `View all notifications` | No handler | UI-only button placeholder. |
| `Disconnect` | `onDisconnect` | Calls `useMockWallet.disconnect` and `useAppStore.disconnectWallet` in `App.tsx`. |

## Wallet Connect Menu

Source file:
- `src/components/CustomConnectButton/CustomConnectButton.tsx`

| UI element | Handler/function | Impact |
|---|---|---|
| `Connect Wallet` button | `handleConnect` | Calls `useMockWallet.connect`, sets auth store user/status, shows success toast. |
| Wallet menu toggle | `setShowMenu` | Opens account menu (UI-only). |
| `Copy Address` | `copyAddress` | Copies address to clipboard and shows toast. |
| `Disconnect` | `handleDisconnect` | Calls `useMockWallet.disconnect`, clears auth store, shows toast. |

## Global Modals

Source files:
- `src/components/AppModals/AppModals.tsx`
- `src/components/DepositModal/DepositModal.tsx`
- `src/components/WithdrawModal/WithdrawModal.tsx`
- `src/components/TransferModal/TransferModal.tsx`
- `src/components/ExchangeSelectionModal/ExchangeSelectionModal.tsx`
- `src/hooks/useModals.ts`

| UI element | Handler/function | Impact |
|---|---|---|
| Deposit modal close | `onClose` | Closes deposit modal via `useModals.closeModal`. |
| Deposit amount presets | `setAmount(preset)` | UI-only input state updates. |
| `Deposit & Continue` | `handleDeposit` | Calls `onDeposit(amount)`; in `App.tsx` this runs onboarding or direct deposit update. |
| Withdraw modal close | `onClose` | Closes withdraw modal. |
| Withdraw amount presets | `setAmount(min(preset, max))` | UI-only input state updates. |
| `Withdraw & Continue` | `handleWithdraw` | Calls `onWithdraw(amount)`; `App.tsx` reduces `depositAmount`. |
| Transfer direction toggle | `toggleDirection` | Swaps `toExchange/fromExchange`, resets amount. |
| Transfer exchange select | `setSelectedExchange` | UI-only input state updates. |
| Transfer `Max` | `setAmount(maxAmount)` | UI-only input state updates. |
| Transfer % buttons | `setAmount(maxAmount * percent)` | UI-only input state updates. |
| `Transfer` | `handleTransfer` | Calls `onTransfer(exchange, amount, direction)`; `App.tsx` updates exchange allocations + vault balance. |
| Exchange selection: exchange tile | `toggleExchange` | Updates selected exchanges (only Hyperliquid and Paradex enabled). |
| Exchange selection: `Continue to Allocation` | `handleContinue` | Moves to allocation step, sets fixed 50/50 allocations. |
| Exchange selection: `Back` | `setStep('select')` | UI-only step change. |
| Exchange selection: `Initialize Accounts` | `handleInitialize` | Calls `onComplete(selectedExchanges)` which triggers `useAppStore.setupExchanges`. |

## Explore Page (Funding Yield Explorer)

Source file:
- `src/components/ExplorePage.tsx`

| UI element | Handler/function | Impact |
|---|---|---|
| Watchlist `Sort by Volume` | `setSortBy('volume')` | UI-only sort mode change. |
| Watchlist `Sort by Price` | `setSortBy('price')` | UI-only sort mode change. |
| Watchlist search input | `setWatchlistSearch` | UI-only search filtering. |
| Watchlist search result click | `toggleFavorite(token)` | Adds to favorites; clears search. |
| Watchlist favorite row click | `handleFavoriteClick(token)` | Sets/clears active favorite filter. |
| Watchlist star icon | `toggleFavorite(token)` | Toggles favorites (stopPropagation). |
| Main search input | `setSearchQuery` | Filters funding rate table by token. |
| Capacity weighted input | `setCapacityWeightedValue` | UI-only; used to weight funding rates. |
| Timeframe buttons | `setTimeframe(tf)` | UI-only; changes timeframe label. |
| Funding rate cell click | `handleCellClick(token, exchange, rate)` | Updates local selection; when two cells are selected, calls `onTradeSelect` to prefill carry trade and navigate to `/trade`. |

## Aggregator Page

Source file:
- `src/components/AggregatorPage.tsx`
- `src/components/AggregatorPageOrders.tsx`

### Asset And Market Selection

| UI element | Handler/function | Impact |
|---|---|---|
| Pair dropdown toggle | `setAssetDropdownOpen` | UI-only dropdown state. |
| Asset type tabs `Crypto` / `RWAs` | `setAssetType('crypto'|'rwa')` | Switches data source and view; triggers RWA fetch side effect. |
| RWA category tabs | `setRwaCategory` | UI-only filter for RWA list. |
| Asset row click | `setSelectedAsset` + `setAssetDropdownOpen(false)` | Updates active market, triggers price/orderbook subscriptions. |

### Exchange, Side, And Strategy Controls

| UI element | Handler/function | Impact |
|---|---|---|
| Exchange dropdown toggle | `setExchangesDropdownOpen` | UI-only dropdown state. |
| Exchange selection checkboxes | `setSelectedExchanges` | Updates local selected exchange list used in order creation. |
| Buy/Sell toggle | `setOrderSide('buy'|'sell')` | Updates local order side. |
| Strategy dropdown toggle | `setStrategiesDropdownOpen` | UI-only dropdown state. |
| Strategy selection | `setSelectedStrategies` | Updates local selected strategy list used in order creation. |

### Order Entry And Inputs

| UI element | Handler/function | Impact |
|---|---|---|
| BTC amount input | `setBtcAmount(sanitizeNumberInput)` | Updates base amount; locks USDC field while non-empty. |
| USDC amount input | `setUsdtAmount(sanitizeNumberInput)` | Updates quote amount; locks BTC field while non-empty. |
| Limit price input | `setLimitPrice` | Updates local limit price. |
| Limit price mode | `setLimitPriceMode(Dynamic/Manual)` | Switches price input mode (UI-only). |
| Leverage slider | `setLeverage` | Updates local leverage value (1–50). |
| Duration | `setDuration` | Updates local duration minutes. |
| Timezone | `setTimezone` | Updates local timezone display. |
| Time start / end | `setTimeStart` / `setTimeEnd` | Updates local timestamps. |
| Trajectory dropdown | `setTrajectory` | Updates local execution trajectory. |
| IOC / Pause / Grid checkboxes | `setIoc` / `setPause` / `setGrid` | Toggle execution flags on the order request. |

### Advanced/Exit Conditions

| UI element | Handler/function | Impact |
|---|---|---|
| Exit conditions toggle | `setExitConditionsOpen` | Shows/hides exit conditions section. |
| Take profit urgency chips | `setTakeProfitUrgency` | UI-only urgency selection. |
| Stop loss urgency chips | `setStopLossUrgency` | UI-only urgency selection. |
| Scale orders toggle | `setScaleOrdersOpen` | UI-only panel toggle. |
| Price unit toggle | `setPriceUnit('%'|'$')` | UI-only unit toggle. |
| Advanced settings toggle | `setAdvancedSettingsOpen` | UI-only panel toggle. |

### Templates And Confirmation

| UI element | Handler/function | Impact |
|---|---|---|
| `Save Templates` | `setShowSaveTemplateModal(true)` | Opens save modal. |
| `Load Templates` | `setShowLoadTemplateModal(true)` | Opens load modal. |
| `Confirmation` | `setShowConfirmationModal(true)` | Opens confirmation modal. |
| Confirm modal close | `setShowConfirmationModal(false)` | Closes modal. |
| Confirm and Execute | Inline handler | Creates open order, adds trade/order/history entry, adds position, and calls `onCreateOrder(orderRequest)` (which creates active order + navigates to Portfolio). |
| Save template modal `Save` | `handleSaveTemplate` | Persists a template to local state. |
| Save template modal `Cancel` | `setShowSaveTemplateModal(false)` | Closes modal and clears name. |
| Load template modal `Load` | `handleLoadTemplate(template)` | Applies template values to local state. |
| Load template modal `Delete` | `handleDeleteTemplate(id)` | Removes template from local state. |
| Load template modal `Close` | `setShowLoadTemplateModal(false)` | Closes modal. |

### Orders Section (Bottom Panel)

Source file:
- `src/components/AggregatorPageOrders.tsx`

| UI element | Handler/function | Impact |
|---|---|---|
| Orders tab buttons | `onTabChange(tab)` | Switches sub-tab (Open Orders, Rebalancing, Funding History, Deposits/Withdrawals). |
| Order fill simulation | `useEffect` in `OrdersSection` | Calls `useTradesStore.updateOrderProgress` on intervals to simulate fills. |
| Open Orders row gear icon | No handler | UI-only placeholder. |

## Carry Page (Funding Rate Arbitrage)

Source file:
- `src/components/FundingRateArbPage.tsx`

| UI element | Handler/function | Impact |
|---|---|---|
| Time range buttons | `setTimeRange(tab)` | UI-only; affects chart display. |
| Buy exchange selector | `setShowBuyExchangeSelector(true)` | Opens exchange selector modal. |
| Buy pair selector | `setShowBuyPairSelector(true)` | Opens pair selector modal. |
| Sell exchange selector | `setShowSellExchangeSelector(true)` | Opens exchange selector modal. |
| Sell pair selector | `setShowSellPairSelector(true)` | Opens pair selector modal. |
| Trade mode tabs | `setTradeMode('advanced'|'automated')` | UI-only mode toggle. |
| `Execute` button | `setShowConfirmation(true)` | Opens confirmation modal. |
| `Deposit`, `Withdraw`, `Transfer` buttons | `onOpenDeposit` / `onOpenWithdraw` / `onOpenTransfer` | Opens corresponding global modals. |

## Market Maker Page

Source file:
- `src/components/MarketMakerPage/MarketMakerPage.tsx`

### Top Tabs

| UI element | Handler/function | Impact |
|---|---|---|
| `Advanced`, `Automated`, `Multi-Order`, `Exchange Points`, `Enterprise` | `setActiveTab(tab)` | Switches UI view. |

### Advanced Tab (Single Strategy)

| UI element | Handler/function | Impact |
|---|---|---|
| Exchange/Pair selectors | `setShowExchangePairSelector(true)` | Opens exchange/pair selector modal. |
| Participation rate pills | `setParticipationRate('passive'|'neutral'|'aggressive')` | Updates local strategy config. |
| `Deploy Strategy` | `handleDeployStrategy` | Marks JSON-upload strategy as deployed (UI-only, logs to console). |
| `Clear` (JSON upload) | `handleClearStrategy` | Clears uploaded JSON strategy from state. |

### Multi-Order Tab

| UI element | Handler/function | Impact |
|---|---|---|
| Strategy submit | `validateAndSubmitStrategy(id)` | Validates required fields; marks strategy as submitted and collapses it. |
| `Run Simulation` | `runSimulation` | Calculates mock results and opens simulation modal. |
| `Deploy All` | `handleDeployAllStrategies` | Opens deploy confirmation modal. |
| Deploy confirmation `Confirm` | `confirmDeployAllStrategies` | Builds `ActiveMarketMakerStrategy[]`, calls `useAppStore.deployMarketMakerStrategies`, adds mock orders/trades to `useTradesStore`. |

### Automated Vaults

| UI element | Handler/function | Impact |
|---|---|---|
| Vault card | `setSelectedVault(vault.id)` | UI-only selection. |
| Vault deposit | `handleVaultDeposit` | Adds to `creatorDeposit` (UI-only). |
| Vault withdraw | `handleVaultWithdraw` | Removes from `creatorDeposit` if min 5% TVL retained (UI-only). |
| Vault take profit | `handleTakeProfit` | Reduces `accumulatedProfits` (UI-only). |
| Vault privacy toggle | `setCurrentVaultPrivacy` | UI-only privacy setting. |
| Create vault | `handleCreateVault` | Simulates vault creation (2s delay), advances modal step. |
| Reset vault creation | `resetVaultCreation` | Resets creation modal and inputs. |

### Enterprise Tab

| UI element | Handler/function | Impact |
|---|---|---|
| Enterprise submit | `handleEnterpriseSubmit` | Authenticates when code is `1234` (UI-only). |
| Enterprise feature cards | `setSelectedEnterpriseFeature` | UI-only selection. |
| Generate API key | `generateApiKey` | Generates mock key in state. |

### Strategy JSON Upload

| UI element | Handler/function | Impact |
|---|---|---|
| Upload button | `fileInputRef.current?.click()` | Opens file picker. |
| File change | `handleStrategyFileUpload` | Validates/loads JSON, sets `uploadedStrategyData`. |
| Drag-and-drop | `handleDragOver` / `handleDrop` | Parses JSON file into strategy state. |

## Portfolio Page

Source files:
- `src/components/PortfolioPage/PortfolioPage.tsx`
- `src/components/PortfolioOverview.tsx`
- `src/components/PortfolioExchanges/index.tsx`
- `src/components/TradeHistory.tsx`

| UI element | Handler/function | Impact |
|---|---|---|
| Empty state `Deposit` | `onOpenDeposit` | Opens deposit modal. |
| Tab buttons | `setActiveTab('overview'|'exchanges'|'history'|'marketMaker')` | Switches portfolio view. |
| Strategy row click | `setSelectedStrategy` | Opens `StrategyMonitorPage` for a strategy. |
| `Withdraw`, `Transfer` | `onOpenWithdraw` / `onOpenTransfer` | Opens global modals. |
| Exchange list actions | Varies per subcomponent | UI-only; data sourced from store and mock data. |

## Trade History And Execution Detail

Source files:
- `src/components/TradeHistory.tsx`
- `src/components/TradeDetailView.tsx`

| UI element | Handler/function | Impact |
|---|---|---|
| Filter tabs | `setActiveFilter` | Filters trade list (UI-only). |
| Pagination controls | `setCurrentPage` | Paginates trade list. |
| Trade row click | `setSelectedTrade` | Opens `TradeDetailView` for the trade. |
| Detail view tabs | `setActiveTab` in `TradeDetailView` | Switches between Status / Execution / Rebalancing. |
| Back button | `setSelectedTrade(null)` | Returns to trade list. |

## Blockchain Explorer

Source file:
- `src/components/BlockchainExplorerPage/BlockchainExplorerPage.tsx`

| UI element | Handler/function | Impact |
|---|---|---|
| Search input | `setSearchQuery` | Filters transaction list (UI-only). |
| Status filter select | `setFilterStatus` | Filters transaction list (UI-only). |
| Rows per page select | `setRowsPerPage` | Changes pagination size (UI-only). |
| Pagination arrows | `handlePageChange` | Changes current page. |
| External link icon | No handler | UI-only placeholder. |

## More Page

Source file:
- `src/components/MorePage/MorePage.tsx`

| UI element | Handler/function | Impact |
|---|---|---|
| Documentation card | `<a href>` | Opens external documentation. |
| Other cards | No handler | UI-only placeholders. |

