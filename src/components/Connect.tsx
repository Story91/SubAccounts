'use client'

import { useState, useEffect } from 'react'
import { useAccount, useConnect } from 'wagmi'
import { toHex, parseEther } from 'viem'
import SpendLimitSelector, { SpendLimitConfig } from './SpendLimitSelector'
import { useSpendLimit } from '../contexts/SpendLimitContext'
import { getConfig } from '@/wagmi'

export default function Connect() {
  const account = useAccount()
  const { connectors, connect, status, error } = useConnect()
  const { setSpendLimit } = useSpendLimit()
  const [selectedSpendLimit, setSelectedSpendLimit] = useState<SpendLimitConfig | null>(null)
  
  const handleSpendLimitSelected = (config: SpendLimitConfig) => {
    setSelectedSpendLimit(config)
    setSpendLimit(config)
  }

  const handleConnect = (connectorId: string) => {
    const connector = connectors.find(c => c.uid === connectorId)
    if (!connector || !selectedSpendLimit) return
    
    // Convert allowance to 0x format
    const hexAllowance = toHex(BigInt(selectedSpendLimit.allowance))
    
    // Create configuration with selected spending limits
    const customConfig = getConfig({
      spendLimitAllowance: hexAllowance,
      spendLimitPeriod: selectedSpendLimit.period
    })
    
    // Find new connector with updated configuration
    const updatedConnector = customConfig.connectors.find(c => c.name === 'Coinbase Wallet')
    
    if (updatedConnector) {
      // Connect using the updated connector
      connect({ connector: updatedConnector })
    } else {
      // Fallback to standard connector
      connect({ connector })
    }
  }

  if (account.status === 'connected') {
    return null
  }

  return (
    <div className="bg-gray-800 rounded-lg shadow-lg p-6 mb-6 text-center relative overflow-hidden border border-gray-700">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-32 h-32 bg-blue-900/20 rounded-full -ml-16 -mt-16"></div>
      <div className="absolute bottom-0 right-0 w-32 h-32 bg-purple-900/20 rounded-full -mr-16 -mb-16"></div>
      
      <div className="relative z-10">
        <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-400 to-indigo-600 rounded-full flex items-center justify-center mb-4 shadow-lg">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        
        <h2 className="text-2xl font-bold mb-3 text-white">Connect Your Smart Wallet</h2>
        <p className="text-gray-300 mb-6">
          Connect your Smart Wallet to use popup-less transactions with Sub Accounts and Spend Limits.
        </p>
        
        {/* Spend limit selector with clear indication */}
        <SpendLimitSelector onSelect={handleSpendLimitSelected} />
        
        <div className="flex flex-col gap-3 max-w-xs mx-auto">
          {connectors
            .filter((connector) => connector.name === 'Coinbase Wallet')
            .map((connector) => (
              <button
                key={connector.uid}
                onClick={() => handleConnect(connector.uid)}
                className="group relative bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-medium px-6 py-3 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center overflow-hidden"
                disabled={status === 'pending' || !selectedSpendLimit}
              >
                <span className="absolute -inset-10 w-20 h-20 rotate-12 translate-x-12 -translate-y-2 bg-white opacity-10 group-hover:rotate-12 group-hover:scale-150 duration-700 origin-left"></span>
                <svg className="w-5 h-5 mr-2" viewBox="0 0 1024 1024" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect width="1024" height="1024" fill="#0052FF"/>
                  <path d="M512 512m-256 0a256 256 0 1 0 512 0 256 256 0 1 0 -512 0Z" fill="white"/>
                  <path d="M516.9 393.7c-65.9 0-119.3 53.4-119.3 119.3s53.4 119.3 119.3 119.3 119.3-53.4 119.3-119.3-53.4-119.3-119.3-119.3z" fill="#0052FF"/>
                </svg>
                Sign in with Smart Wallet
              </button>
            ))}
        </div>
        
        {status === 'pending' && (
          <div className="mt-4 text-blue-400 animate-pulse flex items-center justify-center">
            <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Connecting...
          </div>
        )}
        
        {error && (
          <div className="mt-4 p-3 bg-red-900/30 text-red-300 rounded-lg text-sm border border-red-800">
            {error.message}
          </div>
        )}
      </div>
    </div>
  )
} 