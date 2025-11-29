'use client'

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'

interface User {
  userId: string
  email: string | null
  name: string | null
}

interface UserContextType {
  user: User | null
  loading: boolean
  refreshUser: () => Promise<void>
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchUser = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/auth/me', {
        credentials: 'include',
        cache: 'no-store',
      })
      if (res.ok) {
        const data = await res.json()
        console.log('UserContext - API response:', data) // 디버깅
        if (data.authenticated && data.user) {
          setUser(data.user)
          console.log('UserContext - User set:', data.user) // 디버깅
        } else {
          setUser(null)
          console.log('UserContext - Not authenticated') // 디버깅
        }
      } else {
        setUser(null)
        console.log('UserContext - API error:', res.status) // 디버깅
      }
    } catch (err) {
      console.error('UserContext - Failed to fetch user:', err)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUser()
  }, [])

  return (
    <UserContext.Provider value={{ user, loading, refreshUser: fetchUser }}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider')
  }
  return context
}

