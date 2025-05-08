'use client'

import { createContext, useContext, useState, ReactNode } from 'react'
import { toHex } from 'viem'
import { SpendLimitConfig } from '../components/SpendLimitSelector'

interface SpendLimitContextType {
  spendLimit: SpendLimitConfig
  setSpendLimit: (config: SpendLimitConfig) => void
  formattedSpendLimit: string
}

const defaultSpendLimit: SpendLimitConfig = {
  allowance: '10000000000000000', // 0.01 ETH in wei
  period: 86400 // 1 day in seconds
}

const SpendLimitContext = createContext<SpendLimitContextType>({
  spendLimit: defaultSpendLimit,
  setSpendLimit: () => {},
  formattedSpendLimit: '0.01'
})

export function useSpendLimit() {
  return useContext(SpendLimitContext)
}

export function SpendLimitProvider({ children }: { children: ReactNode }) {
  const [spendLimit, setSpendLimitState] = useState<SpendLimitConfig>(defaultSpendLimit)
  
  // Convert the allowance in wei to a formatted ETH value
  const formattedSpendLimit = formatWeiToEth(spendLimit.allowance)
  
  const setSpendLimit = (config: SpendLimitConfig) => {
    setSpendLimitState(config)
  }
  
  return (
    <SpendLimitContext.Provider value={{ 
      spendLimit, 
      setSpendLimit,
      formattedSpendLimit
    }}>
      {children}
    </SpendLimitContext.Provider>
  )
}

// Helper function to format wei to ETH
function formatWeiToEth(weiValue: string): string {
  const wei = BigInt(weiValue)
  const eth = Number(wei) / 1e18
  
  if (eth >= 0.01) {
    return eth.toString()
  } else {
    // Format small numbers without scientific notation
    return eth.toFixed(6).replace(/\.?0+$/, '')
  }
} 