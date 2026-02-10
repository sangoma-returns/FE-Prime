// Helper function to get theme-aware class names
export function getThemeClass(isDark: boolean, darkClass: string, lightClass: string): string {
  return isDark ? darkClass : lightClass;
}

// Common theme-aware class combinations
export const themeClasses = {
  card: (isDark: boolean) => isDark 
    ? 'bg-[#1a1a1a] border border-[#2a2a2a]'
    : 'bg-white border border-gray-200',
  
  cardHover: (isDark: boolean) => isDark
    ? 'bg-[#1a1a1a] border border-[#2a2a2a] hover:border-[#3a3a3a]'
    : 'bg-white border border-gray-200 hover:border-gray-300',
  
  input: (isDark: boolean) => isDark
    ? 'bg-[#0a0a0a] border border-[#2a2a2a]'
    : 'bg-white border border-gray-200',
  
  button: (isDark: boolean) => isDark
    ? 'bg-[#0a0a0a] border border-[#2a2a2a] hover:bg-[#2a2a2a] text-gray-400'
    : 'bg-white border border-gray-200 hover:bg-gray-50 text-gray-600',
  
  textPrimary: (isDark: boolean) => isDark ? 'text-white' : 'text-gray-900',
  textSecondary: (isDark: boolean) => isDark ? 'text-gray-400' : 'text-gray-600',
  textTertiary: (isDark: boolean) => isDark ? 'text-gray-500' : 'text-gray-500',
  
  borderPrimary: (isDark: boolean) => isDark ? 'border-[#1a1a1a]' : 'border-gray-100',
  borderSecondary: (isDark: boolean) => isDark ? 'border-[#2a2a2a]' : 'border-gray-200',
  
  bgPrimary: (isDark: boolean) => isDark ? 'bg-[#0a0a0a]' : 'bg-[#fafafa]',
  bgSecondary: (isDark: boolean) => isDark ? 'bg-[#1a1a1a]' : 'bg-white',
  bgTertiary: (isDark: boolean) => isDark ? 'bg-[#2a2a2a]' : 'bg-gray-50',
  
  hoverBg: (isDark: boolean) => isDark ? 'hover:bg-[#0a0a0a]' : 'hover:bg-gray-50',
  
  modalOverlay: (isDark: boolean) => isDark 
    ? 'bg-black/50 backdrop-blur-sm'
    : 'bg-black/20 backdrop-blur-sm',
};