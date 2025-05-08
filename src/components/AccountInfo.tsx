'use client'

import { useAccount, useDisconnect } from 'wagmi'
import { useSpendLimit } from '../contexts/SpendLimitContext'

export default function AccountInfo() {
  const account = useAccount()
  const { disconnect } = useDisconnect()
  const { formattedSpendLimit } = useSpendLimit()

  if (account.status !== 'connected') {
    return null
  }

  // Get the address as a string
  const address = account.addresses ? Object.values(account.addresses)[0] : null
  
  // Format chain name
  const getChainName = (id?: number) => {
    if (!id) return 'Unknown'
    switch (id) {
      case 84532:
        return 'Base Sepolia Testnet'
      case 8453:
        return 'Base Mainnet'
      default:
        return `Chain ID: ${id}`
    }
  }

  return (
    <div className="bg-gray-800 rounded-lg shadow-lg p-6 overflow-hidden relative border border-gray-700">
      <div className="absolute top-0 right-0 w-40 h-40 bg-blue-900/20 rounded-full -mr-20 -mt-20 opacity-50"></div>
      
      <div className="relative z-10">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white flex items-center">
            <div className="bg-green-500 w-3 h-3 rounded-full mr-2"></div>
            Connected Account
          </h2>
          <button
            className="bg-red-500 hover:bg-red-600 text-white text-sm px-3 py-1 rounded-full flex items-center"
            onClick={() => disconnect()}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Disconnect
          </button>
        </div>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-gray-700 border border-gray-600 p-4 rounded-lg">
            <div className="text-sm text-blue-300 mb-1">Sub Account Address</div>
            <div className="font-mono text-xs break-all bg-gray-900 p-2 rounded border border-gray-600">
              {address}
            </div>
            <div className="mt-2 text-xs text-gray-400">
              This is your application-specific sub-account generated from your main Smart Wallet.
            </div>
          </div>
          
          <div className="bg-gray-700 border border-gray-600 p-4 rounded-lg">
            <div className="text-sm text-blue-300 mb-1">Network</div>
            <div className="font-medium bg-gray-900 p-2 rounded border border-gray-600">
              {getChainName(account.chainId)}
            </div>
            <div className="mt-2 flex justify-between">
              <div className="text-xs text-gray-400">Chain ID: {account.chainId}</div>
              <div className="text-xs text-green-500">●&nbsp;Active</div>
            </div>
          </div>
        </div>

        <div className="mt-4 bg-yellow-900/30 border border-yellow-800 rounded-lg p-3">
          <div className="flex items-start">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-500 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="text-sm text-yellow-200">
              Your sub-account has a spend limit of {formattedSpendLimit} ETH per day. This allows for transactions without authentication popups.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 