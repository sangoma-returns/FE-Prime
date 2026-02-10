import { useState, useEffect, useRef } from 'react';
import { useThemeStore } from '../../stores/themeStore';
import { ExternalLink, Search, ChevronLeft, ChevronRight } from 'lucide-react';

interface Transaction {
  hash: string;
  action: string;
  block: number;
  time: string;
  user: string;
  status: 'success' | 'pending' | 'failed';
}

// Mock transaction data
const mockTransactions: Transaction[] = [
  {
    hash: '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b',
    action: 'Deposit USDC',
    block: 12345678,
    time: '2 mins ago',
    user: '0x742d...4e89',
    status: 'success',
  },
  {
    hash: '0x2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c',
    action: 'Execute Trade',
    block: 12345677,
    time: '5 mins ago',
    user: '0x742d...4e89',
    status: 'success',
  },
  {
    hash: '0x3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d',
    action: 'Withdraw USDC',
    block: 12345676,
    time: '15 mins ago',
    user: '0x8f3a...2c91',
    status: 'pending',
  },
  {
    hash: '0x4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e',
    action: 'Transfer Funds',
    block: 12345675,
    time: '1 hour ago',
    user: '0x742d...4e89',
    status: 'success',
  },
  {
    hash: '0x5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f',
    action: 'Deposit USDC',
    block: 12345674,
    time: '2 hours ago',
    user: '0x8f3a...2c91',
    status: 'success',
  },
  {
    hash: '0x6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a',
    action: 'Execute Trade',
    block: 12345673,
    time: '3 hours ago',
    user: '0x5b2e...7f43',
    status: 'success',
  },
  {
    hash: '0x7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b',
    action: 'Deposit USDC',
    block: 12345672,
    time: '5 hours ago',
    user: '0x742d...4e89',
    status: 'failed',
  },
];

const actions = ['Deposit USDC', 'Execute Trade', 'Withdraw USDC', 'Transfer Funds', 'Swap Tokens', 'Add Liquidity'];
const users = ['0x742d...4e89', '0x8f3a...2c91', '0x5b2e...7f43', '0x9c4a...1d52', '0x3f8b...6e21'];

const generateRandomHash = () => {
  const chars = '0123456789abcdef';
  let hash = '0x';
  for (let i = 0; i < 64; i++) {
    hash += chars[Math.floor(Math.random() * chars.length)];
  }
  return hash;
};

export function BlockchainExplorerPage() {
  const { theme, colors } = useThemeStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'success' | 'pending' | 'failed'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [transactions, setTransactions] = useState<Transaction[]>(mockTransactions);
  const [newTransactionIds, setNewTransactionIds] = useState<Set<string>>(new Set());
  const blockCounterRef = useRef(12345679);

  // Live transaction updates
  useEffect(() => {
    const interval = setInterval(() => {
      const newTransaction: Transaction = {
        hash: generateRandomHash(),
        action: actions[Math.floor(Math.random() * actions.length)],
        block: blockCounterRef.current++,
        time: 'Just now',
        user: users[Math.floor(Math.random() * users.length)],
        status: Math.random() > 0.05 ? 'success' : (Math.random() > 0.5 ? 'pending' : 'failed'),
      };

      setTransactions(prev => [newTransaction, ...prev].slice(0, 50)); // Keep only last 50
      setNewTransactionIds(prev => new Set(prev).add(newTransaction.hash));
      
      // Remove highlight after animation
      setTimeout(() => {
        setNewTransactionIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(newTransaction.hash);
          return newSet;
        });
      }, 2000);
    }, 2000 + Math.random() * 3000); // Random interval between 2-5 seconds

    return () => clearInterval(interval);
  }, []);

  const filteredTransactions = transactions.filter(tx => {
    const matchesSearch = 
      tx.hash.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.user.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = filterStatus === 'all' || tx.status === filterStatus;
    
    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'text-green-600';
      case 'pending':
        return 'text-yellow-600';
      case 'failed':
        return 'text-red-600';
      default:
        return colors.text.secondary;
    }
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = 'px-2 py-1 rounded text-xs font-medium';
    switch (status) {
      case 'success':
        return `${baseClasses} bg-green-100 text-green-700`;
      case 'pending':
        return `${baseClasses} bg-yellow-100 text-yellow-700`;
      case 'failed':
        return `${baseClasses} bg-red-100 text-red-700`;
      default:
        return baseClasses;
    }
  };

  const indexOfLastTransaction = currentPage * rowsPerPage;
  const indexOfFirstTransaction = indexOfLastTransaction - rowsPerPage;
  const currentTransactions = filteredTransactions.slice(indexOfFirstTransaction, indexOfLastTransaction);

  const totalPages = Math.ceil(filteredTransactions.length / rowsPerPage);

  const handlePageChange = (newPage: number) => {
    if (newPage > 0 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  return (
    <div className={`min-h-screen ${colors.bg.subtle} ${colors.text.primary} p-8`}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-display">Blockchain Explorer</h1>
            <span className="flex items-center gap-2 px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-medium">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              Live
            </span>
          </div>
          <p className={`text-body ${colors.text.secondary}`}>
            View transaction history on Bitfrost Prime
          </p>
        </div>

        {/* Search and Filters */}
        <div className="flex gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${colors.text.tertiary}`} />
            <input
              type="text"
              placeholder="Search by hash, action, or user..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-10 pr-4 py-2 rounded border ${colors.border} ${colors.bg.surface} ${colors.text.primary} text-body focus:outline-none focus:ring-2 focus:ring-blue-500`}
            />
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-4 py-2 rounded text-label transition-colors ${
                filterStatus === 'all'
                  ? 'bg-[#C9A36A] text-white'
                  : `${colors.bg.secondary} ${colors.text.secondary} ${colors.bg.hover}`
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterStatus('success')}
              className={`px-4 py-2 rounded text-label transition-colors ${
                filterStatus === 'success'
                  ? 'bg-green-600 text-white'
                  : `${colors.bg.secondary} ${colors.text.secondary} ${colors.bg.hover}`
              }`}
            >
              Success
            </button>
            <button
              onClick={() => setFilterStatus('pending')}
              className={`px-4 py-2 rounded text-label transition-colors ${
                filterStatus === 'pending'
                  ? 'bg-yellow-600 text-white'
                  : `${colors.bg.secondary} ${colors.text.secondary} ${colors.bg.hover}`
              }`}
            >
              Pending
            </button>
            <button
              onClick={() => setFilterStatus('failed')}
              className={`px-4 py-2 rounded text-label transition-colors ${
                filterStatus === 'failed'
                  ? 'bg-red-600 text-white'
                  : `${colors.bg.secondary} ${colors.text.secondary} ${colors.bg.hover}`
              }`}
            >
              Failed
            </button>
          </div>
        </div>

        {/* Transactions Table */}
        <div className={`${colors.bg.surface} border ${colors.border} rounded-lg overflow-hidden`}>
          <table className="w-full">
            <thead className={`${colors.bg.secondary} border-b ${colors.border}`}>
              <tr>
                <th className={`text-left px-6 py-4 text-label ${colors.text.secondary} font-medium`}>
                  Transaction Hash
                </th>
                <th className={`text-left px-6 py-4 text-label ${colors.text.secondary} font-medium`}>
                  Action
                </th>
                <th className={`text-left px-6 py-4 text-label ${colors.text.secondary} font-medium`}>
                  Block
                </th>
                <th className={`text-left px-6 py-4 text-label ${colors.text.secondary} font-medium`}>
                  Time
                </th>
                <th className={`text-left px-6 py-4 text-label ${colors.text.secondary} font-medium`}>
                  User
                </th>
                <th className={`text-left px-6 py-4 text-label ${colors.text.secondary} font-medium`}>
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {currentTransactions.map((tx, index) => (
                <tr
                  key={tx.hash}
                  className={`border-b ${colors.border} ${colors.bg.hover} transition-all duration-500 ${
                    newTransactionIds.has(tx.hash) 
                      ? theme === 'dark' 
                        ? 'bg-blue-900/30 animate-pulse' 
                        : 'bg-blue-100 animate-pulse' 
                      : ''
                  }`}
                  style={{
                    animation: newTransactionIds.has(tx.hash) ? 'slideIn 0.5s ease-out' : undefined
                  }}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <code className={`text-label font-mono ${colors.text.primary}`}>
                        {tx.hash.substring(0, 16)}...
                      </code>
                      <button
                        onClick={() => window.open(`https://explorer.hyperevmtest.com/tx/${tx.hash}`, '_blank')}
                        className={`${colors.text.tertiary} hover:text-blue-600 transition-colors`}
                      >
                        <ExternalLink className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                  <td className={`px-6 py-4 text-body ${colors.text.primary}`}>
                    {tx.action}
                  </td>
                  <td className={`px-6 py-4 text-body font-mono ${colors.text.secondary}`}>
                    {tx.block.toLocaleString()}
                  </td>
                  <td className={`px-6 py-4 text-body ${colors.text.secondary}`}>
                    {tx.time}
                  </td>
                  <td className="px-6 py-4">
                    <code className={`text-label font-mono ${colors.text.secondary}`}>
                      {tx.user}
                    </code>
                  </td>
                  <td className="px-6 py-4">
                    <span className={getStatusBadge(tx.status)}>
                      {tx.status.charAt(0).toUpperCase() + tx.status.slice(1)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {currentTransactions.length === 0 && filteredTransactions.length === 0 && (
            <div className={`text-center py-12 ${colors.text.secondary}`}>
              <p className="text-body">No transactions found</p>
            </div>
          )}
          
          {/* Pagination Bar */}
          <div className={`${colors.bg.secondary} border-t ${colors.border} px-6 py-3 flex items-center justify-between`}>
            <div className="flex items-center gap-4">
              <span className={`${colors.text.secondary} text-label`}>Rows per page:</span>
              <select
                value={rowsPerPage}
                onChange={(e) => {
                  setRowsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className={`bg-transparent ${colors.text.primary} text-label border-none focus:outline-none cursor-pointer`}
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
            
            <div className="flex items-center gap-4">
              <span className={`${colors.text.secondary} text-label`}>
                {indexOfFirstTransaction + 1}-{Math.min(indexOfLastTransaction, 300)} of 300
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage <= 1}
                  className={`${colors.text.secondary} disabled:opacity-30 disabled:cursor-not-allowed hover:opacity-75 transition-opacity`}
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage >= totalPages}
                  className={`${colors.text.secondary} disabled:opacity-30 disabled:cursor-not-allowed hover:opacity-75 transition-opacity`}
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-6 grid grid-cols-4 gap-4">
          <div className={`${colors.bg.surface} border ${colors.border} rounded-lg p-4`}>
            <div className={`text-label ${colors.text.secondary} mb-1`}>Total Transactions (24hrs)</div>
            <div className="text-title">37,863</div>
          </div>
          <div className={`${colors.bg.surface} border ${colors.border} rounded-lg p-4`}>
            <div className={`text-label ${colors.text.secondary} mb-1`}>Success Rate</div>
            <div className="text-title text-green-600">
              99.97%
            </div>
          </div>
          <div className={`${colors.bg.surface} border ${colors.border} rounded-lg p-4`}>
            <div className={`text-label ${colors.text.secondary} mb-1`}>Pending</div>
            <div className="text-title text-yellow-600">
              {mockTransactions.filter(tx => tx.status === 'pending').length}
            </div>
          </div>
          <div className={`${colors.bg.surface} border ${colors.border} rounded-lg p-4`}>
            <div className={`text-label ${colors.text.secondary} mb-1`}>Failed</div>
            <div className="text-title text-red-600">
              {mockTransactions.filter(tx => tx.status === 'failed').length}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}