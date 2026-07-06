import React, { useState, useRef, useEffect } from 'react'
import { useChatStore } from '../stores/useChatStore'
import { useUIStore } from '../stores/useUIStore'
import { Moon, UploadCloud, AlertTriangle, Paperclip, Send, Trash2, Plus } from 'lucide-react'

// Parse inline markdown elements recursively (bold **, code spans `)
const parseInlineMarkdown = (line: string): React.ReactNode => {
  if (!line) return ''
  
  if (line.includes('**')) {
    const subparts = line.split(/(\*\*.*?\*\*)/g)
    return (
      <>
        {subparts.map((sp, spIdx) => {
          if (sp.startsWith('**') && sp.endsWith('**')) {
            return <strong key={spIdx} className="text-purple-300 font-bold">{sp.slice(2, -2)}</strong>
          }
          return parseInlineMarkdown(sp)
        })}
      </>
    )
  }
  
  if (line.includes('`')) {
    const subparts = line.split(/(`.*?`)/g)
    return (
      <>
        {subparts.map((sp, spIdx) => 
          sp.startsWith('`') && sp.endsWith('`') 
            ? <code key={spIdx} className="bg-white/10 px-1 py-0.5 rounded text-purple-300 font-mono text-[10px]">{sp.slice(1, -1)}</code> 
            : sp
        )}
      </>
    )
  }
  
  return line
}

// Custom Markdown + Code-block formatter for premium chat UI
const MarkdownMessage: React.FC<{ text: string }> = ({ text }) => {
  if (!text) return null
  
  // Format code blocks
  const parts = text.split(/(```[\s\S]*?```)/g)
  
  return (
    <div className="space-y-2 text-xs leading-relaxed text-gray-200">
      {parts.map((part, idx) => {
        if (part.startsWith('```')) {
          const match = part.match(/```(\w*)\n([\s\S]*?)```/)
          const lang = match ? match[1] : 'code'
          const code = match ? match[2] : part.slice(3, -3)
          
          return (
            <div key={idx} className="my-3 rounded-lg overflow-hidden border border-white/5 bg-black/50 font-mono text-[11px]">
              <div className="flex items-center justify-between px-3 py-1.5 bg-white/5 border-b border-white/5 text-gray-400 text-[10px]">
                <span>{lang.toUpperCase()}</span>
                <button 
                  onClick={() => navigator.clipboard.writeText(code.trim())}
                  className="hover:text-white transition-colors"
                >
                  Copy
                </button>
              </div>
              <pre className="p-3 overflow-x-auto text-purple-300">
                <code>{code.trim()}</code>
              </pre>
            </div>
          )
        }
        
        // Format lines for basic inline markdown (headers, bullets, bold)
        const lines = part.split('\n')
        return (
          <p key={idx} className="whitespace-pre-wrap">
            {lines.map((line, lIdx) => {
              let formatted: React.ReactNode = line
              
              if (line.startsWith('# ')) {
                formatted = <h1 className="text-base font-bold text-white mt-3 mb-1">{parseInlineMarkdown(line.slice(2))}</h1>
              } else if (line.startsWith('## ')) {
                formatted = <h2 className="text-sm font-bold text-white mt-2.5 mb-1">{parseInlineMarkdown(line.slice(3))}</h2>
              } else if (line.startsWith('### ')) {
                formatted = <h3 className="text-xs font-bold text-white mt-2 mb-0.5">{parseInlineMarkdown(line.slice(4))}</h3>
              } else if (line.startsWith('- ') || line.startsWith('* ')) {
                formatted = <span className="pl-3 block relative before:content-['•'] before:absolute before:left-0 before:text-purple-400">{parseInlineMarkdown(line.slice(2))}</span>
              } else if (line.startsWith('> ')) {
                formatted = <blockquote className="border-l-2 border-purple-500/50 pl-3 py-0.5 italic text-gray-400 my-1 bg-white/5 rounded-r">{parseInlineMarkdown(line.slice(2))}</blockquote>
              } else {
                formatted = parseInlineMarkdown(line)
              }
              
              return (
                <span key={lIdx} className="block min-h-[4px]">
                  {formatted}
                </span>
              )
            })}
          </p>
        )
      })}
    </div>
  )
}

export const ChatView: React.FC = () => {
  const {
    conversations,
    activeConversationId,
    messages,
    isStreaming,
    searchQuery,
    runningMode,
    fetchConversations,
    selectConversation,
    createConversation,
    deleteConversation,
    sendMessage,
    setSearchQuery
  } = useChatStore()

  const addToast = useUIStore(state => state.addToast)
  const [input, setInput] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchConversations()
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = () => {
    if (!input.trim() || isStreaming) return
    sendMessage(input)
    setInput('')
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // Drag and Drop File Handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) {
      await uploadDocument(file)
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      await uploadDocument(file)
    }
  }

  const uploadDocument = async (file: File) => {
    setIsUploading(true)
    addToast(`Parsing document: ${file.name}`, 'info')
    
    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch('http://localhost:8000/api/upload', {
        method: 'POST',
        body: formData
      })
      if (res.ok) {
        const data = await res.json()
        if (data.success) {
          setInput(`Please analyze and summarize the uploaded file "${file.name}":\n\n[Parsed Contents]\n${data.content.slice(0, 1500)}`)
          addToast(`Document content extracted successfully!`, 'success')
        } else {
          addToast(`Upload failed: ${data.message}`, 'error')
        }
      }
    } catch (err) {
      console.error(err)
      addToast('Failed to connect to parser service.', 'error')
    } finally {
      setIsUploading(false)
    }
  }

  const filteredConversations = conversations.filter(c =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div 
      className="flex h-full w-full relative"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* File Drag and Drop Overlay */}
      {isDragging && (
        <div className="absolute inset-0 bg-purple-950/20 backdrop-blur-xs z-40 border-2 border-dashed border-purple-500/40 rounded-xl flex flex-col items-center justify-center pointer-events-none transition-all">
          <div className="p-4 bg-[#0a0a16] border border-purple-500/20 rounded-2xl flex flex-col items-center gap-2 shadow-2xl">
            <UploadCloud className="h-7 w-7 text-purple-400 animate-bounce" />
            <h3 className="text-sm font-bold">Drop document here</h3>
            <p className="text-gray-400 text-[10px]">PDF, Images, Word docs or TXT supported</p>
          </div>
        </div>
      )}

      {/* Conversations Sidebar (Left Panel) */}
      <div className="w-56 border-r border-white/5 flex flex-col bg-[#05050A]/40 flex-shrink-0">
        <div className="p-3 border-b border-white/5 flex flex-col gap-2">
          <button 
            onClick={() => createConversation()}
            className="w-full py-2 bg-gradient-purple-blue text-white rounded-lg text-xs font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-1.5"
          >
            <Plus className="h-3.5 w-3.5" /> New Chat
          </button>
          
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/5 focus:border-purple-500/30 rounded-lg px-3 py-1.5 text-[11px] focus:outline-none transition-all text-white placeholder-gray-500"
          />
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filteredConversations.map((c) => (
            <div
              key={c.id}
              onClick={() => selectConversation(c.id)}
              className={`group flex items-center justify-between p-2.5 rounded-lg text-xs font-medium cursor-pointer transition-all ${
                activeConversationId === c.id
                  ? 'bg-purple-600/10 border border-purple-500/20 text-purple-200'
                  : 'text-gray-400 hover:bg-white/5 border border-transparent'
              }`}
            >
              <div className="truncate flex-1 pr-2">{c.title}</div>
              <button 
                onClick={(e) => {
                  e.stopPropagation()
                  deleteConversation(c.id)
                }}
                className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 transition-opacity p-0.5"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Chat Pane (Right Panel) */}
      <div className="flex-1 flex flex-col bg-[#05050A]/20">
        {/* Banner: Demo Mode Indicator */}
        {runningMode === 'demo' && (
          <div className="bg-yellow-500/10 border-b border-yellow-500/20 px-4 py-1.5 flex items-center justify-between text-[10px] text-yellow-300">
            <div className="flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5 text-yellow-500 flex-shrink-0" />
              <span><strong>Running in Demo Mode</strong> (No local Ollama found at localhost:11434)</span>
            </div>
            <a 
              href="https://ollama.com" 
              target="_blank" 
              rel="noreferrer"
              className="underline hover:text-yellow-100 transition-colors"
            >
              Get Ollama
            </a>
          </div>
        )}

        {/* Chat Logs Area */}
        <div 
          className="flex-1 overflow-y-auto p-4 space-y-4"
          onDragLeave={handleDragLeave}
        >
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-sm mx-auto">
              <Moon className="h-7 w-7 text-purple-400 mb-3 animate-pulse" />
              <h2 className="text-md font-bold mb-1">Luna Neural Assistant</h2>
              <p className="text-gray-400 text-[10px] leading-relaxed">
                Type in the chat input below or drag-and-drop documents (PDF, Word, Images, TXT) to upload and summarize. Try saying: <strong className="text-purple-300">"Open Notepad"</strong>.
              </p>
            </div>
          ) : (
            messages.map((msg) => {
              if (msg.sender === 'luna' && !msg.content) return null
              return (
                <div
                  key={msg.id}
                  className={`flex gap-3 max-w-[85%] ${
                    msg.sender === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'
                  }`}
                >
                  <div 
                    className={`h-7 w-7 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold border ${
                      msg.sender === 'user'
                        ? 'bg-blue-600/10 border-blue-500/20 text-blue-300'
                        : 'bg-purple-600/10 border-purple-500/20 text-purple-300'
                    }`}
                  >
                    {msg.sender === 'user' ? 'U' : 'L'}
                  </div>
                  
                  <div 
                    className={`px-4 py-3 rounded-2xl text-xs relative ${
                      msg.sender === 'user'
                        ? 'bg-blue-600/10 border border-blue-500/10 text-white rounded-tr-none'
                        : 'bg-[#0f0f1c]/80 border border-white/5 text-gray-200 rounded-tl-none shadow-md'
                    }`}
                  >
                    {msg.sender === 'user' ? (
                      <div className="whitespace-pre-wrap leading-relaxed">{msg.content}</div>
                    ) : (
                      <MarkdownMessage text={msg.content} />
                    )}
                    {msg.sender === 'luna' && msg.running_mode === 'demo' && (
                      <span className="absolute bottom-1 right-2 text-[8px] text-yellow-500/40">Demo</span>
                    )}
                  </div>
                </div>
              )
            })
          )}
          {isStreaming && (
            <div className="flex gap-3 mr-auto items-center">
              <div className="h-7 w-7 rounded-full bg-purple-600/10 border border-purple-500/20 flex items-center justify-center text-purple-300 text-xs font-bold">
                L
              </div>
              <div className="flex items-center gap-1.5 px-3 py-2.5 rounded-2xl bg-[#0f0f1c]/80 border border-white/5">
                <span className="h-1.5 w-1.5 bg-purple-400 rounded-full typing-dot"></span>
                <span className="h-1.5 w-1.5 bg-purple-400 rounded-full typing-dot"></span>
                <span className="h-1.5 w-1.5 bg-purple-400 rounded-full typing-dot"></span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar Area */}
        <div className="p-3 border-t border-white/5 bg-[#05050A]/20 flex gap-2 items-end">
          <label className="p-2.5 hover:bg-white/5 border border-white/5 rounded-xl flex items-center justify-center cursor-pointer text-gray-400 hover:text-white transition-colors">
            <input 
              type="file" 
              className="hidden" 
              onChange={handleFileChange} 
              disabled={isUploading}
            />
            {isUploading ? (
              <svg className="animate-spin h-3.5 w-3.5 text-purple-500" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <Paperclip className="h-3.5 w-3.5 text-gray-400 hover:text-white" />
            )}
          </label>

          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder={isUploading ? "Uploading file..." : "Type your command here..."}
            rows={1}
            disabled={isUploading}
            className="flex-1 bg-white/5 border border-white/5 focus:border-purple-500/30 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none resize-none max-h-24 transition-colors placeholder-gray-500 min-h-[38px] leading-relaxed"
          />

          <button
            onClick={handleSend}
            disabled={!input.trim() || isStreaming || isUploading}
            className={`p-2.5 rounded-xl flex items-center justify-center text-xs font-bold transition-all ${
              !input.trim() || isStreaming || isUploading
                ? 'bg-white/5 text-gray-500 border border-white/5 cursor-not-allowed'
                : 'bg-gradient-purple-blue text-white hover:opacity-90 active:scale-95 shadow-md'
            }`}
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}
