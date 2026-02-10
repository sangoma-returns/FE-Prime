/**
 * Mock Wallet Context
 * 
 * Simulates wallet connection functionality without actual web3 libraries
 * Used for development/demo purposes when real wallet connections aren't needed
 */

import { createContext, useContext, useState, ReactNode } from 'react';

interface MockWalletContextType {
  address: string | null;
  isConnected: boolean;
  connect: () => void;
  disconnect: () => void;
}

const MockWalletContext = createContext<MockWalletContextType | undefined>(undefined);

export function MockWalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);

  const connect = () => {
    // Generate a mock Ethereum address
    const mockAddress = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0';
    setAddress(mockAddress);
  };

  const disconnect = () => {
    setAddress(null);
  };

  return (
    <MockWalletContext.Provider
      value={{
        address,
        isConnected: !!address,
        connect,
        disconnect,
      }}
    >
      {children}
    </MockWalletContext.Provider>
  );
}

export function useMockWallet() {
  const context = useContext(MockWalletContext);
  if (context === undefined) {
    throw new Error('useMockWallet must be used within a MockWalletProvider');
  }
  return context;
}
