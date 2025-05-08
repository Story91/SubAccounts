'use client'

import { useState, useEffect } from 'react'
import { parseEther } from 'viem'

// Define available spend limit options
const SPEND_LIMIT_OPTIONS = [
  { value: '0.1', label: '0.1 ETH' },
  { value: '0.01', label: '0.01 ETH' },
  { value: '0.001', label: '0.001 ETH' },
  { value: '0.0001', label: '0.0001 ETH' }
]

// Interface for the selected spend limit
export interface SpendLimitConfig {
  allowance: string
  period: number
}

interface SpendLimitSelectorProps {
  onSelect: (config: SpendLimitConfig) => void
}

export default function SpendLimitSelector({ onSelect }: SpendLimitSelectorProps) {
  const [selectedLimit, setSelectedLimit] = useState('0.01')
  const [isSelected, setIsSelected] = useState(false)
  
  // Call onSelect with default value on first render
  useEffect(() => {
    const config: SpendLimitConfig = {
      allowance: parseEther(selectedLimit).toString(),
      period: 86400 // 1 day in seconds
    }
    
    onSelect(config)
  }, [])
  
  const handleSelect = (value: string) => {
    setSelectedLimit(value)
    setIsSelected(true)
    
    // Create the spend limit config based on selection
    const config: SpendLimitConfig = {
      allowance: parseEther(value).toString(),
      period: 86400 // 1 day in seconds
    }
    
    onSelect(config)
    
    // Reset the selected limit state after 1 second for visual feedback
    setTimeout(() => {
      setIsSelected(false)
    }, 1000)
  }
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 my-6">
      <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
        Select Daily Spend Limit
      </h2>
      
      <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
        Choose the maximum amount the app can spend from your wallet per day without requiring authentication:
      </p>
      
      <div className="grid grid-cols-2 gap-3">
        {SPEND_LIMIT_OPTIONS.map(option => (
          <button
            key={option.value}
            className={`p-3 rounded-lg border transition-all duration-200 ${
              selectedLimit === option.value
                ? isSelected 
                  ? 'bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-700' 
                  : 'bg-indigo-100 dark:bg-indigo-900/30 border-indigo-300 dark:border-indigo-700'
                : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600'
            }`}
            onClick={() => handleSelect(option.value)}
          >
            <div className="font-medium text-gray-900 dark:text-white">
              {option.label}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              per day
            </div>
            {selectedLimit === option.value && (
              <div className="mt-1 text-xs font-medium text-indigo-600 dark:text-indigo-400">
                {isSelected ? '✓ Selected!' : '● Current selection'}
              </div>
            )}
          </button>
        ))}
      </div>
      
      <div className="mt-4 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
        <div className="flex items-start">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-500 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="text-sm text-yellow-800 dark:text-yellow-200">
            <strong>Currently selected limit: {selectedLimit} ETH/day.</strong><br />
            Choose your preferred spending limit before connecting your wallet. This will allow the app to execute transactions without requiring confirmation for each one.
          </div>
        </div>
      </div>
    </div>
  )
} 