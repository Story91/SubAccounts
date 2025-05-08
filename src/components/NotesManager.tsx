'use client'

import { useState, useEffect } from 'react'
import { useAccount, useSendTransaction } from 'wagmi'
import { parseEther } from 'viem'
import { useRouter } from 'next/navigation'

// Definicja typów dla notatek
type Note = {
  id: string
  title: string
  content: string
  created: number
  updated: number
  isPublic: boolean
  owner: string
  tipCount: number
  publicPrice?: string // Cena za dostęp do notatki (w ETH)
  author?: string // Nazwa autora (opcjonalne, jeśli nie podano używamy adresu portfela)
}

export default function NotesManager() {
  const { address } = useAccount()
  const router = useRouter()
  const [notes, setNotes] = useState<Note[]>([])
  const [publicNotes, setPublicNotes] = useState<Note[]>([])
  const [activeTab, setActiveTab] = useState('my-notes')
  const [newNoteTitle, setNewNoteTitle] = useState('')
  const [newNoteContent, setNewNoteContent] = useState('')
  const [selectedNote, setSelectedNote] = useState<Note | null>(null)
  const [isEditMode, setIsEditMode] = useState(false)
  const [isPublicMode, setIsPublicMode] = useState(false)
  const [publicPrice, setPublicPrice] = useState('0.0001')
  const [authorName, setAuthorName] = useState('')
  
  const { sendTransactionAsync } = useSendTransaction()

  // Format address to a readable form
  const formatAddress = (addr: string | undefined): string => {
    if (!addr) return 'Anonymous';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  }

  // Pobierz notatki z localStorage przy pierwszym renderowaniu
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedNotes = localStorage.getItem('smart-wallet-notes')
      if (savedNotes) {
        try {
          const allNotes = JSON.parse(savedNotes)
          // Filtruj notatki należące do aktualnego użytkownika
          const myNotes = allNotes.filter((note: Note) => note.owner === address)
          setNotes(myNotes)
          
          // Filtruj publiczne notatki innych użytkowników
          const otherPublicNotes = allNotes.filter((note: Note) => note.isPublic && note.owner !== address)
          setPublicNotes(otherPublicNotes)
        } catch (e) {
          console.error('Failed to parse saved notes', e)
        }
      }
    }
  }, [address])

  // Zapisz notatki do localStorage po każdej zmianie
  useEffect(() => {
    if (typeof window !== 'undefined' && notes.length > 0) {
      // Pobierz wszystkie notatki
      const savedNotes = localStorage.getItem('smart-wallet-notes')
      let allNotes: Note[] = []
      
      if (savedNotes) {
        try {
          allNotes = JSON.parse(savedNotes)
          // Usuń notatki aktualnego użytkownika (zastąpimy je nowymi)
          allNotes = allNotes.filter((note: Note) => note.owner !== address)
        } catch (e) {
          console.error('Failed to parse saved notes', e)
        }
      }
      
      // Dodaj notatki użytkownika i zapisz wszystko
      localStorage.setItem('smart-wallet-notes', JSON.stringify([...allNotes, ...notes]))
    }
  }, [notes, address])

  // Helper function to directly save transactions to localStorage
  const saveTransaction = (address: string | undefined, type: 'send' | 'sign', hash: string, details: string) => {
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

  // Obsługa tworzenia/edycji notatki
  const handleSaveNote = () => {
    if (!newNoteTitle.trim() || !newNoteContent.trim()) {
      alert('Title and content are required')
      return
    }

    const now = Date.now()
    const formattedAuthor = authorName.trim() || formatAddress(address)

    if (isEditMode && selectedNote) {
      // Aktualizacja istniejącej notatki
      const updatedNotes = notes.map(note => 
        note.id === selectedNote.id 
          ? { 
              ...note, 
              title: newNoteTitle, 
              content: newNoteContent, 
              updated: now,
              isPublic: isPublicMode,
              publicPrice: isPublicMode ? publicPrice : undefined,
              author: formattedAuthor
            } 
          : note
      )
      setNotes(updatedNotes)
    } else {
      // Tworzenie nowej notatki
      const newNote: Note = {
        id: `note-${now}-${Math.random().toString(36).substring(2, 9)}`,
        title: newNoteTitle,
        content: newNoteContent,
        created: now,
        updated: now,
        isPublic: isPublicMode,
        owner: address || 'anonymous',
        tipCount: 0,
        publicPrice: isPublicMode ? publicPrice : undefined,
        author: formattedAuthor
      }
      setNotes([...notes, newNote])
    }

    // Reset formularza
    setNewNoteTitle('')
    setNewNoteContent('')
    setSelectedNote(null)
    setIsEditMode(false)
    setIsPublicMode(false)
    setPublicPrice('0.0001')
    setAuthorName('')
  }

  // Obsługa edycji notatki
  const handleEditNote = (note: Note) => {
    setSelectedNote(note)
    setNewNoteTitle(note.title)
    setNewNoteContent(note.content)
    setIsEditMode(true)
    setIsPublicMode(note.isPublic)
    setPublicPrice(note.publicPrice || '0.0001')
    setAuthorName(note.author || formatAddress(note.owner))
  }

  // Obsługa usuwania notatki
  const handleDeleteNote = (id: string) => {
    if (confirm('Are you sure you want to delete this note?')) {
      setNotes(notes.filter(note => note.id !== id))
    }
  }

  // Obsługa wysyłania napiwku
  const handleSendTip = async (noteOwner: string, noteId: string) => {
    try {
      const tipAmount = '0.0001' // Stała kwota napiwku
      
      // Wyślij transakcję
      const hash = await sendTransactionAsync({
        to: noteOwner as `0x${string}`,
        value: parseEther(tipAmount),
      })
      
      // Zwiększ licznik napiwków
      if (activeTab === 'my-notes') {
        const updatedNotes = notes.map(note => 
          note.id === noteId ? { ...note, tipCount: note.tipCount + 1 } : note
        )
        setNotes(updatedNotes)
      } else {
        const updatedPublicNotes = publicNotes.map(note => 
          note.id === noteId ? { ...note, tipCount: note.tipCount + 1 } : note
        )
        setPublicNotes(updatedPublicNotes)
        
        // Zaktualizuj też w localStorage
        const savedNotes = localStorage.getItem('smart-wallet-notes')
        if (savedNotes) {
          try {
            const allNotes = JSON.parse(savedNotes)
            const updatedAllNotes = allNotes.map((note: Note) => 
              note.id === noteId ? { ...note, tipCount: note.tipCount + 1 } : note
            )
            localStorage.setItem('smart-wallet-notes', JSON.stringify(updatedAllNotes))
          } catch (e) {
            console.error('Failed to update note tip count', e)
          }
        }
      }
      
      // Get note title for the transaction details
      const noteTitle = notes.find(note => note.id === noteId)?.title || 
                       publicNotes.find(note => note.id === noteId)?.title || 
                       'Unknown note';
      
      // Save transaction to history
      saveTransaction(address, 'send', hash, `Sent ${tipAmount} ETH tip for note: ${noteTitle}`)
      
      alert(`Tip sent successfully! Transaction hash: ${hash.slice(0, 10)}...`)
    } catch (error) {
      console.error('Error sending tip:', error)
      alert('Failed to send tip. Please try again.')
    }
  }

  // Obsługa zakupu dostępu do notatki
  const handlePurchaseNote = async (note: Note) => {
    if (!note.publicPrice) return
    
    try {
      // Wyślij transakcję
      const hash = await sendTransactionAsync({
        to: note.owner as `0x${string}`,
        value: parseEther(note.publicPrice),
      })
      
      // Dodaj notatkę do notatek użytkownika (jako kopię)
      const purchasedNote: Note = {
        ...note,
        id: `note-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        owner: address || 'anonymous',
        isPublic: false, // Prywatna kopia
        publicPrice: undefined
      }
      
      setNotes([...notes, purchasedNote])
      
      // Save transaction to history
      saveTransaction(address, 'send', hash, `Purchased note: ${note.title} for ${note.publicPrice} ETH`)
      
      alert(`Note purchased successfully! Transaction hash: ${hash.slice(0, 10)}...`)
    } catch (error) {
      console.error('Error purchasing note:', error)
      alert('Failed to purchase note. Please try again.')
    }
  }

  // Dodaj przykładowe notatki dla demo
  const addSampleNotes = () => {
    const formattedAuthor = formatAddress(address)
    const sampleNotes: Note[] = [
      {
        id: `note-${Date.now()}-1`,
        title: 'How Spend Limits Work',
        content: 'Smart Wallet Spend Limits enable third-party signers to spend assets from a user\'s wallet without requiring authentication for each transaction. This creates a seamless UX for subscriptions, trading, and more.',
        created: Date.now() - 86400000,
        updated: Date.now() - 86400000,
        isPublic: true,
        owner: address || 'anonymous',
        author: formattedAuthor,
        tipCount: 3,
        publicPrice: '0.0001'
      },
      {
        id: `note-${Date.now()}-2`,
        title: 'Sub Accounts Overview',
        content: 'Sub Accounts are wallet accounts directly embedded in applications, linked to the user\'s main Smart Wallet. They enable popup-less transactions with pre-approved spend limits and maintain security through onchain relationships.',
        created: Date.now() - 172800000,
        updated: Date.now() - 172800000,
        isPublic: false,
        owner: address || 'anonymous',
        author: formattedAuthor,
        tipCount: 0
      }
    ]
    
    setNotes([...notes, ...sampleNotes])
  }

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
      <div className="flex space-x-2 border-b border-gray-700 mb-6">
        <button
          onClick={() => setActiveTab('my-notes')}
          className={`px-4 py-2 font-medium rounded-t-lg ${
            activeTab === 'my-notes'
              ? 'bg-blue-600 text-white'
              : 'text-gray-300 hover:text-blue-400'
          }`}
        >
          My Notes
        </button>
        <button
          onClick={() => setActiveTab('public-notes')}
          className={`px-4 py-2 font-medium rounded-t-lg ${
            activeTab === 'public-notes'
              ? 'bg-blue-600 text-white'
              : 'text-gray-300 hover:text-blue-400'
          }`}
        >
          Public Notes
        </button>
        <button
          onClick={() => setActiveTab('create-note')}
          className={`px-4 py-2 font-medium rounded-t-lg ${
            activeTab === 'create-note'
              ? 'bg-blue-600 text-white'
              : 'text-gray-300 hover:text-blue-400'
          }`}
        >
          {isEditMode ? 'Edit Note' : 'Create Note'}
        </button>
      </div>

      {/* Moje notatki */}
      {activeTab === 'my-notes' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-white">My Notes</h2>
            
            {notes.length === 0 && (
              <button
                onClick={addSampleNotes}
                className="text-sm bg-green-600 hover:bg-green-700 text-white py-1 px-3 rounded"
              >
                Add Sample Notes
              </button>
            )}
          </div>

          {notes.length === 0 ? (
            <div className="bg-gray-700 rounded-lg p-8 text-center">
              <p className="text-gray-300 mb-4">
                You don't have any notes yet. Create one or add sample notes to get started.
              </p>
              <button
                onClick={() => setActiveTab('create-note')}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded"
              >
                Create Your First Note
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {notes.map(note => (
                <div key={note.id} className="bg-gray-700 border border-gray-600 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="text-lg font-bold text-white">{note.title}</h3>
                      <p className="text-xs text-gray-400">By: {note.author || formatAddress(note.owner)}</p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEditNote(note)}
                        className="text-xs bg-blue-600 hover:bg-blue-700 text-white py-1 px-2 rounded"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteNote(note.id)}
                        className="text-xs bg-red-600 hover:bg-red-700 text-white py-1 px-2 rounded"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  
                  <div className="bg-gray-800 rounded p-3 mb-3 max-h-40 overflow-y-auto">
                    <p className="text-gray-300 whitespace-pre-wrap">{note.content}</p>
                  </div>
                  
                  <div className="flex justify-between items-center text-xs text-gray-400">
                    <div>
                      {note.isPublic ? (
                        <span className="inline-flex items-center bg-green-900/50 text-green-400 px-2 py-1 rounded">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Public
                          {note.publicPrice && ` (${note.publicPrice} ETH)`}
                        </span>
                      ) : (
                        <span className="inline-flex items-center bg-gray-900/50 text-gray-400 px-2 py-1 rounded">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                          Private
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center">
                      <span className="text-gray-400 mr-2">
                        {new Date(note.updated).toLocaleDateString()}
                      </span>
                      {note.tipCount > 0 && (
                        <span className="text-yellow-400 flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {note.tipCount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Publiczne notatki */}
      {activeTab === 'public-notes' && (
        <div>
          <h2 className="text-xl font-bold text-white mb-4">Public Notes</h2>

          {publicNotes.length === 0 ? (
            <div className="bg-gray-700 rounded-lg p-8 text-center">
              <p className="text-gray-300">
                There are no public notes available yet. Be the first to share your knowledge!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {publicNotes.map(note => (
                <div key={note.id} className="bg-gray-700 border border-gray-600 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="text-lg font-bold text-white">{note.title}</h3>
                      <p className="text-xs text-gray-400">By: {note.author || formatAddress(note.owner)}</p>
                    </div>
                  </div>
                  
                  <div className="bg-gray-800 rounded p-3 mb-3 max-h-40 overflow-y-auto">
                    {note.publicPrice ? (
                      <div className="flex flex-col items-center justify-center py-4">
                        <p className="text-gray-300 mb-3">Premium content (Available for {note.publicPrice} ETH)</p>
                        <button 
                          onClick={() => handlePurchaseNote(note)}
                          className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium py-2 px-4 rounded-md"
                        >
                          Purchase Note
                        </button>
                      </div>
                    ) : (
                      <p className="text-gray-300 whitespace-pre-wrap">{note.content}</p>
                    )}
                  </div>
                  
                  <div className="flex justify-between items-center mt-2">
                    <div className="text-xs text-gray-400">
                      {new Date(note.updated).toLocaleDateString()}
                    </div>
                    
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleSendTip(note.owner, note.id)}
                        className="text-xs bg-yellow-600 hover:bg-yellow-700 text-white py-1 px-2 rounded flex items-center"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Tip Author ({note.tipCount})
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tworzenie/edycja notatki */}
      {activeTab === 'create-note' && (
        <div>
          <h2 className="text-xl font-bold text-white mb-4">
            {isEditMode ? 'Edit Note' : 'Create New Note'}
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-300 mb-1">Title</label>
              <input
                type="text"
                value={newNoteTitle}
                onChange={(e) => setNewNoteTitle(e.target.value)}
                className="w-full p-2 border rounded bg-gray-700 border-gray-600 text-white focus:outline-none focus:border-blue-500"
                placeholder="Enter note title"
              />
            </div>
            
            <div>
              <label className="block text-sm text-gray-300 mb-1">Author Name (optional)</label>
              <input
                type="text"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                className="w-full p-2 border rounded bg-gray-700 border-gray-600 text-white focus:outline-none focus:border-blue-500"
                placeholder={formatAddress(address)}
              />
              <p className="text-xs text-gray-400 mt-1">
                Leave empty to use your wallet address
              </p>
            </div>
            
            <div>
              <label className="block text-sm text-gray-300 mb-1">Content</label>
              <textarea
                value={newNoteContent}
                onChange={(e) => setNewNoteContent(e.target.value)}
                className="w-full p-2 border rounded bg-gray-700 border-gray-600 text-white focus:outline-none focus:border-blue-500 min-h-[200px]"
                placeholder="Enter note content"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isPublic"
                checked={isPublicMode}
                onChange={(e) => setIsPublicMode(e.target.checked)}
                className="rounded bg-gray-700 border-gray-600 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="isPublic" className="text-sm text-gray-300">
                Make this note public
              </label>
            </div>
            
            {isPublicMode && (
              <div>
                <label className="block text-sm text-gray-300 mb-1">
                  Set price (ETH) or leave as 0 for free access
                </label>
                <input
                  type="text"
                  value={publicPrice}
                  onChange={(e) => setPublicPrice(e.target.value)}
                  className="w-full p-2 border rounded bg-gray-700 border-gray-600 text-white focus:outline-none focus:border-blue-500"
                  placeholder="0.0001"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Users will need to pay this amount to view premium content
                </p>
              </div>
            )}
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setNewNoteTitle('')
                  setNewNoteContent('')
                  setIsEditMode(false)
                  setIsPublicMode(false)
                  setPublicPrice('0.0001')
                  setSelectedNote(null)
                  setAuthorName('')
                  setActiveTab('my-notes')
                }}
                className="px-4 py-2 border border-gray-600 rounded text-gray-300 hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveNote}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white"
                disabled={!newNoteTitle.trim() || !newNoteContent.trim()}
              >
                {isEditMode ? 'Update Note' : 'Save Note'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 