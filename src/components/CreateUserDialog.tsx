
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Card, CardContent } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'
import { useUnits } from '@/hooks/useUnits'
import { Plus } from 'lucide-react'

export function CreateUserDialog() {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'user' as 'admin' | 'technician' | 'user',
    unit_id: ''
  })
  
  const { toast } = useToast()
  const { data: units } = useUnits()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Criar usuário no Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: formData.email,
        password: formData.password,
        user_metadata: {
          name: formData.name
        },
        email_confirm: true
      })

      if (authError) throw authError

      // Atualizar o perfil com o role e unit_id corretos
      if (authData.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            role: formData.role,
            unit_id: formData.unit_id || null
          })
          .eq('id', authData.user.id)

        if (profileError) throw profileError
      }

      toast({
        title: 'Sucesso',
        description: 'Usuário criado com sucesso'
      })

      setFormData({
        name: '',
        email: '',
        password: '',
        role: 'user',
        unit_id: ''
      })
      setOpen(false)
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao criar usuário',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Usuário
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Criar Novo Usuário</DialogTitle>
            <DialogDescription>
              Preencha os dados para criar um novo usuário no sistema.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                required
                minLength={6}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="role">Função</Label>
              <Select value={formData.role} onValueChange={(value: 'admin' | 'technician' | 'user') => setFormData(prev => ({ ...prev, role: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma função" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">Usuário</SelectItem>
                  <SelectItem value="technician">Técnico</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="unit">Unidade</Label>
              <Select value={formData.unit_id} onValueChange={(value) => setFormData(prev => ({ ...prev, unit_id: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma unidade" />
                </SelectTrigger>
                <SelectContent>
                  {units?.map((unit) => (
                    <SelectItem key={unit.id} value={unit.id}>
                      {unit.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Criando...' : 'Criar Usuário'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Card com instruções para usuários de teste */}
      <Card className="mt-6">
        <CardContent className="pt-6">
          <h3 className="font-semibold mb-2">Usuários para Teste</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Para testar o sistema, você pode criar usuários com os seguintes dados:
          </p>
          <div className="space-y-2 text-sm">
            <div className="p-2 bg-muted rounded">
              <strong>Admin:</strong> admin@empresa.com / senha123 (Função: Administrador)
            </div>
            <div className="p-2 bg-muted rounded">
              <strong>Técnico:</strong> tecnico@empresa.com / senha123 (Função: Técnico)
            </div>
            <div className="p-2 bg-muted rounded">
              <strong>Usuário:</strong> usuario@empresa.com / senha123 (Função: Usuário)
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  )
}
