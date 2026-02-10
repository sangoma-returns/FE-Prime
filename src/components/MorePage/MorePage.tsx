import { useThemeStore } from '../../stores/themeStore';

export default function MorePage() {
  const { colors } = useThemeStore();

  return (
    <div className="h-[calc(100vh-3rem-1px)] overflow-y-auto">
      <div className="max-w-[1600px] mx-auto px-6 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-header font-semibold tracking-tight">More</h1>
          <p className={`text-label ${colors.text.tertiary} mt-0.5`}>
            Additional features and settings
          </p>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Placeholder sections */}
          <a 
            href="https://bitfrost-hl.gitbook.io/bitfrost-prime/" 
            target="_blank" 
            rel="noopener noreferrer"
            className={`${colors.bg.secondary} border ${colors.border.secondary} rounded-sm p-6 ${colors.state.hover} transition-colors cursor-pointer`}
          >
            <h2 className={`text-[15px] font-semibold ${colors.text.primary} mb-2`}>
              Documentation
            </h2>
            <p className={`text-body ${colors.text.tertiary}`}>
              Learn how to use Bitfrost and explore our API documentation.
            </p>
          </a>

          <div className={`${colors.bg.secondary} border ${colors.border.secondary} rounded-sm p-6`}>
            <h2 className={`text-[15px] font-semibold ${colors.text.primary} mb-2`}>
              Support
            </h2>
            <p className={`text-body ${colors.text.tertiary}`}>
              Get help from our support team or browse our FAQ.
            </p>
          </div>

          <div className={`${colors.bg.secondary} border ${colors.border.secondary} rounded-sm p-6`}>
            <h2 className={`text-[15px] font-semibold ${colors.text.primary} mb-2`}>
              Settings
            </h2>
            <p className={`text-body ${colors.text.tertiary}`}>
              Manage your account settings and preferences.
            </p>
          </div>

          <div className={`${colors.bg.secondary} border ${colors.border.secondary} rounded-sm p-6`}>
            <h2 className={`text-[15px] font-semibold ${colors.text.primary} mb-2`}>
              Analytics
            </h2>
            <p className={`text-body ${colors.text.tertiary}`}>
              View detailed analytics and performance metrics.
            </p>
          </div>

          <div className={`${colors.bg.secondary} border ${colors.border.secondary} rounded-sm p-6`}>
            <h2 className={`text-[15px] font-semibold ${colors.text.primary} mb-2`}>
              API Access
            </h2>
            <p className={`text-body ${colors.text.tertiary}`}>
              Manage your API keys and access tokens.
            </p>
          </div>

          <div className={`${colors.bg.secondary} border ${colors.border.secondary} rounded-sm p-6`}>
            <h2 className={`text-[15px] font-semibold ${colors.text.primary} mb-2`}>
              Community
            </h2>
            <p className={`text-body ${colors.text.tertiary}`}>
              Join our community and connect with other traders.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}