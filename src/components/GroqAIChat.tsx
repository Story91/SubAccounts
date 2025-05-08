'use client'

import { useState, useEffect, useRef } from 'react'
import { useAccount, useSendTransaction, useSignMessage } from 'wagmi'
import { parseEther } from 'viem'
import { useRouter } from 'next/navigation'

type Message = {
  id: string
  role: 'user' | 'assistant'
  content: string
}

// Available AI models
const AI_MODELS = [
  // Main models
  { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B Versatile', category: 'main' },
  { id: 'llama-3.3-8b-versatile', name: 'Llama 3.3 8B Versatile', category: 'main' },
  { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B Instant', category: 'main' },
  { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B', category: 'main' },
  { id: 'gemma-7b-it', name: 'Gemma 7B', category: 'main' },
  
  // Llama 3 models
  { id: 'llama3-70b-8192', name: 'Llama 3 70B 8192', category: 'llama' },
  { id: 'llama3-8b-8192', name: 'Llama 3 8B 8192', category: 'llama' },
  { id: 'llama-guard-3-8b', name: 'Llama Guard 3 8B', category: 'llama' },
  
  // Llama 4 models
  { id: 'meta-llama/llama-4-maverick-17b-128e-instruct', name: 'Llama 4 Maverick 17B', category: 'llama4' },
  { id: 'meta-llama/llama-4-scout-17b-16e-instruct', name: 'Llama 4 Scout 17B', category: 'llama4' },
  
  // Whisper models
  { id: 'whisper-large-v3', name: 'Whisper Large V3', category: 'whisper' },
  { id: 'whisper-large-v3-turbo', name: 'Whisper Large V3 Turbo', category: 'whisper' },
  { id: 'distil-whisper-large-v3-en', name: 'Distil Whisper V3 (EN)', category: 'whisper' },
  
  // Other models
  { id: 'qwen-qwq-32b', name: 'Qwen QWQ 32B', category: 'other' },
  { id: 'mistral-saba-24b', name: 'Mistral Saba 24B', category: 'other' },
  { id: 'allam-2-7b', name: 'Allam 2 7B', category: 'other' },
  { id: 'playai-tts', name: 'PlayAI TTS', category: 'tts' },
  { id: 'playai-tts-arabic', name: 'PlayAI TTS Arabic', category: 'tts' }
]

export default function GroqAIChat() {
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hello! I\'m an AI assistant powered by Groq. Ask me anything and use your Smart Wallet Sub Account to sign messages or send transactions without popups!'
    }
  ])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedModel, setSelectedModel] = useState('llama-3.3-70b-versatile')
  const [isModelSelectOpen, setIsModelSelectOpen] = useState(false)
  const [currentModelCategory, setCurrentModelCategory] = useState('main')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const modelSelectRef = useRef<HTMLDivElement>(null)
  
  // Smart Wallet hooks
  const account = useAccount()
  const { sendTransactionAsync, isPending: isTxPending } = useSendTransaction()
  const { signMessageAsync, isPending: isSignPending } = useSignMessage()
  const router = useRouter()

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Close model select dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modelSelectRef.current && !modelSelectRef.current.contains(event.target as Node)) {
        setIsModelSelectOpen(false)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Handle sending a message to the AI
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/groq', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt: input,
          model: selectedModel
        })
      })

      const data = await response.json()
      
      if (data.error) {
        throw new Error(data.error)
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.message
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error('Error querying Groq:', error)
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, there was an error processing your request. Please try again later.'
      }

      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  // Sign the assistant's message with Smart Wallet Sub Account
  const handleSignMessage = async (message: string) => {
    if (!account.isConnected) {
      alert('Please connect your wallet first!')
      return
    }

    try {
      const signature = await signMessageAsync({ message })
      
      const signatureMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `✅ Message signed successfully!\n\nSignature: ${signature.slice(0, 30)}...`
      }
      
      setMessages(prev => [...prev, signatureMessage])
    } catch (error) {
      console.error('Error signing message:', error)
      
      const errorMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: 'Error signing message. Please try again.'
      }
      
      setMessages(prev => [...prev, errorMessage])
    }
  }

  // Send a tip transaction using Smart Wallet Sub Account
  const handleSendTip = async () => {
    if (!account.isConnected) {
      alert('Please connect your wallet first!')
      return
    }

    try {
      // New recipient address for tips
      const recipientAddress = '0xF1fa20027b6202bc18e4454149C85CB01dC91Dfd'
      const amount = '0.0001' // Small amount for testing
      
      const hash = await sendTransactionAsync({
        to: recipientAddress as `0x${string}`,
        value: parseEther(amount),
      })
      
      const txMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `✅ Tip sent successfully! Thank you for supporting AI research.\n\nTransaction hash: ${hash.slice(0, 10)}...`
      }
      
      setMessages(prev => [...prev, txMessage])
      
      // Add a BaseScan link message with a clickable link that stays within chat bounds
      setTimeout(() => {
        const linkMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `You can view this transaction on BaseScan`
        }
        
        setMessages(prev => [...prev, linkMessage])
        
        // Add a clickable button in a separate message
        const buttonMessage: Message = {
          id: (Date.now() + 2).toString(),
          role: 'assistant',
          content: '🔍 View Transaction'
        }
        
        // When this message is rendered, we'll add a click handler in the UI part
        setMessages(prev => [...prev, buttonMessage])
        
        // Store the transaction hash in localStorage so we can open it later
        localStorage.setItem('last_transaction_hash', hash)
      }, 500)
    } catch (error) {
      console.error('Error sending transaction:', error)
      
      const errorMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: 'Error sending tip. Please check your wallet balance and try again.'
      }
      
      setMessages(prev => [...prev, errorMessage])
    }
  }
  
  // Filter models by category
  const handleSelectCategory = (category: string) => {
    setCurrentModelCategory(category)
  }
  
  // Get models for current category
  const filteredModels = AI_MODELS.filter(model => model.category === currentModelCategory)

  // Funkcja do zapisywania wiadomości jako notatki
  const handleSaveAsNote = (content: string) => {
    if (typeof window !== 'undefined') {
      // Tytuł notatki: pierwsze 30 znaków treści lub pierwsze zdanie
      let title = content.substring(0, 30)
      if (title.length === 30) title += '...'
      
      const now = Date.now()
      
      // Stwórz obiekt notatki
      const newNote = {
        id: `note-${now}-${Math.random().toString(36).substring(2, 9)}`,
        title,
        content,
        created: now,
        updated: now,
        isPublic: false,
        owner: account.address || 'anonymous',
        tipCount: 0
      }
      
      // Pobierz istniejące notatki
      const savedNotes = localStorage.getItem('smart-wallet-notes')
      let allNotes = []
      
      if (savedNotes) {
        try {
          allNotes = JSON.parse(savedNotes)
        } catch (e) {
          console.error('Failed to parse saved notes', e)
        }
      }
      
      // Dodaj nową notatkę i zapisz wszystkie
      localStorage.setItem('smart-wallet-notes', JSON.stringify([...allNotes, newNote]))
      
      // Pokaż potwierdzenie
      const confirmationMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: '✅ Message saved as note! You can view it in the Smart Notes section.'
      }
      
      setMessages(prev => [...prev, confirmationMessage])
      
      // Opcjonalnie: dodaj przycisk do przejścia do notatek
      setTimeout(() => {
        const goToNotesMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: '📝 Go to Notes'
        }
        
        setMessages(prev => [...prev, goToNotesMessage])
      }, 500)
    }
  }

  return (
    <div className="flex flex-col h-full max-w-3xl mx-auto p-4">
      {/* Model Selection and Info Area */}
      <div className="mb-6 mt-4 sticky top-16 z-20">
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 mb-2">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div className="text-sm text-gray-300 flex flex-wrap items-center gap-2">
              <span className="text-blue-400 font-medium">Model:</span>
              <div className="relative inline-block" ref={modelSelectRef}>
                <button 
                  onClick={() => setIsModelSelectOpen(!isModelSelectOpen)}
                  className="text-white bg-blue-900/50 hover:bg-blue-800/50 px-2 py-1 rounded border border-blue-700 flex items-center min-w-[190px] justify-between"
                >
                  <span className="truncate max-w-[160px]">
                    {AI_MODELS.find(model => model.id === selectedModel)?.name || 'Select Model'}
                  </span>
                  <svg className="ml-1 h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {isModelSelectOpen && (
                  <div className="absolute top-full left-0 mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-lg w-64 z-30 max-h-[60vh] overflow-y-auto">
                    {/* Category tabs */}
                    <div className="flex flex-wrap border-b border-gray-700 px-1 py-1 sticky top-0 bg-gray-800">
                      <button 
                        className={`px-2 py-1 text-xs rounded ${currentModelCategory === 'main' ? 'bg-blue-600' : 'hover:bg-gray-700'}`}
                        onClick={() => handleSelectCategory('main')}
                      >
                        Main
                      </button>
                      <button 
                        className={`px-2 py-1 text-xs rounded ${currentModelCategory === 'llama' ? 'bg-blue-600' : 'hover:bg-gray-700'}`}
                        onClick={() => handleSelectCategory('llama')}
                      >
                        Llama 3
                      </button>
                      <button 
                        className={`px-2 py-1 text-xs rounded ${currentModelCategory === 'llama4' ? 'bg-blue-600' : 'hover:bg-gray-700'}`}
                        onClick={() => handleSelectCategory('llama4')}
                      >
                        Llama 4
                      </button>
                      <button 
                        className={`px-2 py-1 text-xs rounded ${currentModelCategory === 'whisper' ? 'bg-blue-600' : 'hover:bg-gray-700'}`}
                        onClick={() => handleSelectCategory('whisper')}
                      >
                        Whisper
                      </button>
                      <button 
                        className={`px-2 py-1 text-xs rounded ${currentModelCategory === 'other' ? 'bg-blue-600' : 'hover:bg-gray-700'}`}
                        onClick={() => handleSelectCategory('other')}
                      >
                        Other
                      </button>
                      <button 
                        className={`px-2 py-1 text-xs rounded ${currentModelCategory === 'tts' ? 'bg-blue-600' : 'hover:bg-gray-700'}`}
                        onClick={() => handleSelectCategory('tts')}
                      >
                        TTS
                      </button>
                    </div>
                    
                    {/* Models for current category */}
                    {filteredModels.map(model => (
                      <button
                        key={model.id}
                        className={`block w-full text-left px-3 py-2 text-sm hover:bg-gray-700 ${
                          selectedModel === model.id ? 'bg-blue-900/40 text-blue-300' : 'text-white'
                        }`}
                        onClick={() => {
                          setSelectedModel(model.id)
                          setIsModelSelectOpen(false)
                        }}
                      >
                        {model.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="text-xs text-green-400 flex items-center">
              <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-1"></span>
              Running on Groq
            </div>
          </div>
        </div>
      </div>
      
      {/* Chat messages */}
      <div className="flex-1 overflow-y-auto space-y-4 pb-20 chat-messages" ref={messagesContainerRef}>
        {messages.map((message) => (
          <div 
            key={message.id} 
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div 
              className={`max-w-[90%] md:max-w-[80%] rounded-lg p-3 ${
                message.role === 'user' 
                  ? 'bg-blue-600 text-white rounded-tr-none' 
                  : 'bg-gray-800 text-white rounded-tl-none'
              }`}
            >
              {message.content === '🔍 View Transaction' ? (
                <button
                  onClick={() => {
                    const hash = localStorage.getItem('last_transaction_hash')
                    if (hash) {
                      window.open(`https://sepolia.basescan.org/tx/${hash}`, '_blank')
                    }
                  }}
                  className="text-blue-400 hover:text-blue-300 hover:underline flex items-center"
                >
                  🔍 View on BaseScan
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </button>
              ) : message.content === '📝 Go to Notes' ? (
                <button
                  onClick={() => router.push('/notes')}
                  className="text-green-400 hover:text-green-300 hover:underline flex items-center"
                >
                  📝 View in Smart Notes
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </button>
              ) : (
                <p className="whitespace-pre-wrap">{message.content}</p>
              )}
              
              {/* Action buttons for assistant messages containing AI responses */}
              {message.role === 'assistant' && 
                !message.content.includes('✅') && 
                !message.content.includes('🔍') && 
                !message.content.includes('You can view this transaction') && 
                !message.content.includes('📝 Go to Notes') && (
                <div className="mt-2 flex flex-wrap justify-end gap-2">
                  <button
                    onClick={() => handleSaveAsNote(message.content)}
                    className="text-xs bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded flex items-center"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Save as Note
                  </button>
                  <button
                    onClick={() => handleSignMessage(message.content)}
                    disabled={isSignPending}
                    className="text-xs bg-purple-600 hover:bg-purple-700 text-white px-2 py-1 rounded"
                  >
                    {isSignPending ? 'Signing...' : 'Sign This'}
                  </button>
                  <button
                    onClick={handleSendTip}
                    disabled={isTxPending}
                    className="text-xs bg-yellow-600 hover:bg-yellow-700 text-white px-2 py-1 rounded"
                  >
                    {isTxPending ? 'Sending...' : 'Send Tip'}
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-800 text-white rounded-lg rounded-tl-none p-3 max-w-[80%]">
              <div className="flex space-x-2 items-center">
                <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse delay-75"></div>
                <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse delay-150"></div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      {/* Input form */}
      <form 
        onSubmit={handleSubmit}
        className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-slate-950 to-slate-950/90 p-4"
      >
        <div className="max-w-3xl mx-auto flex items-center space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask something..."
            className="flex-1 bg-gray-800 text-white border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2 disabled:opacity-50 whitespace-nowrap"
          >
            {isLoading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing
              </span>
            ) : (
              'Send'
            )}
          </button>
        </div>
      </form>
    </div>
  )
} 