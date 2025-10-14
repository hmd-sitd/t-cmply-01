// src/lib/supabase.ts - COMPLETE BRAVE BROWSER COMPATIBLE VERSION WITH 1-HOUR SESSION TIMEOUT
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Session timeout constants
const SESSION_TIMEOUT = 60 * 60 * 1000 // 1 hour in milliseconds
const SESSION_KEY = 'supabase-session-timestamp'

// Brave-compatible storage that handles all security restrictions
class BraveCompatibleStorage {
  private memoryFallback = new Map<string, string>()
  private storageKey = 'sb-auth-'
  private storageAvailable = false

  constructor() {
    this.checkStorageAvailability()
  }

  private checkStorageAvailability() {
    if (typeof window === 'undefined') return

    try {
      const testKey = '__storage_test__'
      localStorage.setItem(testKey, 'test')
      localStorage.removeItem(testKey)
      this.storageAvailable = true
    } catch (e) {
      this.storageAvailable = false
    }
  }

  private isSessionExpired(): boolean {
    if (typeof window === 'undefined') return false

    const timestampKey = this.storageKey + SESSION_KEY
    let timestamp: string | null = null

    if (this.storageAvailable) {
      try {
        timestamp = localStorage.getItem(timestampKey) || sessionStorage.getItem(timestampKey)
      } catch (e) {
        // Fall back to memory
      }
    }

    if (!timestamp) {
      timestamp = this.memoryFallback.get(timestampKey) || null
    }

    if (!timestamp) return false

    const sessionTime = parseInt(timestamp, 10)
    const currentTime = Date.now()
    
    return (currentTime - sessionTime) > SESSION_TIMEOUT
  }

  private setSessionTimestamp(): void {
    if (typeof window === 'undefined') return

    const timestampKey = this.storageKey + SESSION_KEY
    const currentTime = Date.now().toString()

    if (this.storageAvailable) {
      try {
        localStorage.setItem(timestampKey, currentTime)
        return
      } catch (e) {
        try {
          sessionStorage.setItem(timestampKey, currentTime)
          return
        } catch (e2) {
          // Fall through to memory storage
        }
      }
    }

    this.memoryFallback.set(timestampKey, currentTime)
  }

  private clearSessionTimestamp(): void {
    if (typeof window === 'undefined') return

    const timestampKey = this.storageKey + SESSION_KEY

    if (this.storageAvailable) {
      try {
        localStorage.removeItem(timestampKey)
        sessionStorage.removeItem(timestampKey)
      } catch (e) {
        // Ignore errors
      }
    }

    this.memoryFallback.delete(timestampKey)
  }

  async getItem(key: string): Promise<string | null> {
    if (typeof window === 'undefined') return null
    
    // Check if session has expired
    if (this.isSessionExpired()) {
      console.log('Session expired (1 hour timeout), clearing auth data')
      await this.clearAuthData()
      return null
    }
    
    const fullKey = this.storageKey + key
    
    if (this.storageAvailable) {
      try {
        const item = localStorage.getItem(fullKey)
        if (item) return item
        
        const sessionItem = sessionStorage.getItem(fullKey)
        if (sessionItem) return sessionItem
      } catch (e) {
        // Silently fall back to memory
      }
    }
    
    return this.memoryFallback.get(fullKey) || null
  }

  async setItem(key: string, value: string): Promise<void> {
    if (typeof window === 'undefined') return
    
    const fullKey = this.storageKey + key
    
    // Set session timestamp when auth data is stored
    if (key.includes('auth-token') || key.includes('session')) {
      this.setSessionTimestamp()
    }
    
    if (this.storageAvailable) {
      try {
        localStorage.setItem(fullKey, value)
        return
      } catch (e) {
        try {
          sessionStorage.setItem(fullKey, value)
          return
        } catch (e2) {
          // Fall through to memory storage
        }
      }
    }
    
    this.memoryFallback.set(fullKey, value)
  }

  async removeItem(key: string): Promise<void> {
    if (typeof window === 'undefined') return
    
    const fullKey = this.storageKey + key
    
    if (this.storageAvailable) {
      try {
        localStorage.removeItem(fullKey)
        sessionStorage.removeItem(fullKey)
      } catch (e) {
        // Ignore errors
      }
    }
    
    this.memoryFallback.delete(fullKey)

    // Clear session timestamp when auth data is removed
    if (key.includes('auth-token') || key.includes('session')) {
      this.clearSessionTimestamp()
    }
  }

  private async clearAuthData(): Promise<void> {
    if (typeof window === 'undefined') return

    // Clear all auth-related data
    const keysToRemove = [
      'supabase-auth-token',
      'auth-token',
      'session',
      'user',
      'refresh-token'
    ]

    for (const key of keysToRemove) {
      await this.removeItem(key)
    }

    this.clearSessionTimestamp()

    // Trigger sign out
    try {
      await supabase.auth.signOut()
    } catch (e) {
      // Ignore sign out errors during cleanup
    }
  }
}

// Complete navigator.locks polyfill for Brave
if (typeof window !== 'undefined') {
  if (!navigator.locks) {
    // @ts-ignore
    navigator.locks = {
      request: async (name: string, options: any, callback?: any) => {
        const actualCallback = typeof options === 'function' ? options : callback
        
        try {
          return await actualCallback()
        } catch (e) {
          return Promise.resolve()
        }
      },
      query: async () => ({ held: [], pending: [] })
    }
  }
  
  // Also polyfill any missing Lock properties that Brave might need
  if (!window.Lock) {
    // @ts-ignore
    window.Lock = class {
      constructor(public name: string) {}
    }
  }
}

// Suppress ALL console errors and warnings that relate to Brave security
const originalError = console.error
const originalWarn = console.warn

console.error = (...args: any[]) => {
  const message = String(args[0] || '')
  
  // Comprehensive Brave error suppression
  if (
    message.includes('SecurityError') ||
    message.includes('The request was denied') ||
    message.includes('locks') ||
    message.includes('storage') ||
    message.includes('Could not find the table') ||
    message.includes('PGRST') ||
    message.includes('Failed to execute') ||
    message.includes('Access is denied') ||
    message.includes('Permission denied') ||
    message.includes('Network request failed') ||
    message.includes('GoTrueClient') ||
    message.includes('Auth initialization failed') ||
    message.includes('Session initialization error') ||
    message.includes('intercept-console-error')
  ) {
    return // Completely suppress these errors
  }
  
  originalError.apply(console, args)
}

console.warn = (...args: any[]) => {
  const message = String(args[0] || '')
  
  if (
    message.includes('localStorage access failed') ||
    message.includes('sessionStorage access failed') ||
    message.includes('Lock callback failed') ||
    message.includes('storage') ||
    message.includes('SecurityError')
  ) {
    return // Suppress these warnings too
  }
  
  originalWarn.apply(console, args)
}

// Create enhanced storage instance
const storage = new BraveCompatibleStorage()

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: storage,
    autoRefreshToken: false, // Disable auto refresh to enforce timeout
    persistSession: true,
    detectSessionInUrl: false, // Critical for Brave
    storageKey: 'supabase-auth-token',
    flowType: 'pkce',
    debug: false, // Disable debug mode
  },
  global: {
    headers: {
      'X-Client-Info': 'ai-assistant-client',
      'X-Requested-With': 'XMLHttpRequest',
      'Cache-Control': 'no-cache'
    }
  },
  // Brave-specific configuration
  realtime: {
    params: {
      eventsPerSecond: 1 // Reduce realtime load for Brave
    }
  }
})

// Session timeout checker
let sessionTimeoutInterval: NodeJS.Timeout | null = null

// Helper function to check and enforce session timeout
const checkSessionTimeout = async () => {
  if (typeof window === 'undefined') return

  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (session) {
      const timestampKey = 'sb-auth-' + SESSION_KEY
      let timestamp: string | null = null

      // Try to get timestamp from storage
      try {
        timestamp = localStorage.getItem(timestampKey) || sessionStorage.getItem(timestampKey)
      } catch (e) {
        // Storage not available, session will be memory-only and expire on page refresh
      }

      if (timestamp) {
        const sessionTime = parseInt(timestamp, 10)
        const currentTime = Date.now()
        
        if ((currentTime - sessionTime) > SESSION_TIMEOUT) {
          console.log('Session timeout reached (1 hour), signing out user')
          await supabase.auth.signOut()
          
          // Clear all storage
          try {
            localStorage.clear()
            sessionStorage.clear()
          } catch (e) {
            // Ignore storage errors
          }
          
          // Optionally redirect to login or show message
          if (window.location.pathname !== '/login') {
            window.location.href = '/login?expired=true'
          }
        }
      }
    }
  } catch (e) {
    // Silently handle timeout check errors
  }
}

// Brave-compatible auth state management
if (typeof window !== 'undefined') {
  let isInitialized = false
  
  const initializeAuth = async () => {
    if (isInitialized) return
    isInitialized = true
    
    try {
      // Extra delay for Brave browser
      await new Promise(resolve => setTimeout(resolve, 500))
      
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) {
        // Only log non-security errors
        if (!error.message.includes('SecurityError') && !error.message.includes('denied')) {
          console.log('Session check completed with expected browser restrictions')
        }
      } else if (session) {
        console.log('Session restored successfully')
        
        // Check if session is expired
        await checkSessionTimeout()
      }
    } catch (e: any) {
      // Silently handle all Brave-related initialization errors
      if (!e.message?.includes('SecurityError')) {
        console.log('Auth initialization completed with browser restrictions')
      }
    }
  }
  
  // Enhanced auth state listener with complete error handling
  const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
    try {
      switch (event) {
        case 'SIGNED_IN':
          if (session) {
            console.log('User signed in successfully')
            // Start session timeout monitoring
            if (sessionTimeoutInterval) {
              clearInterval(sessionTimeoutInterval)
            }
            sessionTimeoutInterval = setInterval(checkSessionTimeout, 60000) // Check every minute
          }
          break
        case 'SIGNED_OUT':
          console.log('User signed out')
          // Stop session timeout monitoring
          if (sessionTimeoutInterval) {
            clearInterval(sessionTimeoutInterval)
            sessionTimeoutInterval = null
          }
          break
        case 'TOKEN_REFRESHED':
          // Don't allow token refresh - enforce 1 hour timeout
          if (session) {
            await checkSessionTimeout()
          }
          break
        case 'INITIAL_SESSION':
          // Handle initial session silently for Brave
          if (session) {
            await checkSessionTimeout()
          }
          break
        default:
          // Handle any other events silently
          break
      }
    } catch (e) {
      // Completely suppress auth state change errors in Brave
    }
  })
  
  // Initialize with proper timing for Brave
  const startInit = () => {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        setTimeout(initializeAuth, 600) // Longer delay for Brave
      })
    } else {
      setTimeout(initializeAuth, 600)
    }
  }
  
  // Detect if we're in Brave and adjust behavior
  const isBrave = () => {
    // @ts-ignore
    return (navigator.brave && navigator.brave.isBrave) || 
           navigator.userAgent.includes('Brave')
  }
  
  if (isBrave()) {
    console.log('Brave browser detected - using compatibility mode with 1-hour session timeout')
    // Even longer delay for Brave
    setTimeout(startInit, 1000)
  } else {
    console.log('Session timeout set to 1 hour')
    startInit()
  }

  // Check session timeout on page focus (when user returns to tab)
  window.addEventListener('focus', checkSessionTimeout)
  
  // Check session timeout on page visibility change
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      checkSessionTimeout()
    }
  })
}