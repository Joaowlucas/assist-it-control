
import { ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/useAuth"
import { useNavigate } from "react-router-dom"

interface UserLayoutProps {
  children: ReactNode
}

export function UserLayout({ children }: UserLayoutProps) {
  const { signOut, profile } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    try {
      await signOut()
      navigate('/login')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <header className="h-16 flex items-center justify-between border-b border-slate-200 bg-slate-100/50 px-6">
        <h1 className="text-xl font-semibold text-slate-700">Portal do Usuário - Suporte TI</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-600">
            Bem-vindo, {profile?.name || 'Usuário'}
          </span>
          <Button variant="outline" onClick={handleLogout} className="border-slate-300 text-slate-700 hover:bg-slate-200">
            Sair
          </Button>
        </div>
      </header>
      
      <main className="flex-1 p-6">
        {children}
      </main>
    </div>
  )
}
