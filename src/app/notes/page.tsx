'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAccount } from 'wagmi'
import Link from 'next/link'
import NotesManager from '../../components/NotesManager'

export default function NotesPage() {
  const router = useRouter()
  const { isConnected } = useAccount()

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950/50 to-slate-950 text-white flex flex-col items-center justify-center p-4">
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-8 max-w-md w-full">
          <div className="text-2xl font-bold mb-4">Connect your Smart Wallet</div>
          <div className="text-gray-300 mb-6">Please connect your Smart wallet to access and manage your AI notes.</div>
          <div>
            <button
              onClick={() => router.push('/')}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-md transition-colors"
            >
              Go to Home
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950/50 to-slate-950 text-white">
      <div className="max-w-6xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link href="/"
            className="flex items-center text-blue-400 hover:text-blue-300 transition-all duration-300 group"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1 group-hover:-translate-x-1 transition-transform duration-300" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            <span className="relative">
              Back to Home
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-500 group-hover:w-full transition-all duration-300"></span>
            </span>
          </Link>
          
          <h1 className="text-3xl font-bold text-center">
            Smart <span className="text-blue-400">Notes</span>
          </h1>
          
          <div className="invisible">Placeholder</div>
        </div>

        {/* Notes Manager Component */}
        <NotesManager />
      </div>
    </div>
  )
} 