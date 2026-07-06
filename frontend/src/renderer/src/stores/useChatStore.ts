import { create } from 'zustand'
import { useUIStore } from './useUIStore'

export interface Message {
  id: number
  conversation_id: string
  sender: 'user' | 'luna'
  content: string
  running_mode: 'normal' | 'demo'
  created_at: string
}

export interface Conversation {
  id: string
  title: string
  created_at: string
  updated_at: string
}

export interface PendingAutomation {
  action_id: string
  app_name: string
  user_prompt: string
}

interface ChatState {
  conversations: Conversation[]
  activeConversationId: string | null
  messages: Message[]
  isFetchingConversations: boolean
  isFetchingMessages: boolean
  isStreaming: boolean
  searchQuery: string
  runningMode: 'local' | 'demo'
  pendingAutomation: PendingAutomation | null

  fetchConversations: () => Promise<void>
  selectConversation: (id: string) => Promise<void>
  createConversation: (title?: string) => Promise<string>
  deleteConversation: (id: string) => Promise<void>
  renameConversation: (id: string, title: string) => Promise<void>
  sendMessage: (content: string) => Promise<void>
  setSearchQuery: (query: string) => void
  resolvePendingAutomation: (allow: boolean) => Promise<void>
}

const API_BASE = 'http://localhost:8000/api'

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [],
  activeConversationId: null,
  messages: [],
  isFetchingConversations: false,
  isFetchingMessages: false,
  isStreaming: false,
  searchQuery: '',
  runningMode: 'local',
  pendingAutomation: null,

  fetchConversations: async () => {
    set({ isFetchingConversations: true })
    try {
      const res = await fetch(`${API_BASE}/conversations`)
      if (res.ok) {
        const data = await res.json()
        set({ conversations: data })
        
        // Auto-select first conversation if none is active
        if (data.length > 0 && !get().activeConversationId) {
          get().selectConversation(data[0].id)
        }
      }
    } catch (err) {
      console.error(err)
    } finally {
      set({ isFetchingConversations: false })
    }
  },

  selectConversation: async (id) => {
    set({ activeConversationId: id, isFetchingMessages: true, messages: [] })
    try {
      const res = await fetch(`${API_BASE}/conversations/${id}/messages`)
      if (res.ok) {
        const data = await res.json()
        set({ messages: data })
      }
    } catch (err) {
      console.error(err)
    } finally {
      set({ isFetchingMessages: false })
    }
  },

  createConversation: async (title = 'New Conversation') => {
    const id = Math.random().toString(36).substring(2, 15)
    try {
      const res = await fetch(`${API_BASE}/conversations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, title })
      })
      if (res.ok) {
        await get().fetchConversations()
        set({ activeConversationId: id, messages: [] })
        return id
      }
    } catch (err) {
      console.error(err)
    }
    return ''
  },

  deleteConversation: async (id) => {
    try {
      const res = await fetch(`${API_BASE}/conversations/${id}`, { method: 'DELETE' })
      if (res.ok) {
        const updatedList = get().conversations.filter(c => c.id !== id)
        set({ conversations: updatedList })
        if (get().activeConversationId === id) {
          if (updatedList.length > 0) {
            get().selectConversation(updatedList[0].id)
          } else {
            set({ activeConversationId: null, messages: [] })
          }
        }
      }
    } catch (err) {
      console.error(err)
    }
  },

  renameConversation: async (id, title) => {
    try {
      const res = await fetch(`${API_BASE}/conversations/${id}?title=${encodeURIComponent(title)}`, {
        method: 'PUT'
      })
      if (res.ok) {
        get().fetchConversations()
      }
    } catch (err) {
      console.error(err)
    }
  },

  sendMessage: async (content) => {
    let convId = get().activeConversationId
    if (!convId) {
      convId = await get().createConversation(content.slice(0, 30))
      if (!convId) return
    }

    // 1. Check for system automation intent
    try {
      const detectRes = await fetch(`${API_BASE}/automation/detect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, conversation_id: convId })
      })
      
      if (detectRes.ok) {
        const detectData = await detectRes.json()
        if (detectData.matched) {
          if (detectData.status === 'ask') {
            // Pause and prompt user
            set({
              pendingAutomation: {
                action_id: detectData.action_id,
                app_name: detectData.app_name,
                user_prompt: content
              }
            })
            return
          } else if (detectData.status === 'allow_always') {
            // Execute immediately and proceed to show action in chat
            await fetch(`${API_BASE}/automation/execute?action_id=${detectData.action_id}`, { method: 'POST' })
            useUIStore.getState().addToast(`Automated Action: Opened ${detectData.app_name}`, 'success')
          }
        }
      }
    } catch (e) {
      console.error('Automation detection failure:', e)
    }

    // 2. Perform streaming chat logic
    // Create optimistic user message
    const tempUserMsg: Message = {
      id: Date.now(),
      conversation_id: convId,
      sender: 'user',
      content,
      running_mode: 'normal',
      created_at: new Date().toISOString()
    }
    
    set(state => ({ messages: [...state.messages, tempUserMsg], isStreaming: true }))

    // Create a skeleton assistant message that we will append tokens to
    const assistantMsgId = Date.now() + 1
    const tempAssistantMsg: Message = {
      id: assistantMsgId,
      conversation_id: convId,
      sender: 'luna',
      content: '',
      running_mode: 'normal',
      created_at: new Date().toISOString()
    }
    
    set(state => ({ messages: [...state.messages, tempAssistantMsg] }))

    try {
      const response = await fetch(`${API_BASE}/chat/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, conversation_id: convId })
      })

      if (!response.ok) {
        throw new Error('Streaming failed')
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let fullContent = ''

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunkText = decoder.decode(value)
          // Splitting lines since backend yields JSON Lines
          const lines = chunkText.split('\n')

          for (const line of lines) {
            if (line.trim()) {
              try {
                const parsed = JSON.parse(line.trim())
                
                if (parsed.type === 'metadata') {
                  set({ runningMode: parsed.mode })
                } else if (parsed.type === 'content') {
                  fullContent += parsed.text
                  
                  // Update messages state dynamically
                  set(state => ({
                    messages: state.messages.map(msg => 
                      msg.id === assistantMsgId 
                        ? { ...msg, content: fullContent, running_mode: state.runningMode === 'demo' ? 'demo' : 'normal' }
                        : msg
                    )
                  }))
                }
              } catch (e) {
                // Ignore incomplete JSON chunks from buffer
              }
            }
          }
        }
      }
    } catch (err) {
      console.error(err)
      // Display failure gracefully
      set(state => ({
        messages: state.messages.map(msg => 
          msg.id === assistantMsgId 
            ? { ...msg, content: 'I encountered an issue connecting to the local AI backend. Please verify that the application is running normally.' }
            : msg
        )
      }))
    } finally {
      set({ isStreaming: false })
      get().fetchConversations() // reload list to show updated title / time
    }
  },

  setSearchQuery: (query) => set({ searchQuery: query }),

  resolvePendingAutomation: async (allow) => {
    const action = get().pendingAutomation
    if (!action) return

    set({ pendingAutomation: null })
    const convId = get().activeConversationId

    if (allow) {
      useUIStore.getState().addToast(`Executing system action: ${action.app_name}`, 'info')
      
      // 1. Add optimistic user message to chat
      const tempUserMsg: Message = {
        id: Date.now(),
        conversation_id: convId || '',
        sender: 'user',
        content: action.user_prompt,
        running_mode: 'normal',
        created_at: new Date().toISOString()
      }
      set(state => ({ messages: [...state.messages, tempUserMsg] }))

      // 2. Execute command
      try {
        const res = await fetch(`${API_BASE}/automation/execute?action_id=${action.action_id}`, { method: 'POST' })
        const data = await res.json()

        // 3. Add success/error system message to chat
        const tempAssistantMsg: Message = {
          id: Date.now() + 1,
          conversation_id: convId || '',
          sender: 'luna',
          content: data.success 
            ? `✅ **Action Approved**: Successfully launched **${action.app_name}**.`
            : `❌ **Execution Error**: Could not launch **${action.app_name}**. ${data.message}`,
          running_mode: 'normal',
          created_at: new Date().toISOString()
        }
        set(state => ({ messages: [...state.messages, tempAssistantMsg] }))
        useUIStore.getState().addToast(`Successfully launched ${action.app_name}`, 'success')
      } catch (err) {
        console.error(err)
      }
    } else {
      useUIStore.getState().addToast(`System action cancelled by user.`, 'warning')
    }
  }
}))
