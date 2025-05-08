'use client'

import { useState, useEffect, useRef } from 'react'
import { parseEther } from 'viem'
import { useAccount, useSendTransaction, useSignMessage } from 'wagmi'

// Helper function to directly save transactions to localStorage
const saveTransaction = (address: string, type: 'send' | 'sign', hash: string, details: string) => {
  if (!address) return;
  
  console.log(`Saving ${type} transaction with hash: ${hash}`)
  
  const storageKey = `sub-account-transactions-${address}`
  const newTx = {
    id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    hash,
    type,
    timestamp: Date.now(),
    details
  }
  
  // Get existing transactions
  const existingTxsJson = localStorage.getItem(storageKey)
  let transactions = []
  
  if (existingTxsJson) {
    try {
      transactions = JSON.parse(existingTxsJson)
    } catch (e) {
      console.error('Error parsing stored transactions:', e)
    }
  }
  
  // Add new transaction at the beginning and keep only last 20
  transactions = [newTx, ...transactions].slice(0, 20)
  
  // Save updated transactions
  localStorage.setItem(storageKey, JSON.stringify(transactions))
  
  // Also emit event for backward compatibility
  const event = new CustomEvent('new-transaction', {
    detail: { type, hash, details }
  })
  window.dispatchEvent(event)
  
  console.log('Transaction saved successfully')
}

interface TransactionActionsProps {
  showSendOnly?: boolean;
  showSignOnly?: boolean;
}

export default function TransactionActions({ showSendOnly, showSignOnly }: TransactionActionsProps) {
  const { address } = useAccount()
  const { sendTransactionAsync, data: txData, isPending: isTxPending, isSuccess: isTxSuccess, error: txError } = useSendTransaction()
  const { signMessageAsync, data: signData, isPending: isSignPending, isSuccess: isSignSuccess, error: signError } = useSignMessage()
  
  const [amount, setAmount] = useState('0.00001')
  const [recipient, setRecipient] = useState<`0x${string}`>('0xF1fa20027b6202bc18e4454149C85CB01dC91Dfd')
  const [message, setMessage] = useState('Hello World')
  
  // Track if we've already saved this transaction/signature
  const savedTxRef = useRef<string | null>(null)
  const savedSignRef = useRef<string | null>(null)

  // Save transaction data when transaction is successful
  useEffect(() => {
    if (isTxSuccess && txData && savedTxRef.current !== txData && address) {
      // Save transaction to localStorage
      saveTransaction(
        address,
        'send',
        txData,
        `Sent ${amount} ETH to ${recipient.substring(0, 10)}...`
      )
      savedTxRef.current = txData
    }
  }, [txData, isTxSuccess, amount, recipient, address])

  // Save signature data when signing is successful
  useEffect(() => {
    if (isSignSuccess && signData && savedSignRef.current !== signData && address) {
      // Save signature to localStorage
      saveTransaction(
        address,
        'sign',
        signData,
        `Signed message: ${message.substring(0, 20)}${message.length > 20 ? '...' : ''}`
      )
      savedSignRef.current = signData
    }
  }, [signData, isSignSuccess, message, address])

  // Reset tracking refs when component unmounts
  useEffect(() => {
    return () => {
      savedTxRef.current = null
      savedSignRef.current = null
    }
  }, [])

  if (!address) {
    return null
  }

  const handleSendTransaction = async () => {
    try {
      await sendTransactionAsync({
        to: recipient,
        value: parseEther(amount),
      })
      // The transaction result will be handled by the useEffect hook above
    } catch (error) {
      console.error('Transaction error:', error)
    }
  }

  const handleSignMessage = async () => {
    try {
      const signature = await signMessageAsync({ message })
      console.log('Message signed successfully, signature:', signature)
      // The useEffect hook should pick up the signature from signData
    } catch (error) {
      console.error('Sign message error:', error)
    }
  }

  // Safe update of recipient - only allow valid 0x-prefixed addresses
  const updateRecipient = (value: string) => {
    if (value.startsWith('0x') && /^0x[0-9a-fA-F]{40}$/.test(value)) {
      setRecipient(value as `0x${string}`)
    } else if (value === '') {
      // Allow clearing the field
      setRecipient('0x0000000000000000000000000000000000000000')
    }
  }

  // If both options are false or undefined, show both sections
  const showBoth = !showSendOnly && !showSignOnly

  return (
    <>
      {/* Transaction Form */}
      {(showSendOnly || showBoth) && (
        <div className={showBoth ? "mb-6" : ""}>
          {showBoth && <h3 className="text-lg font-semibold mb-2 text-white">Send Transaction</h3>}
          <div className="mb-3">
            <label className="block text-sm text-gray-300 mb-1">Recipient</label>
            <input
              type="text"
              value={recipient}
              onChange={(e) => updateRecipient(e.target.value)}
              className="w-full p-2 border rounded bg-gray-700 border-gray-600 text-white focus:outline-none focus:border-blue-500"
            />
          </div>
          <div className="mb-3">
            <label className="block text-sm text-gray-300 mb-1">Amount (ETH)</label>
            <input
              type="text"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full p-2 border rounded bg-gray-700 border-gray-600 text-white focus:outline-none focus:border-blue-500"
            />
          </div>
          <button
            onClick={handleSendTransaction}
            disabled={isTxPending}
            className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-4 py-2 rounded disabled:opacity-50 transition-all duration-200"
          >
            {isTxPending ? 'Sending...' : 'Send Transaction'}
          </button>
          
          {isTxSuccess && (
            <div className="mt-2 p-2 bg-green-900/30 text-green-300 rounded border border-green-800">
              Transaction sent successfully! 🎉
              <div className="text-xs font-mono break-all mt-1">{txData}</div>
              <div className="mt-2 flex justify-end">
                <a 
                  href={`https://sepolia.basescan.org/tx/${txData}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-xs text-green-400 hover:text-green-300 hover:underline flex items-center"
                >
                  View on BaseScan
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>
            </div>
          )}
          
          {txError && (
            <div className="mt-2 p-2 bg-red-900/30 text-red-300 rounded border border-red-800">
              {txError.message}
            </div>
          )}
        </div>
      )}
      
      {/* Sign Message Form */}
      {(showSignOnly || showBoth) && (
        <div>
          {showBoth && <h3 className="text-lg font-semibold mb-2 text-white">Sign Message</h3>}
          <div className="mb-3">
            <label className="block text-sm text-gray-300 mb-1">Message</label>
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full p-2 border rounded bg-gray-700 border-gray-600 text-white focus:outline-none focus:border-purple-500"
            />
          </div>
          <button
            onClick={handleSignMessage}
            disabled={isSignPending}
            className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white px-4 py-2 rounded disabled:opacity-50 transition-all duration-200"
          >
            {isSignPending ? 'Signing...' : 'Sign Message'}
          </button>
          
          {isSignSuccess && (
            <div className="mt-2 p-2 bg-green-900/30 text-green-300 rounded border border-green-800">
              Message signed successfully!
              <div className="text-xs font-mono break-all mt-1">{signData}</div>
            </div>
          )}
          
          {signError && (
            <div className="mt-2 p-2 bg-red-900/30 text-red-300 rounded border border-red-800">
              {signError.message}
            </div>
          )}
        </div>
      )}
    </>
  )
} 