import { ReactNode, useState } from 'react';
import { useThemeStore } from '../stores/themeStore';

interface TooltipProps {
  children: ReactNode;
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export function Tooltip({ children, content, position = 'top' }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const { theme, colors } = useThemeStore();
  const isDark = theme === 'dark';

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  const arrowClasses = {
    top: 'top-full left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-t-transparent',
    left: 'left-full top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-r-transparent',
    right: 'right-full top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-l-transparent',
  };

  return (
    <div 
      className="relative inline-block"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div className={`absolute ${positionClasses[position]} z-[9999] pointer-events-none`}>
          <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'} border rounded px-3 py-2 text-[12px] leading-relaxed ${colors.text.primary} shadow-lg w-64 normal-case`}>
            {content}
            <div 
              className={`absolute w-0 h-0 border-[6px] ${arrowClasses[position]}`}
              style={{
                borderTopColor: isDark ? '#374151' : '#ffffff',
                borderBottomColor: isDark ? '#374151' : '#ffffff',
                borderLeftColor: isDark ? '#374151' : '#ffffff',
                borderRightColor: isDark ? '#374151' : '#ffffff',
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}