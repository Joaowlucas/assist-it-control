
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"

// Mock users database
const mockUsers = [
  { id: "1", email: "admin@empresa.com", password: "admin123", name: "Administrador", role: "admin" },
  { id: "2", email: "user@empresa.com", password: "user123", name: "João Silva", role: "user" },
  { id: "3", email: "carlos@empresa.com", password: "tech123", name: "Carlos Tech", role: "technician" },
  { id: "4", email: "ana@empresa.com", password: "tech123", name: "Ana Tech", role: "technician" },
]

export default function Login() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // Simulate API call
    setTimeout(() => {
      const user = mockUsers.find(u => u.email === email && u.password === password)
      
      if (user) {
        localStorage.setItem('currentUser', JSON.stringify(user))
        
        toast({
          title: "Login realizado com sucesso!",
          description: `Bem-vindo, ${user.name}!`,
        })

        // Redirect based on role
        if (user.role === "admin" || user.role === "technician") {
          navigate("/")
        } else {
          navigate("/user-portal")
        }
      } else {
        toast({
          title: "Erro no login",
          description: "Email ou senha incorretos.",
          variant: "destructive",
        })
      }
      
      setIsLoading(false)
    }, 1000)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">Sistema de Suporte TI</CardTitle>
          <CardDescription className="text-center">
            Entre com suas credenciais para acessar o sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
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
            <p className="font-medium mb-2">Credenciais de teste:</p>
            <div className="space-y-1">
              <p><strong>Admin:</strong> admin@empresa.com / admin123</p>
              <p><strong>Usuário:</strong> user@empresa.com / user123</p>
              <p><strong>Técnico:</strong> carlos@empresa.com / tech123</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
