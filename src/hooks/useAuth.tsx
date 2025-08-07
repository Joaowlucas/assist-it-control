
import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { Session, User } from '@supabase/supabase-js'
import { Tables } from '@/integrations/supabase/types'

type Profile = Tables<'profiles'> & {
  unit?: { name: string } | null
  technician_units?: Array<{
    id: string
    unit_id: string
    unit: { name: string }
  }>
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
          unit:units(name),
          technician_units(
            id,
            unit_id,
            unit:units(name)
          )
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
      
      setSession(session)
      setUser(session?.user ?? null)
      
      if (session?.user && !fetchingProfile.current) {
        fetchProfile(session.user.id)
      } else if (!session) {
        setProfile(null)
      }
      
      // Reduzir tempo de loading inicial drasticamente
      if (!initialLoadComplete.current) {
        initialLoadComplete.current = true
        setTimeout(() => setLoading(false), 100) // Mínimo delay para evitar flash
      }
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted.current) return
      
      console.log('Auth state change:', event, session?.user?.email)
      
      setSession(session)
      setUser(session?.user ?? null)
      
      if (session?.user && event === 'SIGNED_IN') {
        if (!fetchingProfile.current) {
          fetchProfile(session.user.id)
        }
      } else {
        setProfile(null)
      }
      
      // Loading completo após primeira inicialização
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
    const { error } = await supabase.auth.signOut()
    if (error) throw error
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
