
import { useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useSystemSettings } from '@/hooks/useSystemSettings'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { ThemeToggle } from '@/components/ThemeToggle'

export default function Login() {
  const { user, profile, signIn, loading: authLoading } = useAuth()
  const { data: systemSettings, isLoading: settingsLoading } = useSystemSettings()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // Se está carregando autenticação E não temos dados ainda, mostrar loading
  if (authLoading && !user && !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center space-y-4">
            <Skeleton className="h-16 w-16 mx-auto rounded" />
            <Skeleton className="h-6 w-48 mx-auto" />
            <Skeleton className="h-4 w-32 mx-auto" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (user && profile) {
    // Verificar se há uma rota de origem no state
    const from = location.state?.from?.pathname || (profile.role === 'user' ? '/user-portal' : '/')
    return <Navigate to={from} replace />
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      await signIn(email, password)
    } catch (error: any) {
      setError(error.message || 'Erro ao fazer login')
    } finally {
      setIsLoading(false)
    }
  }

  const renderLogo = () => {
    if (systemSettings?.company_logo_url) {
      return (
        <img 
          src={systemSettings.company_logo_url} 
          alt="Logo da Empresa" 
          className="h-12 md:h-16 w-auto object-contain transition-transform duration-300 hover:scale-105"
          onError={(e) => {
            e.currentTarget.style.display = 'none'
          }}
        />
      )
    }
    
    if (settingsLoading) {
      return <Skeleton className="h-12 md:h-16 w-16 rounded" />
    }
    
    return (
      <div className="h-12 md:h-16 w-12 md:w-16 bg-muted rounded flex items-center justify-center">
        <span className="text-xl md:text-2xl font-bold text-muted-foreground">
          {systemSettings?.company_name?.charAt(0) || 'S'}
        </span>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 relative">
      {/* Theme toggle no canto superior direito */}
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      
      <Card className="w-full max-w-sm md:max-w-md glass-card animate-fade-in">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center mb-2 md:mb-4">
            {renderLogo()}
          </div>
          <CardTitle className="text-lg md:text-xl">Sistema de Suporte TI</CardTitle>
          <CardDescription className="text-sm">
            Faça login para acessar o sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                className="h-11 transition-all duration-200 focus:scale-[1.02]"
                placeholder="seu.email@empresa.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">Senha</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
                className="h-11 transition-all duration-200 focus:scale-[1.02]"
                placeholder="••••••••"
              />
            </div>
            {error && (
              <Alert variant="destructive" className="animate-in">
                <AlertDescription className="text-sm">{error}</AlertDescription>
              </Alert>
            )}
            <Button 
              type="submit" 
              className="w-full h-11 apple-button" 
              disabled={isLoading}
            >
              {isLoading ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
