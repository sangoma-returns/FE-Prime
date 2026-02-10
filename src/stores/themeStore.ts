/**
 * Theme Store (Zustand)
 * 
 * Manages application theme and color system.
 * Replaces ThemeContext with better performance and simpler API.
 * 
 * Features:
 * - Theme switching (light/dark)
 * - Color token system
 * - localStorage persistence
 * - Document class updates
 * 
 * @example
 * ```tsx
 * const { theme, colors, toggleTheme } = useThemeStore();
 * 
 * // Use theme
 * const isDark = theme === 'dark';
 * 
 * // Toggle theme
 * <button onClick={toggleTheme}>Toggle Theme</button>
 * 
 * // Use colors
 * <div className={colors.bg.primary}>Content</div>
 * ```
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

// ============================================================================
// TYPES
// ============================================================================

export type Theme = 'light' | 'dark';

export interface ThemeColors {
  bg: {
    primary: string;
    secondary: string;
    surface: string;
    subtle: string;
    hover: string;
  };
  text: {
    primary: string;
    secondary: string;
    tertiary: string;
    hoverPrimary?: string;
  };
  border: {
    default: string;
    primary: string;
    secondary: string;
    divider: string;
  };
  accent: {
    positive: string;
    negative: string;
    neutral: string;
  };
  button: {
    primaryBg: string;
    primaryText: string;
    dangerBg: string;
    dangerText: string;
  };
  input: {
    bg: string;
    border: string;
    text: string;
    placeholder: string;
  };
  state: {
    hover: string;
    active: string;
    focus: string;
  };
}

interface ThemeState {
  /** Current theme mode */
  theme: Theme;
  /** Color tokens for current theme */
  colors: ThemeColors;
}

interface ThemeActions {
  /** Toggle between light and dark theme */
  toggleTheme: () => void;
  /** Set specific theme */
  setTheme: (theme: Theme) => void;
}

// ============================================================================
// COLOR DEFINITIONS
// ============================================================================

const lightColors: ThemeColors = {
  bg: {
    primary: 'bg-[#F7F5EF]',
    secondary: 'bg-[#FAFAF8]',
    surface: 'bg-white',
    subtle: 'bg-[#F1EEE6]',
    hover: 'hover:bg-black/[0.04]',
  },
  text: {
    primary: 'text-[#1C1C1C]',
    secondary: 'text-[#6B6B6B]',
    tertiary: 'text-[#9A9A9A]',
    hoverPrimary: 'hover:text-[#1C1C1C]',
  },
  border: {
    default: 'border-black/[0.08]',
    primary: 'border-black/[0.08]',
    secondary: 'border-black/[0.06]',
    divider: 'border-black/[0.06]',
  },
  accent: {
    positive: 'text-[#1FBF75]',
    negative: 'text-[#E24A4A]',
    neutral: 'text-[#C9C5BA]',
  },
  button: {
    primaryBg: 'bg-[#C9A36A]',
    primaryText: 'text-white',
    dangerBg: 'bg-[#E24A4A]',
    dangerText: 'text-white',
  },
  input: {
    bg: 'bg-white',
    border: 'border-black/[0.08]',
    text: 'text-[#1C1C1C]',
    placeholder: 'placeholder:text-[#9A9A9A]',
  },
  state: {
    hover: 'hover:bg-black/[0.04]',
    active: 'active:bg-black/[0.08]',
    focus: 'focus:outline-[#C9A36A] focus:outline-2',
  },
};

const darkColors: ThemeColors = {
  bg: {
    primary: 'bg-[#0a0a0a]',
    secondary: 'bg-[#151515]',
    surface: 'bg-[#1a1a1a]',
    subtle: 'bg-[#2a2a2a]',
    hover: 'hover:bg-white/[0.04]',
  },
  text: {
    primary: 'text-white',
    secondary: 'text-gray-400',
    tertiary: 'text-gray-500',
    hoverPrimary: 'hover:text-white',
  },
  border: {
    default: 'border-[#2a2a2a]',
    primary: 'border-[#2a2a2a]',
    secondary: 'border-[#333333]',
    divider: 'border-white/[0.06]',
  },
  accent: {
    positive: 'text-green-500',
    negative: 'text-red-500',
    neutral: 'text-gray-500',
  },
  button: {
    primaryBg: 'bg-orange-600',
    primaryText: 'text-white',
    dangerBg: 'bg-red-600',
    dangerText: 'text-white',
  },
  input: {
    bg: 'bg-[#1a1a1a]',
    border: 'border-[#2a2a2a]',
    text: 'text-white',
    placeholder: 'placeholder:text-gray-500',
  },
  state: {
    hover: 'hover:bg-white/[0.04]',
    active: 'active:bg-white/[0.08]',
    focus: 'focus:outline-orange-600 focus:outline-2',
  },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get colors for a specific theme
 */
function getColorsForTheme(theme: Theme): ThemeColors {
  return theme === 'light' ? lightColors : darkColors;
}

/**
 * Update document class for theme
 */
function updateDocumentTheme(theme: Theme): void {
  if (theme === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}

// ============================================================================
// STORE
// ============================================================================

/**
 * Theme Store
 * 
 * Manages theme state with localStorage persistence and automatic
 * document class updates.
 */
export const useThemeStore = create<ThemeState & ThemeActions>()(
  devtools(
    persist(
      (set) => ({
        // Initial state
        theme: 'light',
        colors: lightColors,

        // Actions
        toggleTheme: () =>
          set(
            (state) => {
              const newTheme = state.theme === 'light' ? 'dark' : 'light';
              const newColors = getColorsForTheme(newTheme);
              
              // Update document class
              updateDocumentTheme(newTheme);
              
              return {
                theme: newTheme,
                colors: newColors,
              };
            },
            false,
            'theme/toggle'
          ),

        setTheme: (theme: Theme) =>
          set(
            () => {
              const newColors = getColorsForTheme(theme);
              
              // Update document class
              updateDocumentTheme(theme);
              
              return {
                theme,
                colors: newColors,
              };
            },
            false,
            'theme/set'
          ),
      }),
      {
        name: 'theme-storage',
        // Only persist theme, not colors (colors are derived)
        partialize: (state) => ({ theme: state.theme }),
        // Rehydrate colors on load
        onRehydrateStorage: () => (state) => {
          if (state) {
            // Update colors based on persisted theme
            state.colors = getColorsForTheme(state.theme);
            // Update document class
            updateDocumentTheme(state.theme);
          }
        },
      }
    ),
    { name: 'ThemeStore' }
  )
);

export default useThemeStore;
