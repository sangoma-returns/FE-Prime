import { X, Wallet } from 'lucide-react';
import { useThemeStore } from '../../stores/themeStore';
import logoImage from 'figma:asset/5d88ba152280299bda7c6815cda2cd6ce96bab15.png';
import { CustomConnectButton } from '../CustomConnectButton';

export function LoginModal() {
  const { theme, colors } = useThemeStore();
  const isDark = theme === 'dark';
  
  return (
    <div className={`fixed inset-0 ${isDark ? 'bg-black/90' : 'bg-black/10'} backdrop-blur-sm flex items-center justify-center z-50`}>
      <div className="relative w-full max-w-sm p-4">
        <div className={`${colors.bg.surface} rounded-lg p-6 border ${colors.border.default}`}>
          {/* Logo */}
          <div className="flex justify-center mb-5">
            <img src={logoImage} alt="Bitfrost" className="h-6" />
          </div>

          <h2 className={`text-center text-[15px] font-semibold mb-1.5 ${colors.text.primary} tracking-tight`}>Connect Wallet</h2>
          <p className={`text-center ${colors.text.secondary} text-body mb-5`}>
            Connect your wallet to access Bitfrost
          </p>

          {/* Connect Wallet Button - Using CustomConnectButton */}
          <CustomConnectButton fullWidth />
        </div>
      </div>
    </div>
  );
}