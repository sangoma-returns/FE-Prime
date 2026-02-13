/**
 * Orders Section - Exact copy from Trade Page
 */

import { useMemo, useEffect, useRef } from 'react';
import { useThemeStore } from '../stores/themeStore';
import { useTradesStore } from '../stores/tradesStore';
import type { Order } from '../stores/tradesStore';

interface OrdersSectionProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  orders?: Order[];
}

export function OrdersSection({ activeTab, onTabChange, orders = [] }: OrdersSectionProps) {
  const { colors } = useThemeStore();
  const updateOrderProgress = useTradesStore((state) => state.updateOrderProgress);
  const processedOrdersRef = useRef<Set<string>>(new Set());
  const intervalsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const timeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  
  // Cleanup intervals and timeouts on unmount
  useEffect(() => {
    return () => {
      // Clear all intervals
      intervalsRef.current.forEach(interval => clearInterval(interval));
      intervalsRef.current.clear();
      
      // Clear all timeouts
      timeoutsRef.current.forEach(timeout => clearTimeout(timeout));
      timeoutsRef.current.clear();
    };
  }, []);
  
  // Simulate order filling for pending and in-progress orders
  useEffect(() => {
    orders.forEach(order => {
      // Skip if we've already set up an interval for this order
      if (processedOrdersRef.current.has(order.id)) {
        return;
      }
      
      if (order.status === 'pending' && order.filled === 0) {
        processedOrdersRef.current.add(order.id);
        
        // Determine fill speed based on order source
        const isMarketMaker = order.source === 'market-maker';
        const startDelay = isMarketMaker ? 1000 : 500; // Market maker takes 1s to start
        // Market maker: 0.08-0.15% per update (reaches ~1% in 20 seconds with updates every 1.5-2.5s)
        // Regular orders: 5-20% per update (fills quickly)
        const fillIncrement = isMarketMaker ? (Math.random() * 0.07 + 0.08) : (Math.random() * 15 + 5);
        // Market maker: update every 1.5-2.5 seconds
        // Regular orders: update every 0.4-1.2 seconds
        const fillInterval = isMarketMaker ? (Math.random() * 1000 + 1500) : (Math.random() * 800 + 400);
        
        // Start filling after a short delay
        const timeout = setTimeout(() => {
          // Remove timeout from map once it's executed
          timeoutsRef.current.delete(order.id);
          
          updateOrderProgress(order.id, 0, 'in-progress');
          
          // Then set up the filling interval
          const interval = setInterval(() => {
            // Get the latest order state from the closure
            const currentOrders = useTradesStore.getState().openOrders;
            const currentOrder = currentOrders.find(o => o.id === order.id);
            
            if (!currentOrder || currentOrder.status === 'filled' || currentOrder.filled >= 100) {
              clearInterval(interval);
              intervalsRef.current.delete(order.id);
              return;
            }
            
            const newFilled = Math.min(100, currentOrder.filled + fillIncrement);
            
            if (newFilled >= 100) {
              updateOrderProgress(order.id, 100, 'filled');
              clearInterval(interval);
              intervalsRef.current.delete(order.id);
            } else {
              updateOrderProgress(order.id, newFilled, 'in-progress');
            }
          }, fillInterval);
          
          // Store interval reference
          intervalsRef.current.set(order.id, interval);
        }, startDelay);
        
        // Store timeout reference
        timeoutsRef.current.set(order.id, timeout);
      }
    });
  }, [orders, updateOrderProgress]);
  
  // Format notional value
  const formatNotional = (value: number) => {
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(2)}K`;
    }
    return `$${value.toFixed(2)}`;
  };
  
  // Transform Order objects to the display format - memoized to prevent re-renders
  const transformedOrders = useMemo(() => {
    // Get status display text and color
    const getStatusDisplay = (status: Order['status']) => {
      switch (status) {
        case 'pending': return { text: 'Pending', color: 'text-yellow-400' };
        case 'in-progress': return { text: 'In Progress', color: 'text-blue-400' };
        case 'filled': return { text: 'Complete', color: 'text-green-400' };
        case 'cancelled': return { text: 'Cancelled', color: 'text-red-400' };
        default: return { text: 'Unknown', color: colors.text.tertiary };
      }
    };
    
    return orders
      .filter(order => order.status !== 'cancelled')
      .map(order => {
        const notional = order.size * order.price;
        const statusDisplay = getStatusDisplay(order.status);
        
        // Handle carry trades differently - they have both long and short info
        if (order.type === 'carry' && order.carryTrade) {
          return {
            id: order.id,
            longAccount: order.carryTrade.longExchange,
            longPair: `${order.carryTrade.longToken}-PERP-USD`,
            shortAccount: order.carryTrade.shortExchange,
            shortPair: `${order.carryTrade.shortToken}-PERP-USD`,
            size: order.carryTrade.longSize.toFixed(6),
            notional: formatNotional(notional),
            filled: Math.round(order.filled),
            status: statusDisplay.text,
            statusColor: statusDisplay.color
          };
        }
        
        // Handle single long/short orders
        return {
          id: order.id,
          longAccount: order.type === 'long' ? order.exchange : '-',
          longPair: order.type === 'long' ? `${order.token}-PERP-USD` : '-',
          shortAccount: order.type === 'short' ? order.exchange : '-',
          shortPair: order.type === 'short' ? `${order.token}-PERP-USD` : '-',
          size: order.size.toFixed(6),
          notional: formatNotional(notional),
          filled: Math.round(order.filled),
          status: statusDisplay.text,
          statusColor: statusDisplay.color
        };
      });
  }, [orders, colors]);
  
  // Mock orders for static display
  const staticOrders = useMemo(() => [
    {
      id: 'static-1',
      longAccount: 'Paradex',
      longPair: 'BTC-PERP-USDT',
      shortAccount: 'Hyperliquid',
      shortPair: 'BTC-PERP-USDC',
      size: '0.022345',
      notional: '$1.99K',
      filled: 99,
      status: 'Complete',
      statusColor: 'text-green-400'
    },
    {
      id: 'static-2',
      longAccount: 'Paradex',
      longPair: 'BTC-PERP-USDT',
      shortAccount: 'Hyperliquid',
      shortPair: 'BTC-PERP-USDC',
      size: '0.033884',
      notional: '$3.02K',
      filled: 100,
      status: 'Complete',
      statusColor: 'text-green-400'
    }
  ], []);
  
  const allOrders = useMemo(() => [...transformedOrders, ...staticOrders], [transformedOrders, staticOrders]);

  return (
    <div className={`border-t ${colors.border.primary} ${colors.bg.secondary} overflow-y-auto max-h-64`}>
      {/* Tab Navigation */}
      <div className={`flex gap-6 px-3 pt-2 border-b ${colors.border.secondary} overflow-x-auto`}>
        <button 
          onClick={() => onTabChange('openOrders')}
          className={`pb-1.5 text-label whitespace-nowrap transition-colors ${
            activeTab === 'openOrders'
              ? 'text-orange-600 border-b-2 border-orange-600'
              : colors.text.tertiary + ' ' + colors.text.hoverPrimary
          }`}
        >
          Open Orders
        </button>
        <button 
          onClick={() => onTabChange('rebalancing')}
          className={`pb-1.5 text-label whitespace-nowrap transition-colors ${
            activeTab === 'rebalancing'
              ? 'text-orange-600 border-b-2 border-orange-600'
              : colors.text.tertiary + ' ' + colors.text.hoverPrimary
          }`}
        >
          Rebalancing
        </button>
        <button 
          onClick={() => onTabChange('fundingHistory')}
          className={`pb-1.5 text-label whitespace-nowrap transition-colors ${
            activeTab === 'fundingHistory'
              ? 'text-orange-600 border-b-2 border-orange-600'
              : colors.text.tertiary + ' ' + colors.text.hoverPrimary
          }`}
        >
          Funding History
        </button>
        <button 
          onClick={() => onTabChange('depositsWithdrawals')}
          className={`pb-1.5 text-label whitespace-nowrap transition-colors ${
            activeTab === 'depositsWithdrawals'
              ? 'text-orange-600 border-b-2 border-orange-600'
              : colors.text.tertiary + ' ' + colors.text.hoverPrimary
          }`}
        >
          Deposits/Withdrawals
        </button>
      </div>
      
      <div className="overflow-x-auto">
        {activeTab === 'openOrders' ? (
          <table className="w-full">
            <thead className={`sticky top-0 ${colors.bg.secondary}`}>
              <tr className={`border-b ${colors.border.secondary}`}>
                <th className={`text-left px-3 py-1 text-label ${colors.text.tertiary} font-normal whitespace-nowrap`}>Long Account</th>
                <th className={`text-left px-3 py-1 text-label ${colors.text.tertiary} font-normal whitespace-nowrap`}>Long Pair</th>
                <th className={`text-left px-3 py-1 text-label ${colors.text.tertiary} font-normal whitespace-nowrap`}>Short Account</th>
                <th className={`text-left px-3 py-1 text-label ${colors.text.tertiary} font-normal whitespace-nowrap`}>Short Pair</th>
                <th className={`text-left px-3 py-1 text-label ${colors.text.tertiary} font-normal whitespace-nowrap`}>Size</th>
                <th className={`text-left px-3 py-1 text-label ${colors.text.tertiary} font-normal whitespace-nowrap`}>Notional</th>
                <th className={`text-left px-3 py-1 text-label ${colors.text.tertiary} font-normal whitespace-nowrap`}>Filled</th>
                <th className={`text-left px-3 py-1 text-label ${colors.text.tertiary} font-normal whitespace-nowrap`}>Status</th>
                <th className={`text-left px-3 py-1 text-label ${colors.text.tertiary} font-normal whitespace-nowrap`}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {allOrders.map((order, index) => (
                <tr key={order.id} className={`border-b ${colors.border.secondary} hover:${colors.bg.subtle} transition-colors`}>
                  <td className={`px-3 py-0.5 text-label ${colors.text.secondary} whitespace-nowrap`}>{order.longAccount}</td>
                  <td className={`px-3 py-0.5 text-label ${colors.text.primary} whitespace-nowrap`}>{order.longPair}</td>
                  <td className={`px-3 py-0.5 text-label ${colors.text.secondary} whitespace-nowrap`}>{order.shortAccount}</td>
                  <td className={`px-3 py-0.5 text-label ${colors.text.primary} whitespace-nowrap`}>{order.shortPair}</td>
                  <td className={`px-3 py-0.5 text-label ${colors.text.secondary} whitespace-nowrap`}>{order.size}</td>
                  <td className={`px-3 py-0.5 text-label ${colors.text.secondary} whitespace-nowrap`}>{order.notional}</td>
                  <td className={`px-3 py-0.5 text-label whitespace-nowrap`}>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 bg-gray-700 rounded-full overflow-hidden">
                        <div className="h-full bg-green-500" style={{ width: `${order.filled}%` }}></div>
                      </div>
                      <span className={colors.text.secondary}>{order.filled}%</span>
                    </div>
                  </td>
                  <td className={`px-3 py-0.5 text-label ${order.statusColor} whitespace-nowrap`}>{order.status}</td>
                  <td className={`px-3 py-0.5 text-label whitespace-nowrap`}>
                    <button className="text-cyan-400 hover:text-cyan-300">⚙</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : activeTab === 'rebalancing' ? (
          <table className="w-full">
            <thead className={`sticky top-0 ${colors.bg.secondary}`}>
              <tr className={`border-b ${colors.border.secondary}`}>
                <th className={`text-left px-3 py-1 text-label ${colors.text.tertiary} font-normal whitespace-nowrap`}>time</th>
                <th className={`text-left px-3 py-1 text-label ${colors.text.tertiary} font-normal whitespace-nowrap`}>From</th>
                <th className={`text-left px-3 py-1 text-label ${colors.text.tertiary} font-normal whitespace-nowrap`}>To</th>
                <th className={`text-left px-3 py-1 text-label ${colors.text.tertiary} font-normal whitespace-nowrap`}>amount</th>
                <th className={`text-left px-3 py-1 text-label ${colors.text.tertiary} font-normal whitespace-nowrap`}>Order</th>
                <th className={`text-left px-3 py-1 text-label ${colors.text.tertiary} font-normal whitespace-nowrap`}>Previous Margin</th>
                <th className={`text-left px-3 py-1 text-label ${colors.text.tertiary} font-normal whitespace-nowrap`}>Corrected Margin</th>
              </tr>
            </thead>
            <tbody>
              <tr className={`border-b ${colors.border.secondary} hover:${colors.bg.subtle} transition-colors`}>
                <td className={`px-3 py-0.5 text-label ${colors.text.tertiary} whitespace-nowrap`}>14:32:15</td>
                <td className={`px-3 py-0.5 text-label ${colors.text.secondary} whitespace-nowrap`}>Paradex</td>
                <td className={`px-3 py-0.5 text-label ${colors.text.secondary} whitespace-nowrap`}>Hyperliquid</td>
                <td className={`px-3 py-0.5 text-label ${colors.text.secondary} whitespace-nowrap`}>$3.42</td>
                <td className={`px-3 py-0.5 text-label ${colors.text.primary} whitespace-nowrap`}>BTC-PERP-USDC</td>
                <td className={`px-3 py-0.5 text-label ${colors.text.secondary} whitespace-nowrap`}>0.0823</td>
                <td className={`px-3 py-0.5 text-label ${colors.text.secondary} whitespace-nowrap`}>0.0715</td>
              </tr>
              <tr className={`border-b ${colors.border.secondary} hover:${colors.bg.subtle} transition-colors`}>
                <td className={`px-3 py-0.5 text-label ${colors.text.tertiary} whitespace-nowrap`}>13:47:08</td>
                <td className={`px-3 py-0.5 text-label ${colors.text.secondary} whitespace-nowrap`}>Paradex</td>
                <td className={`px-3 py-0.5 text-label ${colors.text.secondary} whitespace-nowrap`}>Hyperliquid</td>
                <td className={`px-3 py-0.5 text-label ${colors.text.secondary} whitespace-nowrap`}>$4.87</td>
                <td className={`px-3 py-0.5 text-label ${colors.text.primary} whitespace-nowrap`}>BTC-PERP-USDC</td>
                <td className={`px-3 py-0.5 text-label ${colors.text.secondary} whitespace-nowrap`}>0.0698</td>
                <td className={`px-3 py-0.5 text-label ${colors.text.secondary} whitespace-nowrap`}>0.0742</td>
              </tr>
              <tr className={`hover:${colors.bg.subtle} transition-colors`}>
                <td className={`px-3 py-0.5 text-label ${colors.text.tertiary} whitespace-nowrap`}>11:23:42</td>
                <td className={`px-3 py-0.5 text-label ${colors.text.secondary} whitespace-nowrap`}>Paradex</td>
                <td className={`px-3 py-0.5 text-label ${colors.text.secondary} whitespace-nowrap`}>Hyperliquid</td>
                <td className={`px-3 py-0.5 text-label ${colors.text.secondary} whitespace-nowrap`}>$2.15</td>
                <td className={`px-3 py-0.5 text-label ${colors.text.primary} whitespace-nowrap`}>BTC-PERP-USDC</td>
                <td className={`px-3 py-0.5 text-label ${colors.text.secondary} whitespace-nowrap`}>0.0756</td>
                <td className={`px-3 py-0.5 text-label ${colors.text.secondary} whitespace-nowrap`}>0.0681</td>
              </tr>
            </tbody>
          </table>
        ) : activeTab === 'depositsWithdrawals' ? (
          <table className="w-full">
            <thead className={`sticky top-0 ${colors.bg.secondary}`}>
              <tr className={`border-b ${colors.border.secondary}`}>
                <th className={`text-left px-3 py-1 text-label ${colors.text.tertiary} font-normal whitespace-nowrap`}>Date</th>
                <th className={`text-left px-3 py-1 text-label ${colors.text.tertiary} font-normal whitespace-nowrap`}>Exchange</th>
                <th className={`text-left px-3 py-1 text-label ${colors.text.tertiary} font-normal whitespace-nowrap`}>Pair</th>
                <th className={`text-left px-3 py-1 text-label ${colors.text.tertiary} font-normal whitespace-nowrap`}>Amount</th>
                <th className={`text-left px-3 py-1 text-label ${colors.text.tertiary} font-normal whitespace-nowrap`}>Type</th>
              </tr>
            </thead>
            <tbody>
              <tr className={`border-b ${colors.border.secondary} hover:${colors.bg.subtle} transition-colors`}>
                <td className={`px-3 py-0.5 text-label ${colors.text.tertiary} whitespace-nowrap`}>03/10/2026</td>
                <td className={`px-3 py-0.5 text-label ${colors.text.secondary} whitespace-nowrap`}>Paradex</td>
                <td className={`px-3 py-0.5 text-label ${colors.text.primary} whitespace-nowrap`}>BTC-PERP-USDT</td>
                <td className={`px-3 py-0.5 text-label ${colors.text.primary} whitespace-nowrap`}>$1.000</td>
                <td className={`px-3 py-0.5 text-label ${colors.text.primary} whitespace-nowrap`}>Deposit</td>
              </tr>
              <tr className={`border-b ${colors.border.secondary} hover:${colors.bg.subtle} transition-colors`}>
                <td className={`px-3 py-0.5 text-label ${colors.text.tertiary} whitespace-nowrap`}>03/10/2026</td>
                <td className={`px-3 py-0.5 text-label ${colors.text.secondary} whitespace-nowrap`}>Hyperliquid</td>
                <td className={`px-3 py-0.5 text-label ${colors.text.primary} whitespace-nowrap`}>BTC-PERP-USDC</td>
                <td className={`px-3 py-0.5 text-label ${colors.text.primary} whitespace-nowrap`}>$1.000</td>
                <td className={`px-3 py-0.5 text-label ${colors.text.primary} whitespace-nowrap`}>Withdrawal</td>
              </tr>
              <tr className={`hover:${colors.bg.subtle} transition-colors`}>
                <td className={`px-3 py-0.5 text-label ${colors.text.tertiary} whitespace-nowrap`}>03/10/2026</td>
                <td className={`px-3 py-0.5 text-label ${colors.text.secondary} whitespace-nowrap`}>Paradex</td>
                <td className={`px-3 py-0.5 text-label ${colors.text.primary} whitespace-nowrap`}>BTC-PERP-USDT</td>
                <td className={`px-3 py-0.5 text-label ${colors.text.primary} whitespace-nowrap`}>$1.000</td>
                <td className={`px-3 py-0.5 text-label ${colors.text.primary} whitespace-nowrap`}>Deposit</td>
              </tr>
            </tbody>
          </table>
        ) : (
          <table className="w-full">
            <thead className={`sticky top-0 ${colors.bg.secondary}`}>
              <tr className={`border-b ${colors.border.secondary}`}>
                <th className={`text-left px-3 py-1 text-label ${colors.text.tertiary} font-normal whitespace-nowrap`}>Date</th>
                <th className={`text-left px-3 py-1 text-label ${colors.text.tertiary} font-normal whitespace-nowrap`}>Exchange</th>
                <th className={`text-left px-3 py-1 text-label ${colors.text.tertiary} font-normal whitespace-nowrap`}>Pair</th>
                <th className={`text-left px-3 py-1 text-label ${colors.text.tertiary} font-normal whitespace-nowrap`}>Funding Rate</th>
              </tr>
            </thead>
            <tbody>
              <tr className={`border-b ${colors.border.secondary} hover:${colors.bg.subtle} transition-colors`}>
                <td className={`px-3 py-0.5 text-label ${colors.text.tertiary} whitespace-nowrap`}>03/10/2026</td>
                <td className={`px-3 py-0.5 text-label ${colors.text.secondary} whitespace-nowrap`}>Paradex</td>
                <td className={`px-3 py-0.5 text-label ${colors.text.primary} whitespace-nowrap`}>BTC-PERP-USDT</td>
                <td className={`px-3 py-0.5 text-label ${colors.text.primary} whitespace-nowrap`}>5.5600%</td>
              </tr>
              <tr className={`border-b ${colors.border.secondary} hover:${colors.bg.subtle} transition-colors`}>
                <td className={`px-3 py-0.5 text-label ${colors.text.tertiary} whitespace-nowrap`}>03/10/2026</td>
                <td className={`px-3 py-0.5 text-label ${colors.text.secondary} whitespace-nowrap`}>Hyperliquid</td>
                <td className={`px-3 py-0.5 text-label ${colors.text.primary} whitespace-nowrap`}>BTC-PERP-USDC</td>
                <td className={`px-3 py-0.5 text-label ${colors.text.primary} whitespace-nowrap`}>10.9500%</td>
              </tr>
              <tr className={`hover:${colors.bg.subtle} transition-colors`}>
                <td className={`px-3 py-0.5 text-label ${colors.text.tertiary} whitespace-nowrap`}>03/10/2026</td>
                <td className={`px-3 py-0.5 text-label ${colors.text.secondary} whitespace-nowrap`}>Paradex</td>
                <td className={`px-3 py-0.5 text-label ${colors.text.primary} whitespace-nowrap`}>BTC-PERP-USDT</td>
                <td className={`px-3 py-0.5 text-label ${colors.text.primary} whitespace-nowrap`}>5.5600%</td>
              </tr>
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}