/**
 * Loading Skeleton Components
 * 
 * Skeleton screens shown while data is loading.
 * Provides visual feedback and maintains layout stability.
 * 
 * Usage:
 * ```tsx
 * {loading ? <PortfolioSkeleton /> : <PortfolioPage data={data} />}
 * ```
 */

import { useThemeStore } from '../../stores/themeStore';

// ============================================================================
// BASE SKELETON COMPONENTS
// ============================================================================

/**
 * Base skeleton box - building block for all skeletons
 */
function SkeletonBox({ className = '' }: { className?: string }) {
  const { theme } = useThemeStore();
  
  return (
    <div
      className={`animate-pulse rounded-sm ${
        theme === 'dark' ? 'bg-gray-800' : 'bg-gray-200'
      } ${className}`}
    />
  );
}

/**
 * Skeleton text line
 */
function SkeletonText({ width = 'w-full', className = '' }: { width?: string; className?: string }) {
  return <SkeletonBox className={`h-4 ${width} ${className}`} />;
}

/**
 * Skeleton circle (for avatars, icons)
 */
function SkeletonCircle({ size = 'w-10 h-10' }: { size?: string }) {
  return <SkeletonBox className={`rounded-full ${size}`} />;
}

// ============================================================================
// PORTFOLIO SKELETON
// ============================================================================

/**
 * Loading skeleton for portfolio page
 */
export function PortfolioSkeleton() {
  const { colors } = useThemeStore();
  
  return (
    <div className="space-y-3">
      {/* Top Stats Cards */}
      <div className="grid grid-cols-3 gap-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className={`${colors.bg.secondary} border ${colors.border.secondary} rounded-sm p-3`}>
            <SkeletonText width="w-20" className="mb-2" />
            <SkeletonText width="w-32" className="h-6 mb-2" />
            <SkeletonText width="w-24" />
          </div>
        ))}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-12 gap-3">
        {/* Sidebar */}
        <div className="col-span-3 space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className={`${colors.bg.secondary} border ${colors.border.secondary} rounded-sm p-3`}>
              <SkeletonText width="w-24" className="mb-3" />
              <SkeletonText width="w-16" className="h-6 mb-2" />
              <SkeletonText width="w-20" />
            </div>
          ))}
        </div>

        {/* Main Content */}
        <div className={`col-span-9 ${colors.bg.secondary} border ${colors.border.secondary} rounded-sm p-4`}>
          <SkeletonText width="w-32" className="mb-4" />
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="mb-3">
              <SkeletonText className="mb-2" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// TABLE SKELETON
// ============================================================================

/**
 * Loading skeleton for data tables
 */
export function TableSkeleton({ rows = 10, columns = 5 }: { rows?: number; columns?: number }) {
  const { colors } = useThemeStore();
  
  return (
    <div className={`${colors.bg.secondary} border ${colors.border.secondary} rounded-sm overflow-hidden`}>
      {/* Header */}
      <div className={`border-b ${colors.border.secondary} p-4`}>
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
          {Array.from({ length: columns }).map((_, i) => (
            <SkeletonText key={i} width="w-20" />
          ))}
        </div>
      </div>

      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div
          key={rowIndex}
          className={`border-b ${colors.border.secondary} p-4 last:border-b-0`}
        >
          <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
            {Array.from({ length: columns }).map((_, colIndex) => (
              <SkeletonText key={colIndex} width="w-full" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// STATS CARD SKELETON
// ============================================================================

/**
 * Loading skeleton for stats cards
 */
export function StatsCardSkeleton() {
  const { colors } = useThemeStore();
  
  return (
    <div className={`${colors.bg.secondary} border ${colors.border.secondary} rounded-sm p-3`}>
      <SkeletonText width="w-20" className="mb-2" />
      <SkeletonText width="w-32" className="h-6 mb-2" />
      <SkeletonText width="w-24" />
    </div>
  );
}

// ============================================================================
// EXCHANGE CARD SKELETON
// ============================================================================

/**
 * Loading skeleton for exchange cards in portfolio
 */
export function ExchangeCardSkeleton() {
  const { colors } = useThemeStore();
  
  return (
    <div className={`${colors.bg.secondary} border ${colors.border.secondary} rounded-sm p-3`}>
      <div className="flex items-center gap-3 mb-3">
        <SkeletonCircle size="w-8 h-8" />
        <div className="flex-1">
          <SkeletonText width="w-24" className="mb-1" />
          <SkeletonText width="w-16" className="h-3" />
        </div>
      </div>
      <SkeletonText width="w-20" className="mb-2" />
      <SkeletonText width="w-32" className="h-5" />
    </div>
  );
}

// ============================================================================
// FUNDING RATE TABLE SKELETON
// ============================================================================

/**
 * Loading skeleton specifically for funding rate explorer table
 */
export function FundingRateTableSkeleton() {
  const { colors } = useThemeStore();
  const exchanges = 8; // Number of exchange columns
  
  return (
    <div className={`${colors.bg.secondary} border ${colors.border.secondary} rounded-sm overflow-hidden`}>
      <div className="overflow-x-auto">
        <table className="w-full">
          {/* Header */}
          <thead>
            <tr className={`border-b ${colors.border.secondary}`}>
              <th className="text-left px-4 py-2.5">
                <SkeletonText width="w-16" />
              </th>
              {Array.from({ length: exchanges }).map((_, i) => (
                <th key={i} className="text-center px-3 py-2.5 min-w-[90px]">
                  <SkeletonText width="w-20" />
                </th>
              ))}
            </tr>
          </thead>

          {/* Body */}
          <tbody>
            {Array.from({ length: 15 }).map((_, rowIndex) => (
              <tr key={rowIndex} className={`border-b ${colors.border.secondary}`}>
                <td className="px-4 py-2">
                  <div className="flex items-center gap-1.5">
                    <SkeletonCircle size="w-3.5 h-3.5" />
                    <SkeletonText width="w-16" />
                  </div>
                </td>
                {Array.from({ length: exchanges }).map((_, colIndex) => (
                  <td key={colIndex} className="px-3 py-2 text-center">
                    <SkeletonText width="w-16" className="mx-auto" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============================================================================
// CARD SKELETON
// ============================================================================

/**
 * Generic card loading skeleton
 */
export function CardSkeleton() {
  const { colors } = useThemeStore();
  
  return (
    <div className={`${colors.bg.secondary} border ${colors.border.secondary} rounded-sm p-4`}>
      <SkeletonText width="w-32" className="mb-4" />
      <SkeletonText className="mb-2" />
      <SkeletonText className="mb-2" />
      <SkeletonText width="w-3/4" />
    </div>
  );
}

// ============================================================================
// LIST SKELETON
// ============================================================================

/**
 * Loading skeleton for lists
 */
export function ListSkeleton({ items = 5 }: { items?: number }) {
  const { colors } = useThemeStore();
  
  return (
    <div className="space-y-2">
      {Array.from({ length: items }).map((_, i) => (
        <div
          key={i}
          className={`flex items-center gap-3 p-3 ${colors.bg.secondary} border ${colors.border.secondary} rounded-sm`}
        >
          <SkeletonCircle size="w-8 h-8" />
          <div className="flex-1">
            <SkeletonText width="w-24" className="mb-1" />
            <SkeletonText width="w-16" className="h-3" />
          </div>
          <SkeletonText width="w-20" />
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// SPINNER
// ============================================================================

/**
 * Simple loading spinner
 * Use for inline loading states
 */
export function Spinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };
  
  return (
    <div className="flex items-center justify-center">
      <div
        className={`${sizeClasses[size]} border-2 border-orange-600 border-t-transparent rounded-full animate-spin`}
      />
    </div>
  );
}

/**
 * Full page loading spinner
 */
export function PageSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <Spinner size="lg" />
        <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">Loading...</p>
      </div>
    </div>
  );
}