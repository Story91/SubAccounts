'use client'

import { useState } from 'react'
import AccountInfo from '../components/AccountInfo'
import Connect from '../components/Connect'
import TransactionActions from '../components/TransactionActions'
import TransactionHistory from '../components/TransactionHistory'

export default function App() {
  const [activeTab, setActiveTab] = useState('transactions')

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-indigo-950">
      <div className="max-w-6xl mx-auto py-8 px-4">
        <h1 className="text-3xl md:text-4xl font-bold text-center mb-6 text-indigo-700 dark:text-indigo-400">
          Smart Wallet Sub Accounts Demo
        </h1>
        
        {/* Connect button - always visible */}
        <div className="mb-8">
          <Connect />
        </div>
        
        {/* Account info - always visible when connected */}
        <div className="mb-8">
          <AccountInfo />
        </div>
        
        {/* Tab navigation */}
        <div className="mb-6">
          <div className="flex space-x-2 border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setActiveTab('transactions')}
              className={`px-4 py-2 font-medium rounded-t-lg ${
                activeTab === 'transactions'
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-600 hover:text-indigo-600 dark:text-gray-300 dark:hover:text-indigo-400'
              }`}
            >
              Transactions
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-4 py-2 font-medium rounded-t-lg ${
                activeTab === 'history'
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-600 hover:text-indigo-600 dark:text-gray-300 dark:hover:text-indigo-400'
              }`}
            >
              History
            </button>
          </div>
        </div>
        
        {/* Content based on active tab */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          {activeTab === 'transactions' && (
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-gray-700 dark:to-gray-800 rounded-xl shadow-md p-5 transform transition-transform duration-300 hover:scale-[1.02]">
                <div className="flex items-center justify-center w-14 h-14 bg-blue-500 rounded-full mb-4 text-white">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-3 text-gray-800 dark:text-white">Send Transaction</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4 text-sm">
                  Send native ETH to any address without authentication popups thanks to Smart Wallet Sub Accounts and Spend Limits.
                </p>
                <div className="mt-auto">
                  <TransactionActions showSendOnly={true} />
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-gray-700 dark:to-gray-800 rounded-xl shadow-md p-5 transform transition-transform duration-300 hover:scale-[1.02]">
                <div className="flex items-center justify-center w-14 h-14 bg-purple-500 rounded-full mb-4 text-white">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-3 text-gray-800 dark:text-white">Sign Message</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4 text-sm">
                  Sign messages with your Sub Account wallet to authenticate with external services or verify your identity.
                </p>
                <div className="mt-auto">
                  <TransactionActions showSignOnly={true} />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div>
              <TransactionHistory />
            </div>
          )}
        </div>
        
        {/* Info section */}
        <div className="mt-10 text-center bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4 text-indigo-600 dark:text-indigo-400">About Sub Accounts and Spend Limits</h2>
          <div className="grid md:grid-cols-2 gap-6 text-left">
            <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-gray-700 dark:to-gray-800 p-4 rounded-lg">
              <h3 className="font-bold mb-2 text-indigo-700 dark:text-indigo-300">Sub Accounts</h3>
              <p className="text-gray-700 dark:text-gray-300 text-sm">
                Sub Accounts are wallet accounts directly embedded in your application, 
                linked to the user's main Smart Wallet through an onchain relationship.
                They allow developers to create dedicated wallets for specific use cases.
              </p>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-gray-700 dark:to-gray-800 p-4 rounded-lg">
              <h3 className="font-bold mb-2 text-green-700 dark:text-green-300">Spend Limits</h3>
              <p className="text-gray-700 dark:text-gray-300 text-sm">
                Spend Limits enable third-party signers to spend assets from a user's Smart Wallet
                without requiring authentication for each transaction.
                This creates a seamless user experience for subscriptions, trading, and more.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
