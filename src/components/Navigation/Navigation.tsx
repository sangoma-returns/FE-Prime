import { useState, useEffect, useRef } from 'react';
import { Bell, Sun, Moon, LogOut, ChevronDown } from 'lucide-react';
import { useThemeStore } from '../../stores/themeStore';
import { CustomConnectButton } from '../CustomConnectButton';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import bitfrostLogo from 'figma:asset/435714e3b741060d17094f99b2417137fa279348.png';

type Page = 'explore' | 'aggregator' | 'funding-arb' | 'market-maker' | 'portfolio' | 'more';

interface NavigationProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  isWalletConnected?: boolean;
  onDisconnect?: () => void;
  onDeposit?: () => void;
  onWalletConnect?: () => void;
}

export function Navigation({ currentPage, onNavigate, isWalletConnected, onDisconnect, onDeposit, onWalletConnect }: NavigationProps) {
  const { theme, toggleTheme, colors } = useThemeStore();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMoreDropdown, setShowMoreDropdown] = useState(false);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const moreDropdownRef = useRef<HTMLDivElement>(null);
  const [readNotifications, setReadNotifications] = useState<Set<number>>(new Set());
  
  const navItems: { page: Page; label: string; path: string }[] = [
    { page: 'explore', label: 'Explore', path: '/explore' },
    { page: 'aggregator', label: 'Aggregator', path: '/aggregator' },
    { page: 'market-maker', label: 'Market Maker', path: '/market-maker' },
    { page: 'funding-arb', label: 'Carry', path: '/trade' },
    { page: 'portfolio', label: 'Portfolio', path: '/portfolio' },
    { page: 'more', label: 'More', path: '/more' }
  ];

  const notifications = [
    { id: 1, message: 'Your BTC funding rate Arbitrage between Paradex and Hyperliquid has been rebalanced', time: '2m ago' },
    { id: 2, message: 'Your BTC funding rate Arbitrage between Paradex and Hyperliquid has been rebalanced', time: '1h ago' },
    { id: 3, message: 'Your BTC funding rate Arbitrage between Paradex and Hyperliquid has been rebalanced', time: '3h ago' },
    { id: 4, message: 'Funding has been paid to your Hyperliquid account', time: '5h ago' },
  ];

  const handleNotificationClick = (id: number) => {
    setReadNotifications(prev => new Set(prev).add(id));
  };

  // Close notifications when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    }

    if (showNotifications) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showNotifications]);

  // Close more dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (moreDropdownRef.current && !moreDropdownRef.current.contains(event.target as Node)) {
        setShowMoreDropdown(false);
      }
    }

    if (showMoreDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showMoreDropdown]);

  return (
    <nav className={`border-b ${colors.border.default} ${colors.bg.surface}`}>
      <div className="w-full">
        <div className="flex items-center justify-between h-12 px-4">
          <div className="flex items-center gap-6">
            {/* Logo */}
            <ImageWithFallback
              src={bitfrostLogo}
              alt="Bitfrost Logo"
              className={`h-6 ${colors.text.primary}`}
            />
            
            {/* Navigation Items */}
            <div className="flex gap-1">
              {navItems.map((item) => {
                if (item.page === 'more') {
                  return (
                    <div key={item.page} className="relative" ref={moreDropdownRef}>
                      <button
                        onClick={() => setShowMoreDropdown(!showMoreDropdown)}
                        className={`h-7 px-3 rounded text-button transition-colors flex items-center gap-1 ${
                          showMoreDropdown || currentPage === 'more'
                            ? `${colors.button.primaryBg} ${colors.button.primaryText}`
                            : `${colors.text.secondary} ${colors.state.hover}`
                        }`}
                      >
                        {item.label}
                        <ChevronDown className="w-3 h-3" />
                      </button>
                      
                      {/* Dropdown Menu */}
                      {showMoreDropdown && (
                        <div className={`absolute left-0 top-full mt-1 w-64 ${colors.bg.surface} border ${colors.border.default} rounded shadow-lg z-50`}>
                          <button
                            onClick={() => {
                              window.history.pushState({}, '', '/blockchain-explorer');
                              window.dispatchEvent(new PopStateEvent('popstate'));
                              setShowMoreDropdown(false);
                            }}
                            className={`w-full text-left px-4 py-2 text-label ${colors.text.secondary} ${colors.state.hover} transition-colors first:rounded-t last:rounded-b`}
                          >
                            Explorer
                          </button>
                          <a
                            href="https://bitfrost-hl.gitbook.io/bitfrost-prime/"
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => setShowMoreDropdown(false)}
                            className={`w-full text-left px-4 py-2 text-label ${colors.text.secondary} ${colors.state.hover} transition-colors block`}
                          >
                            Documentation
                          </a>
                          <button
                            disabled
                            className={`w-full text-left px-4 py-2 text-label cursor-not-allowed transition-colors flex items-center justify-between gap-2`}
                          >
                            <span className={`${colors.text.secondary} opacity-50`}>API</span>
                            <span className="text-[9px] px-1.5 py-0.5 bg-[#C9A36A] text-white rounded font-medium whitespace-nowrap">
                              COMING SOON
                            </span>
                          </button>
                          <button
                            disabled
                            className={`w-full text-left px-4 py-2 text-label cursor-not-allowed transition-colors first:rounded-t last:rounded-b flex items-center justify-between gap-2`}
                          >
                            <span className={`${colors.text.secondary} opacity-50`}>Settings</span>
                            <span className="text-[9px] px-1.5 py-0.5 bg-[#C9A36A] text-white rounded font-medium whitespace-nowrap">
                              COMING SOON
                            </span>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                }
                
                return (
                  <button
                    key={item.page}
                    onClick={() => {
                      // Use ONLY onNavigate - don't double-navigate
                      onNavigate(item.page);
                    }}
                    className={`h-7 px-3 rounded text-button transition-colors flex items-center gap-1 ${
                      currentPage === item.page
                        ? `${colors.button.primaryBg} ${colors.button.primaryText}`
                        : `${colors.text.secondary} ${colors.state.hover}`
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Wallet Connection - Using CustomConnectButton */}
            {isWalletConnected ? (
              <>
                <div className={`h-7 px-2.5 flex items-center ${colors.bg.subtle} border ${colors.border.default} rounded`}>
                  <div className="w-1.5 h-1.5 rounded-full bg-[#1FBF75] mr-1.5"></div>
                  <span className={`text-label ${colors.text.secondary}`}>Connected</span>
                </div>
                <button
                  onClick={onDisconnect}
                  className={`h-7 px-2.5 flex items-center gap-1.5 ${colors.bg.surface} border ${colors.border.default} rounded text-button ${colors.text.secondary} ${colors.state.hover} transition-colors`}
                >
                  <LogOut className="w-3 h-3" />
                  <span className="text-label">Disconnect</span>
                </button>
              </>
            ) : (
              <CustomConnectButton />
            )}
            <button
              onClick={toggleTheme}
              className={`h-7 w-7 flex items-center justify-center ${colors.bg.surface} border ${colors.border.default} rounded ${colors.text.secondary} ${colors.state.hover} transition-colors`}
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            </button>
            {isWalletConnected && (
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className={`h-7 w-7 flex items-center justify-center ${colors.bg.surface} border ${colors.border.default} rounded ${colors.text.secondary} ${colors.state.hover} transition-colors relative`}
                  aria-label="Notifications"
                >
                  <Bell className="w-3.5 h-3.5" />
                  {readNotifications.size < notifications.length && (
                    <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-red-500 rounded-full"></span>
                  )}
                </button>
                
                {showNotifications && (
                  <div className={`absolute right-0 top-full mt-1 w-80 ${colors.bg.surface} border ${colors.border.default} rounded shadow-lg z-50`} ref={notificationsRef}>
                    <div className={`px-3 py-2 border-b ${colors.border.secondary}`}>
                      <h3 className={`text-button ${colors.text.primary}`}>Notifications</h3>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {notifications.map((notification) => {
                        const isUnread = !readNotifications.has(notification.id);
                        return (
                          <div
                            key={notification.id}
                            className={`px-3 py-2 border-b ${colors.border.secondary} cursor-pointer transition-colors ${
                              isUnread 
                                ? 'bg-green-500/10 hover:bg-green-500/20' 
                                : colors.state.hover
                            }`}
                            onClick={() => handleNotificationClick(notification.id)}
                          >
                            <p className={`text-label ${colors.text.secondary} mb-1`}>
                              {notification.message}
                            </p>
                            <span className={`text-label ${colors.text.tertiary}`}>{notification.time}</span>
                          </div>
                        );
                      })}
                    </div>
                    <div className={`px-3 py-2 text-center border-t ${colors.border.secondary}`}>
                      <button className={`text-label ${colors.text.secondary} ${colors.text.hoverPrimary} transition-colors`}>
                        View all notifications
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navigation;