# Bitfrost Prime - Funding Rate Arbitrage Platform

A professional funding rate arbitrage application powered by TSS with wallet authentication, portfolio tracking, and multi-exchange integration.

## 🚀 Features

- **Wallet-Only Authentication** - Mock wallet connection system for demo purposes
- **Portfolio Tracking** - Real-time portfolio monitoring with analytics
- **Multi-Exchange Support** - Hyperliquid, Paradex, Aster, Binance, Bybit, OKX
- **USDC Deposits** - Deposit from HyperEVM (testnet: 998, mainnet: 999)
- **Funding Rate Explorer** - Live funding rates with automated arbitrage workflow
- **Strategy Monitoring** - Comprehensive market maker analytics
- **Professional UI** - Light institutional design with Inter font and 8-point grid system
- **Theme System** - Golden brass primary buttons (#C9A36A) and refined typography

## 📋 Prerequisites

- **Node.js** 18+ (recommended: 20.x)
- **npm** or **yarn** or **pnpm**
- **Vercel Account** (for deployment)

## 🛠️ Installation

### 1. Clone or Download the Project

```bash
# If you have the code in a git repository
git clone <your-repo-url>
cd bitfrost-app

# Or if you downloaded the code from Figma Make
cd bitfrost-app
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
# or
pnpm install
```

### 3. Environment Variables

Create a `.env` file in the root directory:

```bash
# Network Configuration (testnet or mainnet)
VITE_NETWORK=testnet

# Backend API URL (DO NOT CHANGE)
VITE_API_BASE_URL=https://api.prime.testnet.bitfrost.ai

# HyperEVM Configuration (Already configured in constants/app.ts)
# Testnet Chain ID: 998
# Mainnet Chain ID: 999

# Optional: WalletConnect Project ID (for future real wallet integration)
# VITE_WALLETCONNECT_PROJECT_ID=your-project-id-here
```

**⚠️ Important Notes:**
- The API URL `https://api.prime.testnet.bitfrost.ai` should **NEVER** be changed
- HyperEVM chain IDs are hardcoded: testnet=998, mainnet=999
- Current implementation uses a **mock wallet** system (no real blockchain interaction)

## 🏃 Local Development

Start the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

The app will be available at `http://localhost:5173`

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking

## 🌐 Deploy to Vercel

### Method 1: Deploy via Vercel CLI (Recommended)

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   vercel
   ```

4. **Follow the prompts:**
   - Set up and deploy: `Y`
   - Which scope: Select your account/team
   - Link to existing project: `N` (first time)
   - Project name: `bitfrost-prime` (or your preferred name)
   - Directory: `./` (press Enter)
   - Override settings: `N`

5. **Production Deployment**
   ```bash
   vercel --prod
   ```

### Method 2: Deploy via Vercel Dashboard

1. **Push your code to GitHub/GitLab/Bitbucket**

2. **Go to [Vercel Dashboard](https://vercel.com/new)**

3. **Import your repository**
   - Click "Add New..." → "Project"
   - Select your Git provider
   - Import your repository

4. **Configure Build Settings**
   ```
   Framework Preset: Vite
   Build Command: npm run build
   Output Directory: dist
   Install Command: npm install
   ```

5. **Add Environment Variables**
   
   In the Vercel dashboard under "Environment Variables", add:
   ```
   VITE_NETWORK=testnet
   VITE_API_BASE_URL=https://api.prime.testnet.bitfrost.ai
   ```

6. **Deploy**
   - Click "Deploy"
   - Wait for build to complete
   - Your app will be live at `https://your-project.vercel.app`

### Method 3: Deploy Button

Add this to your repository for one-click deployment:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=YOUR_REPO_URL)

## 🔧 Configuration

### Network Switching

To switch between testnet and mainnet, update the `.env` file:

```bash
# For testnet (Chain ID: 998)
VITE_NETWORK=testnet

# For mainnet (Chain ID: 999)
VITE_NETWORK=mainnet
```

### Exchange Selection

Users select which exchanges to connect during onboarding:
- Hyperliquid
- Paradex
- Aster
- Binance
- Bybit
- OKX

Only selected exchanges become interactive throughout the app.

### Theme Customization

The app uses a sophisticated theme system with:
- **Primary Button Color**: Golden Brass (#C9A36A)
- **Font Family**: Inter
- **Grid System**: 8-point spacing
- **Design**: Light institutional aesthetic

Edit `/styles/globals.css` to customize the theme tokens.

## 📁 Project Structure

```
bitfrost-app/
├── components/           # React components
│   ├── AppModals/       # Modal components
│   ├── AppRouter/       # Routing logic
│   ├── Navigation/      # Navigation bar
│   ├── Portfolio/       # Portfolio components
│   ├── Explore/         # Funding rate explorer
│   ├── Trade/           # Trading interface
│   └── ui/              # Reusable UI components
├── contexts/            # React contexts
│   └── MockWalletContext.tsx  # Mock wallet provider
├── hooks/               # Custom React hooks
├── stores/              # Zustand state management
├── utils/               # Utility functions
├── constants/           # App constants and config
├── styles/              # Global styles and themes
├── App.tsx             # Main application component
└── main.tsx            # Application entry point
```

## 🧪 Testing the Application

### Mock Wallet Connection

1. Click "Connect Wallet" button
2. Wallet automatically connects with a mock address
3. Navigate through the app with full authentication

### Testing Arbitrage Workflow

1. Go to **Explore** page
2. Click on two funding rate cells (they highlight in blue)
3. Automatically navigates to **Trade** page
4. Buy/sell exchanges and tokens are pre-filled

### Testing Deposits

1. Click "Deposit" in navigation
2. Modal opens with USDC deposit form
3. Connected to HyperEVM (testnet: 998 or mainnet: 999)

## 🐛 Troubleshooting

### Build Errors

**Problem:** Build fails with dependency errors
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

**Problem:** TypeScript errors
```bash
# Run type check to see all errors
npm run type-check
```

### Deployment Issues

**Problem:** Vercel build fails
- Check that `VITE_API_BASE_URL` is set in Vercel environment variables
- Ensure Node.js version is 18+ in Vercel settings (Settings → General → Node.js Version)

**Problem:** Environment variables not working
- Vercel requires variables to be set in the dashboard
- Prefix all variables with `VITE_` for Vite to pick them up
- Redeploy after adding environment variables

### Runtime Issues

**Problem:** API calls failing
- Verify `VITE_API_BASE_URL` is set to `https://api.prime.testnet.bitfrost.ai`
- Check browser console for CORS errors
- Ensure backend is accessible

**Problem:** Wallet connection not working
- This is expected - the app uses a **mock wallet system**
- For real wallet integration, you'll need to implement actual Web3 providers

## 🔒 Security Notes

- Current implementation uses **mock wallet** - not suitable for production with real funds
- API endpoints should be secured with proper authentication
- Never expose private keys or sensitive data in environment variables
- For production, implement proper wallet connection (WalletConnect, MetaMask, etc.)

## 🚨 Important Reminders

1. **DO NOT** change the backend API URL: `https://api.prime.testnet.bitfrost.ai`
2. **HyperEVM Chain IDs** are fixed: testnet=998, mainnet=999
3. **Mock Wallet** system is for demo purposes only
4. This app is designed for **Figma Make** - may require adjustments for other environments

## 📚 Additional Resources

- [Vite Documentation](https://vitejs.dev/)
- [Vercel Documentation](https://vercel.com/docs)
- [React Documentation](https://react.dev/)
- [Tailwind CSS v4](https://tailwindcss.com/)

## 🤝 Support

For issues or questions:
1. Check the troubleshooting section above
2. Review Vercel deployment logs
3. Check browser console for errors
4. Verify environment variables are set correctly

## 📄 License

[Your License Here]

---

Built with ❤️ using React, Vite, TypeScript, and Tailwind CSS
