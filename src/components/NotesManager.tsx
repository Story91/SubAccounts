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
  unlocked?: boolean
}

// Typ dla powiadomień
type Toast = {
  id: string
  message: string
  type: 'success' | 'error' | 'info'
  txHash?: string
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
  const [transactions, setTransactions] = useState<any[]>([])
  const [processingNotes, setProcessingNotes] = useState<string[]>([])
  const [isUnlockingAll, setIsUnlockingAll] = useState(false)
  const [toasts, setToasts] = useState<Toast[]>([])
  
  const { sendTransactionAsync } = useSendTransaction()

  // Format address to a readable form
  const formatAddress = (addr: string | undefined): string => {
    if (!addr) return 'Anonymous';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  }

  // Funkcja dodająca powiadomienie
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success', txHash?: string) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
    const newToast = { id, message, type, txHash }
    setToasts(prev => [newToast, ...prev])
    
    // Automatycznie usuń powiadomienie po 5 sekundach
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id))
    }, 5000)
  }

  // Dynamicznie generuj przykładowe publiczne notatki od innych "użytkowników"
  const generatePublicSampleNotes = () => {
    const sampleAuthors = [
      { address: '0x1234567890123456789012345678901234567890', name: 'CryptoWhale' },
      { address: '0x2345678901234567890123456789012345678901', name: 'BlockchainDev' },
      { address: '0x3456789012345678901234567890123456789012', name: 'NFT_Collector' },
      { address: '0x4567890123456789012345678901234567890123', name: 'DeFiMaster' },
      { address: '0x5678901234567890123456789012345678901234', name: 'TokenExpert' }
    ];
    
    const samplePublicNotes: Note[] = [
      {
        id: `note-${Date.now()}-pub1`,
        title: 'Sub Accounts: The Future of Web3 UX',
        content: 'Sub Accounts represent the next evolution in web3 user experience by allowing seamless, permission-less interactions without constant wallet confirmations.\n\nUnlike traditional wallet interactions, Sub Accounts let dApps execute transactions within pre-approved limits, creating a web2-like UX with web3 security.',
        created: Date.now() - 345600000, // 4 days ago
        updated: Date.now() - 345600000,
        isPublic: true,
        owner: sampleAuthors[0].address,
        author: sampleAuthors[0].name,
        tipCount: 5,
        publicPrice: '0.0002'
      },
      {
        id: `note-${Date.now()}-pub2`,
        title: 'How Smart Wallet Security Works',
        content: 'Smart Wallets utilize a multi-layered security approach with threshold signatures and social recovery mechanisms.\n\nThe key innovation is the separation between authentication (proving who you are) and authorization (approving specific actions), enabling more flexible permission models.',
        created: Date.now() - 432000000, // 5 days ago
        updated: Date.now() - 432000000,
        isPublic: true,
        owner: sampleAuthors[1].address,
        author: sampleAuthors[1].name,
        tipCount: 3,
        publicPrice: '0.0001'
      },
      {
        id: `note-${Date.now()}-pub3`,
        title: 'Building with ERC-4337 Account Abstraction',
        content: 'ERC-4337 Account Abstraction is revolutionizing how we think about blockchain interactions. This guide walks you through implementing basic account abstraction features in your dApp.',
        created: Date.now() - 259200000, // 3 days ago
        updated: Date.now() - 259200000,
        isPublic: true,
        owner: sampleAuthors[2].address,
        author: sampleAuthors[2].name,
        tipCount: 7,
        publicPrice: '0.0003'
      },
      {
        id: `note-${Date.now()}-pub4`,
        title: 'Free Guide: Getting Started with Web3',
        content: 'This beginner-friendly guide explains the fundamentals of web3, wallets, and how to safely navigate the blockchain ecosystem. Perfect for newcomers looking to understand the decentralized web.',
        created: Date.now() - 172800000, // 2 days ago
        updated: Date.now() - 172800000,
        isPublic: true,
        owner: sampleAuthors[3].address,
        author: sampleAuthors[3].name,
        tipCount: 2,
        publicPrice: ''  // Free note
      }
    ];
    
    // Pobierz wszystkie notatki
    const savedNotes = localStorage.getItem('smart-wallet-notes')
    let allNotes: Note[] = []
    
    if (savedNotes) {
      try {
        allNotes = JSON.parse(savedNotes)
      } catch (e) {
        console.error('Failed to parse saved notes', e)
      }
    }
    
    // Dodaj przykładowe publiczne notatki
    const updatedNotes = [...allNotes, ...samplePublicNotes]
    localStorage.setItem('smart-wallet-notes', JSON.stringify(updatedNotes))
    
    // Zaktualizuj stan
    setPublicNotes(prev => [...prev, ...samplePublicNotes])
  }

  // Funkcja sprawdzająca czy są publiczne notatki i generująca jeśli potrzeba
  const checkAndGeneratePublicNotes = () => {
    // Sprawdź najpierw w localStorage
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
        
        // Jeśli nie ma żadnych publicznych notatek, wygeneruj przykładowe
        if (otherPublicNotes.length === 0) {
          generatePublicSampleNotes()
        }
      } catch (e) {
        console.error('Failed to parse saved notes', e)
        generatePublicSampleNotes() // Wygeneruj w przypadku błędu
      }
    } else {
      // Brak notatek w localStorage - wygeneruj przykładowe publiczne notatki
      generatePublicSampleNotes()
    }
  }

  // Pobierz notatki z localStorage przy pierwszym renderowaniu
  useEffect(() => {
    if (typeof window !== 'undefined') {
      checkAndGeneratePublicNotes()

      // Ładuj historię transakcji
      if (address) {
        loadTransactionHistory(address)
      }
    }
  }, [address])

  // Aktualizuj listę publicznych notatek, gdy zmienią się notatki użytkownika
  useEffect(() => {
    if (notes.length > 0) {
      // Znajdź publiczne notatki należące do użytkownika
      const userPublicNotes = notes.filter(note => note.isPublic);
      
      // Pobierz publiczne notatki innych użytkowników - nie używamy stanu publicNotes,
      // ponieważ mogłoby to prowadzić do pętli aktualizacji
      const savedNotes = localStorage.getItem('smart-wallet-notes');
      let otherPublicNotes: Note[] = [];
      
      if (savedNotes) {
        try {
          const allNotes = JSON.parse(savedNotes);
          otherPublicNotes = allNotes.filter((note: Note) => note.isPublic && note.owner !== address);
        } catch (e) {
          console.error('Failed to parse saved notes', e);
        }
      }
      
      // Połącz publiczne notatki użytkownika z notatkami innych
      setPublicNotes([...userPublicNotes, ...otherPublicNotes]);
    }
  }, [notes, address]);

  // Funkcja ładująca historię transakcji
  const loadTransactionHistory = (userAddress: string) => {
    if (typeof window !== 'undefined') {
      const storageKey = `sub-account-transactions-${userAddress}`
      const txHistory = localStorage.getItem(storageKey)
      
      if (txHistory) {
        try {
          const parsedHistory = JSON.parse(txHistory)
          
          // Przetwarzanie transakcji przed dodaniem do stanu
          const processedTransactions = parsedHistory.map((tx: any) => {
            // Jeśli to transakcja związana z notatką, dodaj potrzebne dane z detali
            if (tx.details.includes('note:') || tx.details.includes('tip for note') || tx.details.includes('Purchased note:')) {
              let txType = 'unlocked';
              let title = '';
              let amount = '';
              let author = '';
              
              if (tx.details.includes('tip for note')) {
                txType = 'tip';
                title = tx.details.split('note: ')[1] || '';
                amount = tx.details.split('Sent ')[1]?.split(' ETH')[0] || '';
                // Znajdź autora po tytule w notatkach
                const matchingNote = [...notes, ...publicNotes].find(n => n.title === title);
                author = matchingNote?.author || formatAddress(matchingNote?.owner);
              } else if (tx.details.includes('Purchased note:')) {
                txType = 'unlocked';
                const parts = tx.details.split('Purchased note: ')[1].split(' for ');
                title = parts[0] || '';
                amount = parts[1]?.split(' ETH')[0] || '';
                // Znajdź autora po tytule w notatkach
                const matchingNote = [...notes, ...publicNotes].find(n => n.title === title);
                author = matchingNote?.author || formatAddress(matchingNote?.owner);
              }
              
              return {
                ...tx,
                type: txType,
                title: title,
                amount: amount,
                author: author
              };
            }
            
            return tx;
          });
          
          setTransactions(processedTransactions);
        } catch (e) {
          console.error('Failed to parse transaction history', e)
          setTransactions([])
        }
      } else {
        setTransactions([])
      }
    }
  }

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
  const saveTransaction = (address: string | undefined, type: 'send' | 'sign', hash: string, details: string, title?: string, author?: string, amount?: string) => {
    if (!address) return;
    
    console.log(`Saving ${type} transaction with hash: ${hash}`)
    
    const storageKey = `sub-account-transactions-${address}`
    const newTx = {
      id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      hash,
      type,
      timestamp: Date.now(),
      details,
      title,
      author,
      amount
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
    transactions = [newTx, ...transactions].slice(0, 50) // Zwiększamy limit do 50
    
    // Save updated transactions
    localStorage.setItem(storageKey, JSON.stringify(transactions))
    
    // Also emit event for backward compatibility
    const event = new CustomEvent('new-transaction', {
      detail: { type, hash, details }
    })
    window.dispatchEvent(event)
    
    // Odśwież transakcje w UI
    loadTransactionHistory(address)
    
    console.log('Transaction saved successfully')
  }

  // Obsługa tworzenia/edycji notatki
  const handleSaveNote = () => {
    if (!newNoteTitle.trim() || !newNoteContent.trim()) {
      showToast('Title and content are required', 'error')
      return
    }

    const now = Date.now()
    const formattedAuthor = authorName.trim() || formatAddress(address)

    if (isEditMode && selectedNote) {
      // Aktualizacja istniejącej notatki
      const updatedNote = { 
        ...selectedNote, 
        title: newNoteTitle, 
        content: newNoteContent, 
        updated: now,
        isPublic: isPublicMode,
        publicPrice: isPublicMode ? publicPrice : undefined,
        author: formattedAuthor
      };
      
      const updatedNotes = notes.map(note => 
        note.id === selectedNote.id ? updatedNote : note
      )
      setNotes(updatedNotes)
      
      // Jeśli notatka stała się publiczna, dodaj ją do publicNotes
      if (isPublicMode && !selectedNote.isPublic) {
        showToast('Note is now public!', 'success')
      }
      // Jeśli notatka przestała być publiczna, usuń ją z publicNotes
      else if (!isPublicMode && selectedNote.isPublic) {
        setPublicNotes(prev => prev.filter(note => note.id !== selectedNote.id))
      }
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
      
      setNotes(prev => [...prev, newNote])
      
      // Jeśli nowa notatka jest publiczna, dodaj ją również do listy publicznych notatek
      if (isPublicMode) {
        showToast('New public note created!', 'success')
      }
    }

    // Reset formularza
    setNewNoteTitle('')
    setNewNoteContent('')
    setSelectedNote(null)
    setIsEditMode(false)
    setIsPublicMode(false)
    setPublicPrice('0.0001')
    setAuthorName('')
    
    // Przejdź do zakładki z notatkami
    if (activeTab === 'create-note') {
      setActiveTab(isPublicMode ? 'public-notes' : 'my-notes')
    }
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
    if (window.confirm('Are you sure you want to delete this note?')) {
      setNotes(notes.filter(note => note.id !== id))
      showToast('Note deleted successfully', 'info')
    }
  }

  // Obsługa wysyłania napiwku
  const handleSendTip = async (noteOwner: string, noteId: string) => {
    // Znajdź notatkę
    const note = publicNotes.find(n => n.id === noteId) || notes.find(n => n.id === noteId)
    if (!note) return
    
    try {
      // Ustaw stan przetwarzania dla tej notatki
      setProcessingNotes(prev => [...prev, noteId])
      
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
      const noteTitle = note.title || 'Unknown note'
      const noteAuthor = note.author || formatAddress(note.owner)
      
      // Szczegóły transakcji
      const txDetails = `Sent ${tipAmount} ETH tip for note: ${noteTitle}`
      
      // Save transaction to history
      saveTransaction(address, 'send', hash, txDetails, noteTitle, noteAuthor, tipAmount)
      
      // Zaktualizuj historię transakcji w UI
      const newTx = {
        id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        hash,
        type: 'tip',
        timestamp: Date.now(),
        details: txDetails,
        author: noteAuthor,
        title: noteTitle,
        amount: tipAmount
      }
      
      setTransactions(prev => [newTx, ...prev])
      
      showToast(`Tip sent successfully!`, 'success', hash)
    } catch (error) {
      console.error('Error sending tip:', error)
      showToast('Failed to send tip. Please try again.', 'error')
    } finally {
      // Usuń notatkę ze stanu przetwarzania
      setProcessingNotes(prev => prev.filter(id => id !== noteId))
    }
  }

  // Obsługa zakupu dostępu do notatki
  const handlePurchaseNote = async (note: Note) => {
    if (!note.publicPrice) return
    
    try {
      // Ustaw stan przetwarzania dla tej notatki
      setProcessingNotes(prev => [...prev, note.id])
      
      // Wyślij transakcję za pomocą Sub Account (brak popup)
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
      
      // Wyświetl znacznik "Unlocked" dla tej notatki
      // Zaktualizuj publicNotes, dodając pole unlocked dla tej notatki
      const updatedPublicNotes = publicNotes.map(n => 
        n.id === note.id ? { ...n, unlocked: true } : n
      )
      setPublicNotes(updatedPublicNotes)
      
      // Pobierz dane autora
      const noteAuthor = note.author || formatAddress(note.owner)
      
      // Save transaction to history
      const txDetails = `Purchased note: ${note.title} for ${note.publicPrice} ETH`
      saveTransaction(address, 'send', hash, txDetails, note.title, noteAuthor, note.publicPrice)
      
      // Zaktualizuj historię transakcji w UI
      const newTx = {
        id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        hash,
        type: 'send',
        timestamp: Date.now(),
        details: txDetails,
        author: noteAuthor,
        title: note.title,
        amount: note.publicPrice
      }
      
      setTransactions(prev => [newTx, ...prev])
      
      showToast(`Note "${note.title}" unlocked successfully!`, 'success', hash)
    } catch (error) {
      console.error('Error purchasing note:', error)
      showToast('Failed to purchase note. Please try again.', 'error')
    } finally {
      // Usuń notatkę ze stanu przetwarzania
      setProcessingNotes(prev => prev.filter(id => id !== note.id))
    }
  }
  
  // Funkcja do zakupu wszystkich płatnych notatek jednocześnie
  const handlePurchaseAllNotes = async () => {
    // Znajdź wszystkie płatne notatki, które nie zostały jeszcze odblokowane
    const paidNotes = publicNotes.filter(note => note.publicPrice && !note.unlocked)
    
    if (paidNotes.length === 0) {
      showToast('No paid notes to unlock!', 'info')
      return
    }
    
    // Oblicz całkowitą kwotę potrzebną do zakupu wszystkich notatek
    let totalCost = 0
    for (const note of paidNotes) {
      if (note.publicPrice) {
        totalCost += parseFloat(note.publicPrice)
      }
    }
    
    if (!window.confirm(`This will unlock all ${paidNotes.length} paid notes for a total of ${totalCost.toFixed(4)} ETH. Continue?`)) {
      return
    }
    
    // Ustaw stan ładowania dla wszystkich notatek
    setIsUnlockingAll(true)
    const noteIdsToProcess = paidNotes.map(note => note.id)
    setProcessingNotes(prev => [...prev, ...noteIdsToProcess])
    
    // Proces zakupu dla każdej notatki
    let successCount = 0
    let newTransactions = []
    
    for (const note of paidNotes) {
      if (!note.publicPrice) continue
      
      try {
        // Wyślij transakcję
        const hash = await sendTransactionAsync({
          to: note.owner as `0x${string}`,
          value: parseEther(note.publicPrice),
        })
        
        // Dodaj kopię notatki do notatek użytkownika
        const purchasedNote: Note = {
          ...note,
          id: `note-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          owner: address || 'anonymous',
          isPublic: false,
          publicPrice: undefined
        }
        
        setNotes(prev => [...prev, purchasedNote])
        
        // Oznacz notatkę jako odblokowaną
        note.unlocked = true
        
        // Pobierz dane autora
        const noteAuthor = note.author || formatAddress(note.owner)
        
        // Zapisz transakcję w historii
        const txDetails = `Purchased note: ${note.title} for ${note.publicPrice} ETH`
        saveTransaction(address, 'send', hash, txDetails, note.title, noteAuthor, note.publicPrice)
        
        // Dodaj transakcję do listy nowych transakcji
        newTransactions.push({
          id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          hash,
          type: 'send',
          timestamp: Date.now(),
          details: txDetails,
          author: noteAuthor,
          title: note.title,
          amount: note.publicPrice
        })
        
        successCount++
      } catch (error) {
        console.error(`Error purchasing note ${note.title}:`, error)
      } finally {
        // Usuń notatkę ze stanu przetwarzania
        setProcessingNotes(prev => prev.filter(id => id !== note.id))
      }
    }
    
    // Zaktualizuj historię transakcji w UI
    setTransactions(prev => [...newTransactions, ...prev])
    
    // Zaktualizuj widok publicNotes
    const updatedPublicNotes = [...publicNotes]
    setPublicNotes(updatedPublicNotes)
    
    // Wyłącz stan ładowania
    setIsUnlockingAll(false)
    
    // Pokaż podsumowanie
    showToast(`Successfully unlocked ${successCount} out of ${paidNotes.length} notes.`, 'success')
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
      {/* Toast Notifications */}
      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 flex flex-col items-center space-y-4 pointer-events-none">
        {toasts.map(toast => (
          <div 
            key={toast.id} 
            className={`max-w-md w-full p-4 rounded-lg shadow-lg flex items-center justify-between transition-all duration-300 text-white
              ${toast.type === 'success' ? 'bg-green-800/90' : 
                toast.type === 'error' ? 'bg-red-800/90' : 'bg-blue-800/90'}`}
            style={{
              animation: 'fadeInOut 5s forwards'
            }}
          >
            <div className="flex items-center">
              {toast.type === 'success' ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-400 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : toast.type === 'error' ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-400 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-400 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
              <div>
                <div className="font-semibold text-sm">{toast.message}</div>
                {toast.txHash && (
                  <div className="text-xs text-gray-300">
                    Tx: {toast.txHash.slice(0, 10)}...
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <style jsx>{`
        @keyframes fadeInOut {
          0% { opacity: 0; transform: translateY(20px); }
          10% { opacity: 1; transform: translateY(0); }
          90% { opacity: 1; transform: translateY(0); }
          100% { opacity: 0; transform: translateY(-20px); }
        }
      `}</style>
      
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
                        <div className="flex items-center space-x-2">
                          <span className="inline-flex items-center bg-gray-900/50 text-gray-400 px-2 py-1 rounded">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                            Private
                          </span>
                          <button
                            onClick={() => {
                              const updatedNote = { ...note, isPublic: true, publicPrice: '0.0001' };
                              handleEditNote(updatedNote);
                              setActiveTab('create-note');
                            }}
                            className="inline-flex items-center bg-green-700 hover:bg-green-800 text-white text-xs px-2 py-1 rounded"
                          >
                            Make Public
                          </button>
                        </div>
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
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-white">Public Notes</h2>
            
            {publicNotes.length > 0 && publicNotes.some(note => note.publicPrice && !note.unlocked) && (
              <button 
                onClick={handlePurchaseAllNotes}
                disabled={isUnlockingAll}
                className={`text-sm ${isUnlockingAll 
                  ? 'bg-gray-600 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700'} 
                  text-white py-1 px-3 rounded flex items-center`}
              >
                {isUnlockingAll ? (
                  <>
                    <svg className="animate-spin mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Unlocking...
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    Unlock All Notes
                  </>
                )}
              </button>
            )}
          </div>

          {publicNotes.length === 0 ? (
            <div className="bg-gray-700 rounded-lg p-8 text-center">
              <p className="text-gray-300 mb-4">
                There are no public notes available yet. Be the first to share your knowledge!
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                {publicNotes.map(note => (
                  <div key={note.id} className="bg-gray-700 border border-gray-600 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="text-lg font-bold text-white">{note.title}</h3>
                        <p className="text-xs text-gray-400">By: {note.author || formatAddress(note.owner)}</p>
                      </div>
                      {note.publicPrice && !note.unlocked ? (
                        <div className="bg-yellow-600/30 text-yellow-400 text-xs font-medium px-2 py-1 rounded flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                          {note.publicPrice} ETH
                        </div>
                      ) : note.unlocked ? (
                        <div className="bg-green-600/30 text-green-400 text-xs font-medium px-2 py-1 rounded flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Unlocked
                        </div>
                      ) : (
                        <div className="bg-blue-600/30 text-blue-400 text-xs font-medium px-2 py-1 rounded flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Free
                        </div>
                      )}
                    </div>
                    
                    <div className="bg-gray-800 rounded p-3 mb-3 max-h-40 overflow-y-auto">
                      {note.publicPrice && !note.unlocked ? (
                        <div className="flex flex-col items-center justify-center py-4">
                          <div className="mb-3 w-full">
                            {/* Preview with blurred content */}
                            <div className="relative">
                              <p className="text-gray-300 whitespace-pre-wrap blur-sm select-none mb-2">
                                {note.content.substring(0, 100)}...
                              </p>
                              <div className="absolute inset-0 flex items-center justify-center">
                                <div className="bg-gray-800/80 rounded-md px-3 py-2 text-center">
                                  <div className="text-sm text-gray-300 mb-1">Premium Content</div>
                                  <div className="text-xs text-yellow-400 mb-3">Unlock for {note.publicPrice} ETH</div>
                                  <button 
                                    onClick={() => handlePurchaseNote(note)}
                                    disabled={processingNotes.includes(note.id)}
                                    className={`${
                                      processingNotes.includes(note.id)
                                        ? 'bg-gray-600 cursor-not-allowed'
                                        : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700'
                                    } text-white font-medium py-2 px-4 rounded-md flex items-center justify-center`}
                                  >
                                    {processingNotes.includes(note.id) ? (
                                      <>
                                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Processing...
                                      </>
                                    ) : (
                                      <>
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                        </svg>
                                        Unlock Note
                                      </>
                                    )}
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
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
                          disabled={processingNotes.includes(note.id)}
                          className={`text-xs ${
                            processingNotes.includes(note.id) 
                              ? 'bg-gray-600 cursor-not-allowed' 
                              : 'bg-yellow-600 hover:bg-yellow-700'
                          } text-white py-1 px-2 rounded flex items-center`}
                        >
                          {processingNotes.includes(note.id) ? (
                            <>
                              <svg className="animate-spin -ml-1 mr-1 h-3 w-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Tipping...
                            </>
                          ) : (
                            <>
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              Tip Author ({note.tipCount})
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Transaction History */}
              {transactions.length > 0 && (
                <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 mt-6">
                  <h3 className="text-lg font-medium text-white mb-4">Transaction History</h3>
                  <div className="space-y-3">
                    {transactions.map(tx => (
                      <div key={tx.id} className="bg-gray-700 rounded-lg p-3 flex flex-col sm:flex-row sm:items-center justify-between">
                        <div className="mb-2 sm:mb-0">
                          <div className="flex items-center">
                            <div className={`rounded-full h-8 w-8 flex items-center justify-center mr-3 ${
                              tx.type === 'tip' ? 'bg-yellow-600/30' : 'bg-purple-600/30'
                            }`}>
                              {tx.type === 'tip' ? (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                              )}
                            </div>
                            <div>
                              <p className="text-sm text-white font-medium">
                                {tx.type === 'tip' ? 'Tipped author of' : 'Unlocked'}: <span className="text-blue-300">{tx.title || 'Unknown Note'}</span>
                              </p>
                              <p className="text-xs text-gray-400">By: {tx.author || 'Unknown'}</p>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className="text-center">
                            <div className="text-sm font-medium text-yellow-400">{tx.amount || '0.0001'} ETH</div>
                            <div className="text-xs text-gray-400">{new Date(tx.timestamp).toLocaleString()}</div>
                          </div>
                          <a 
                            href={`https://sepolia.basescan.org/tx/${tx.hash}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:text-blue-300 text-sm flex items-center"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
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