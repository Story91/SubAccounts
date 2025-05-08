'use client';

import GroqAIChat from '../../components/GroqAIChat';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AIPage() {
  const router = useRouter();

  return (
    <div className="flex flex-col h-screen font-sans overflow-hidden">
      {/* Fixed Header */}
      <header className="flex items-center justify-between p-3 border-b border-gray-600 bg-gray-800 text-white shadow-md flex-shrink-0 z-50">
        <button 
          onClick={() => router.push('/')} 
          className="flex items-center text-blue-400 hover:text-blue-300 transition-all duration-300 group"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1 group-hover:-translate-x-1 transition-transform duration-300" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          <span className="relative">
            Back to Home
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-500 group-hover:w-full transition-all duration-300"></span>
          </span>
        </button>
        
        <h1 className="text-lg font-medium">
          <span className="text-white">Smart Wallet</span>
          <span className="text-blue-400"> AI Assistant</span>
        </h1>
        
        <div className="flex items-center">
          <Link 
            href="https://docs.base.org/identity/smart-wallet/guides/sub-accounts"
            target="_blank"
            className="text-sm text-blue-400 hover:text-blue-300"
          >
            Learn More
          </Link>
        </div>
      </header>

      {/* Main Content with Gradient Background */}
      <main className="flex-1 overflow-hidden bg-gradient-to-br from-slate-950 via-blue-950/50 to-slate-950">
        <div className="h-full relative">
          <style jsx global>{`
            /* Custom scrollbar for the chat container */
            .chat-messages::-webkit-scrollbar {
              width: 6px;
            }
            
            .chat-messages::-webkit-scrollbar-track {
              background: rgba(30, 41, 59, 0.2);
            }
            
            .chat-messages::-webkit-scrollbar-thumb {
              background: rgba(59, 130, 246, 0.3);
              border-radius: 3px;
            }
            
            .chat-messages::-webkit-scrollbar-thumb:hover {
              background: rgba(59, 130, 246, 0.5);
            }
            
            /* Mobile optimization */
            @media (max-width: 640px) {
              .chat-messages::-webkit-scrollbar {
                width: 3px;
              }
            }
          `}</style>
          
          {/* GroqAIChat Component */}
          <GroqAIChat />
        </div>
      </main>
    </div>
  );
} 