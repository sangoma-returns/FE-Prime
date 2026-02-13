
  import { defineConfig } from 'vite';
  import react from '@vitejs/plugin-react-swc';
  import path from 'path';

  export default defineConfig({
    plugins: [react()],
    resolve: {
      extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
      alias: {
        'vaul@1.1.2': 'vaul',
        'sonner@2.0.3': 'sonner',
        'react-resizable-panels@2.1.7': 'react-resizable-panels',
        'react-hook-form@7.55.0': 'react-hook-form',
        'react-day-picker@8.10.1': 'react-day-picker',
        'input-otp@1.4.2': 'input-otp',
        'figma:asset/5d88ba152280299bda7c6815cda2cd6ce96bab15.png': path.resolve(__dirname, './src/assets/5d88ba152280299bda7c6815cda2cd6ce96bab15.png'),
        'figma:asset/435714e3b741060d17094f99b2417137fa279348.png': path.resolve(__dirname, './src/assets/435714e3b741060d17094f99b2417137fa279348.png'),
        'embla-carousel-react@8.6.0': 'embla-carousel-react',
        'cmdk@1.1.1': 'cmdk',
        '@jsr/supabase__supabase-js@2.49.8': '@jsr/supabase__supabase-js',
        '@': path.resolve(__dirname, './src'),
      },
    },
    build: {
      target: 'esnext',
      outDir: 'build',
    },
    server: {
      port: 3000,
      open: true,
    },
  });