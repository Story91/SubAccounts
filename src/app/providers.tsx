'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { type ReactNode, useState, useEffect } from 'react'
import { type State, WagmiProvider, createConfig } from 'wagmi'

import { getConfig } from '@/wagmi'
import { SpendLimitProvider } from '@/contexts/SpendLimitContext'

// Wewnętrzny komponent, który używa kontekstu SpendLimit do stworzenia konfiguracji
function WagmiConfigProvider({ children, initialState }: { children: ReactNode, initialState?: State }) {
  const [config, setConfig] = useState(() => getConfig())
  const [queryClient] = useState(() => new QueryClient())
  
  return (
    <WagmiProvider config={config} initialState={initialState}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
}

// Główny komponent Providers
export function Providers(props: {
  children: ReactNode
  initialState?: State
}) {
  return (
    <SpendLimitProvider>
      <WagmiConfigProvider initialState={props.initialState}>
        {props.children}
      </WagmiConfigProvider>
    </SpendLimitProvider>
  )
}
