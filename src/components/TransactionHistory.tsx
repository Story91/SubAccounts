'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAccount } from 'wagmi'

type Transaction = {
  id: string
  hash: string
  type: 'send' | 'sign'
  timestamp: number
  details: string
}

// Helper function to format dates in a consistent way
const formatDate = (timestamp: number): string => {
  const date = new Date(timestamp);
  
  // Format: "DD.MM.YYYY, HH:MM:SS"
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const seconds = date.getSeconds().toString().padStart(2, '0');
  
  return `${day}.${month}.${year}, ${hours}:${minutes}:${seconds}`;
}

export default function TransactionHistory() {
  const { address } = useAccount()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Load transactions from localStorage
  const loadTransactions = useCallback(() => {
    if (typeof window !== 'undefined' && address) {
      setIsLoading(true)
      const storedTx = localStorage.getItem(`sub-account-transactions-${address}`)
      if (storedTx) {
        try {
          const parsedTx = JSON.parse(storedTx)
          // Sort transactions by timestamp (newest first)
          const sortedTx = parsedTx.sort((a: Transaction, b: Transaction) => b.timestamp - a.timestamp)
          setTransactions(sortedTx)
        } catch (e) {
          console.error('Failed to parse stored transactions', e)
        }
      } else {
        // No transactions yet
        setTransactions([])
      }
      setIsLoading(false)
    }
  }, [address])

  // Load transactions specific to this user's address
  useEffect(() => {
    loadTransactions()
  }, [loadTransactions])

  // Add transaction to history
  const addTransaction = useCallback((tx: Omit<Transaction, 'id' | 'timestamp'>) => {
    console.log('Adding transaction to history:', tx)
    
    const newTx: Transaction = {
      ...tx,
      id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      timestamp: Date.now()
    }
    
    setTransactions(prevTx => {
      const updatedTx = [newTx, ...prevTx].slice(0, 20) // Keep last 20 transactions
      
      // Save to localStorage
      if (typeof window !== 'undefined' && address) {
        localStorage.setItem(`sub-account-transactions-${address}`, JSON.stringify(updatedTx))
      }
      
      return updatedTx
    })
  }, [address])

  // Clear transaction history
  const clearTransactionHistory = () => {
    if (window.confirm('Are you sure you want to clear your transaction history? This action cannot be undone.')) {
      setTransactions([])
      if (typeof window !== 'undefined' && address) {
        localStorage.removeItem(`sub-account-transactions-${address}`)
      }
    }
  }

  // Refresh transactions from localStorage
  const refreshTransactions = () => {
    loadTransactions()
  }

  // Listen for transaction events
  useEffect(() => {
    const handleNewTransaction = (e: CustomEvent) => {
      console.log('Transaction event received:', e.detail)
      if (e.detail && e.detail.hash && (e.detail.type === 'send' || e.detail.type === 'sign')) {
        addTransaction(e.detail)
      }
    }

    if (typeof window !== 'undefined') {
      // Remove any existing listener to prevent duplicates
      window.removeEventListener('new-transaction' as any, handleNewTransaction as EventListener)
      // Add the listener
      window.addEventListener('new-transaction' as any, handleNewTransaction as EventListener)
      
      return () => {
        window.removeEventListener('new-transaction' as any, handleNewTransaction as EventListener)
      }
    }
  }, [addTransaction]) // Only depends on addTransaction which is now memoized

  if (!address) {
    return (
      <div className="p-8 text-center">
        <div className="text-gray-500 dark:text-gray-400">
          Connect your wallet to view transaction history
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white">Transaction History</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={refreshTransactions}
            className="text-xs bg-blue-600 hover:bg-blue-700 text-white py-1 px-2 rounded-full transition-colors"
            title="Refresh"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
          {transactions.length > 0 && (
            <>
              <span className="text-xs bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 py-1 px-2 rounded-full">
                {transactions.length} {transactions.length === 1 ? 'transaction' : 'transactions'}
              </span>
              <button
                onClick={clearTransactionHistory}
                className="text-xs bg-red-600 hover:bg-red-700 text-white py-1 px-2 rounded-full transition-colors"
                title="Clear history"
              >
                Clear
              </button>
            </>
          )}
        </div>
      </div>
      
      {isLoading ? (
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-8 text-center">
          <div className="w-8 h-8 border-t-2 border-b-2 border-blue-500 rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-gray-500 dark:text-gray-400">Loading transaction history...</p>
        </div>
      ) : transactions.length === 0 ? (
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h3 className="text-gray-500 dark:text-gray-400 font-medium mb-1">No transactions yet</h3>
          <p className="text-gray-400 dark:text-gray-500 text-sm">
            Your transactions will appear here after you send ETH or sign messages
          </p>
        </div>
      ) : (
        <div className="overflow-auto max-h-[600px] rounded-lg">
          <div className="space-y-3">
            {transactions.map((tx) => (
              <div 
                key={tx.id} 
                className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 transition-all hover:shadow-md"
              >
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                      tx.type === 'send' 
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-500' 
                        : 'bg-purple-100 dark:bg-purple-900/30 text-purple-500'
                    }`}>
                      {tx.type === 'send' ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5" />
                        </svg>
                      )}
                    </div>
                    <div>
                      <div className="font-medium text-gray-800 dark:text-white">
                        {tx.type === 'send' ? 'Transaction' : 'Message Signing'}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {tx.details}
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {formatDate(tx.timestamp)}
                  </div>
                </div>
                
                <div 
                  className="text-xs font-mono break-all mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300"
                  onClick={() => {
                    navigator.clipboard.writeText(tx.hash)
                      .then(() => alert('Hash copied to clipboard!'))
                      .catch(err => console.error('Failed to copy', err))
                  }}
                  style={{ cursor: 'pointer' }}
                  title="Click to copy"
                >
                  {tx.hash}
                </div>
                
                <div className="mt-2 flex justify-end">
                  <a 
                    href={`https://sepolia.basescan.org/tx/${tx.hash}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center"
                  >
                    View on BaseScan
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
} 