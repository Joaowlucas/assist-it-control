
import { ReactNode } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"

interface UserLayoutProps {
  children: ReactNode
}

export function UserLayout({ children }: UserLayoutProps) {
  const navigate = useNavigate()
  const currentUserStr = localStorage.getItem('currentUser')
  const currentUser = currentUserStr ? JSON.parse(currentUserStr) : null

  const handleLogout = () => {
    localStorage.removeItem('currentUser')
    navigate('/login')
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="h-16 flex items-center justify-between border-b bg-card px-6">
        <h1 className="text-xl font-semibold">Portal do Usuário - Suporte TI</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">
            Bem-vindo, {currentUser?.name || 'Usuário'}
          </span>
          <Button variant="outline" onClick={handleLogout}>
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
