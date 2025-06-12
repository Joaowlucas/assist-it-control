
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"

// Mock users - em produção, isso viria de uma API/banco de dados
const mockUsers = [
  { id: "1", email: "admin@empresa.com", password: "admin123", role: "admin", name: "Administrador" },
  { id: "2", email: "user@empresa.com", password: "user123", role: "user", name: "João Silva" },
  { id: "3", email: "maria@empresa.com", password: "maria123", role: "user", name: "Maria Santos" }
]

export default function Login() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()
  const { toast } = useToast()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // Simular delay de autenticação
    await new Promise(resolve => setTimeout(resolve, 1000))

    const user = mockUsers.find(u => u.email === email && u.password === password)
    
    if (user) {
      // Salvar dados do usuário no localStorage
      localStorage.setItem('currentUser', JSON.stringify(user))
      
      toast({
        title: "Login realizado com sucesso!",
        description: `Bem-vindo, ${user.name}`,
      })

      // Redirecionar baseado no role
      if (user.role === 'admin') {
        navigate('/')
      } else {
        navigate('/user-portal')
      }
    } else {
      toast({
        title: "Erro de autenticação",
        description: "Email ou senha incorretos",
        variant: "destructive"
      })
    }
    
    setIsLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">Sistema de Suporte de TI</CardTitle>
          <CardDescription className="text-center">
            Entre com suas credenciais para acessar o sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Entrando..." : "Entrar"}
            </Button>
          </form>
          
          <div className="mt-6 text-sm text-muted-foreground">
            <p className="text-center mb-2">Usuários de teste:</p>
            <p><strong>Admin:</strong> admin@empresa.com / admin123</p>
            <p><strong>Usuário:</strong> user@empresa.com / user123</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
