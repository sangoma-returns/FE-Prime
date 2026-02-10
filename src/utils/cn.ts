// Utility for conditional class names with theme support
export function cn(...classes: (string | undefined | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

// Theme-aware class name builder
export function themeAware(isDark: boolean, darkClass: string, lightClass: string): string {
  return isDark ? darkClass : lightClass;
}

// Common theme classes
export const theme = {
  card: (isDark: boolean) => 
    isDark ? 'bg-[#1a1a1a] border border-[#2a2a2a]' : 'bg-white border border-gray-200',
  
  cardHover: (isDark: boolean) =>
    isDark ? 'bg-[#1a1a1a] border border-[#2a2a2a] hover:border-[#3a3a3a]' : 'bg-white border border-gray-200 hover:border-gray-300',
  
  input: (isDark: boolean) =>
    isDark ? 'bg-[#0a0a0a] border border-[#2a2a2a]' : 'bg-white border border-gray-200',
  
  button: (isDark: boolean) =>
    isDark ? 'bg-[#0a0a0a] border border-[#2a2a2a] hover:bg-[#2a2a2a] text-gray-400' : 'bg-white border border-gray-200 hover:bg-gray-50 text-gray-600',
  
  text: {
    primary: (isDark: boolean) => isDark ? 'text-white' : 'text-gray-900',
    secondary: (isDark: boolean) => isDark ? 'text-gray-400' : 'text-gray-600',
    tertiary: (isDark: boolean) => isDark ? 'text-gray-500' : 'text-gray-500',
    quaternary: (isDark: boolean) => isDark ? 'text-gray-600' : 'text-gray-400',
  },
  
  hover: {
    text: (isDark: boolean) => isDark ? 'hover:text-white' : 'hover:text-gray-900',
    bg: (isDark: boolean) => isDark ? 'hover:bg-[#0a0a0a]' : 'hover:bg-gray-50',
  },
  
  border: {
    primary: (isDark: boolean) => isDark ? 'border-[#1a1a1a]' : 'border-gray-100',
    secondary: (isDark: boolean) => isDark ? 'border-[#2a2a2a]' : 'border-gray-200',
  },
  
  bg: {
    primary: (isDark: boolean) => isDark ? 'bg-[#0a0a0a]' : 'bg-[#fafafa]',
    secondary: (isDark: boolean) => isDark ? 'bg-[#1a1a1a]' : 'bg-white',
    tertiary: (isDark: boolean) => isDark ? 'bg-[#2a2a2a]' : 'bg-gray-50',
  },
};