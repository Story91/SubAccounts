'use client'

import { useState } from 'react'
import { parseEther } from 'viem'
import { useAccount, useSendTransaction, useSignMessage } from 'wagmi'

// Helper function to emit custom events for transaction history
const emitTransactionEvent = (type: 'send' | 'sign', hash: string, details: string) => {
  const event = new CustomEvent('new-transaction', {
    detail: { type, hash, details }
  })
  window.dispatchEvent(event)
}

interface TransactionActionsProps {
  showSendOnly?: boolean;
  showSignOnly?: boolean;
}

export default function TransactionActions({ showSendOnly, showSignOnly }: TransactionActionsProps) {
  const account = useAccount()
  const { sendTransactionAsync, data: txData, isPending: isTxPending, isSuccess: isTxSuccess, error: txError } = useSendTransaction()
  const { signMessageAsync, data: signData, isPending: isSignPending, isSuccess: isSignSuccess, error: signError } = useSignMessage()
  
  const [amount, setAmount] = useState('0.00001')
  // Predefined ETH address with 0x prefix - Vitalik's address
  const [recipient, setRecipient] = useState<`0x${string}`>('0xd8da6bf26964af9d7eed9e03e53415d37aa96045')
  const [message, setMessage] = useState('Hello World')

  if (account.status !== 'connected') {
    return null
  }

  const handleSendTransaction = async () => {
    try {
      const hash = await sendTransactionAsync({
        to: recipient,
        value: parseEther(amount),
      })
      
      // Emit transaction event for history tracking
      emitTransactionEvent('send', hash, `Sent ${amount} ETH to ${recipient.substring(0, 10)}...`)
    } catch (error) {
      console.error('Transaction error:', error)
    }
  }

  const handleSignMessage = async () => {
    try {
      const signature = await signMessageAsync({ message })
      
      // Emit signature event for history tracking
      emitTransactionEvent('sign', signature, `Signed message: ${message.substring(0, 20)}${message.length > 20 ? '...' : ''}`)
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
          {showBoth && <h3 className="text-lg font-semibold mb-2">Send Transaction</h3>}
          <div className="mb-3">
            <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">Recipient</label>
            <input
              type="text"
              value={recipient}
              onChange={(e) => updateRecipient(e.target.value)}
              className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>
          <div className="mb-3">
            <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">Amount (ETH)</label>
            <input
              type="text"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>
          <button
            onClick={handleSendTransaction}
            disabled={isTxPending}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            {isTxPending ? 'Sending...' : 'Send Transaction'}
          </button>
          
          {isTxSuccess && (
            <div className="mt-2 p-2 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded">
              Transaction sent successfully! 🎉
              <div className="text-xs font-mono break-all mt-1">{txData}</div>
            </div>
          )}
          
          {txError && (
            <div className="mt-2 p-2 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded">
              {txError.message}
            </div>
          )}
        </div>
      )}
      
      {/* Sign Message Form */}
      {(showSignOnly || showBoth) && (
        <div>
          {showBoth && <h3 className="text-lg font-semibold mb-2">Sign Message</h3>}
          <div className="mb-3">
            <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">Message</label>
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>
          <button
            onClick={handleSignMessage}
            disabled={isSignPending}
            className="w-full bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            {isSignPending ? 'Signing...' : 'Sign Message'}
          </button>
          
          {isSignSuccess && (
            <div className="mt-2 p-2 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded">
              Message signed successfully!
              <div className="text-xs font-mono break-all mt-1">{signData}</div>
            </div>
          )}
          
          {signError && (
            <div className="mt-2 p-2 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded">
              {signError.message}
            </div>
          )}
        </div>
      )}
    </>
  )
} 