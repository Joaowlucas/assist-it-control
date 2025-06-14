
import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { Session, User } from '@supabase/supabase-js'
import { Tables } from '@/integrations/supabase/types'

type Profile = Tables<'profiles'> & {
  unit?: { name: string } | null
}

interface AuthContextType {
  session: Session | null
  user: User | null
  profile: Profile | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, name: string) => Promise<void>
  signOut: () => Promise<void>
  updateProfile: (updates: Partial<Profile>) => Promise<void>
}

// Função para limpeza completa do estado de autenticação
const cleanupAuthState = () => {
  try {
    // Remove tokens padrão do Supabase
    localStorage.removeItem('supabase.auth.token')
    
    // Remove todas as chaves relacionadas ao Supabase
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
        localStorage.removeItem(key)
      }
    })
    
    // Limpa sessionStorage também se existir
    if (typeof sessionStorage !== 'undefined') {
      Object.keys(sessionStorage).forEach((key) => {
        if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
          sessionStorage.removeItem(key)
        }
      })
    }
    
    console.log('Auth state cleanup completed')
  } catch (error) {
    console.error('Error during auth cleanup:', error)
  }
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const fetchingProfile = useRef(false)
  const mounted = useRef(true)
  const initialLoadComplete = useRef(false)

  const fetchProfile = useCallback(async (userId: string) => {
    if (fetchingProfile.current || !mounted.current) return
    
    fetchingProfile.current = true
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          unit:units(name)
        `)
        .eq('id', userId)
        .single()
      
      if (error) {
        console.error('Error fetching profile:', error)
        return
      }
      
      if (mounted.current) {
        setProfile(data)
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
    } finally {
      fetchingProfile.current = false
    }
  }, [])

  useEffect(() => {
    mounted.current = true

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted.current) return
      
      console.log('Initial session check:', session?.user?.email || 'No session')
      setSession(session)
      setUser(session?.user ?? null)
      
      if (session?.user && !fetchingProfile.current) {
        fetchProfile(session.user.id)
      } else if (!session) {
        setProfile(null)
      }
      
      if (!initialLoadComplete.current) {
        initialLoadComplete.current = true
        setTimeout(() => setLoading(false), 100)
      }
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted.current) return
      
      console.log('Auth state change:', event, session?.user?.email || 'No session')
      
      setSession(session)
      setUser(session?.user ?? null)
      
      if (session?.user && event === 'SIGNED_IN') {
        if (!fetchingProfile.current) {
          setTimeout(() => {
            fetchProfile(session.user.id)
          }, 0)
        }
      } else {
        setProfile(null)
      }
      
      if (initialLoadComplete.current) {
        setLoading(false)
      }
    })

    return () => {
      mounted.current = false
      subscription.unsubscribe()
    }
  }, [fetchProfile])

  const signIn = async (email: string, password: string) => {
    // Limpa estado antes de fazer login
    cleanupAuthState()
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error
  }

  const signUp = async (email: string, password: string, name: string) => {
    const redirectUrl = `${window.location.origin}/`
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
        },
        emailRedirectTo: redirectUrl
      },
    })
    if (error) throw error
  }

  const signOut = async () => {
    try {
      console.log('Starting logout process...')
      
      // Primeiro, limpa o estado local
      cleanupAuthState()
      
      // Tenta fazer logout global no Supabase
      try {
        const { error } = await supabase.auth.signOut({ scope: 'global' })
        if (error && !error.message.includes('session_not_found')) {
          console.error('Logout error:', error)
        }
      } catch (err) {
        // Ignora erros de sessão não encontrada
        console.log('Logout completed with cleanup (session may have been expired)')
      }
      
      // Limpa estados locais
      setSession(null)
      setUser(null)
      setProfile(null)
      
      // Força reload da página para garantir estado limpo
      setTimeout(() => {
        window.location.href = '/login'
      }, 100)
      
    } catch (error) {
      console.error('Error during signOut:', error)
      // Mesmo com erro, força logout local
      cleanupAuthState()
      setSession(null)
      setUser(null)
      setProfile(null)
      window.location.href = '/login'
    }
  }

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) throw new Error('No user logged in')
    
    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)
    
    if (error) throw error
    
    // Refetch profile
    await fetchProfile(user.id)
  }

  const value = {
    session,
    user,
    profile,
    loading,
    signIn,
    signUp,
    signOut,
    updateProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
