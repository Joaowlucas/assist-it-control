import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { useCreateUser } from '@/hooks/useUserManagement'
import { useUnits } from '@/hooks/useUnits'
import { Plus, Loader2 } from 'lucide-react'

export function CreateUserDialog() {
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'user' as 'admin' | 'technician' | 'user',
    unit_id: 'none',
    unit_ids: [] as string[]
  })
  
  const createUser = useCreateUser()
  const { data: units } = useUnits()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (formData.password !== formData.confirmPassword) {
      alert('As senhas não coincidem')
      return
    }

    if (formData.password.length < 6) {
      alert('A senha deve ter pelo menos 6 caracteres')
      return
    }

    // Validar seleção de unidades para técnicos
    if (formData.role === 'technician' && formData.unit_ids.length === 0) {
      alert('Técnicos devem ter pelo menos uma unidade atribuída')
      return
    }

    const userData = {
      name: formData.name,
      email: formData.email,
      password: formData.password,
      role: formData.role,
      unit_id: formData.role === 'technician' ? null : (formData.unit_id === 'none' ? null : formData.unit_id),
      unit_ids: formData.role === 'technician' ? formData.unit_ids : undefined
    }

    createUser.mutate(userData, {
      onSuccess: () => {
        setFormData({
          name: '',
          email: '',
          password: '',
          confirmPassword: '',
          role: 'user',
          unit_id: 'none',
          unit_ids: []
        })
        setOpen(false)
      }
    })
  }

  const handleUnitToggle = (unitId: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      unit_ids: checked 
        ? [...prev.unit_ids, unitId]
        : prev.unit_ids.filter(id => id !== unitId)
    }))
  }

  const handleRoleChange = (role: 'admin' | 'technician' | 'user') => {
    setFormData(prev => ({
      ...prev,
      role,
      unit_id: role === 'technician' ? 'none' : prev.unit_id,
      unit_ids: role === 'technician' ? prev.unit_ids : []
    }))
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Adicionar Usuário
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto">
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
            <Label htmlFor="confirmPassword">Confirmar Senha</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
              required
              minLength={6}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="role">Função</Label>
            <Select value={formData.role} onValueChange={handleRoleChange}>
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
          
          {formData.role === 'technician' ? (
            <div className="space-y-2">
              <Label>Unidades (Selecione uma ou mais)</Label>
              <div className="space-y-2 max-h-32 overflow-y-auto border rounded p-2">
                {units?.map((unit) => (
                  <div key={unit.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`unit-${unit.id}`}
                      checked={formData.unit_ids.includes(unit.id)}
                      onCheckedChange={(checked) => handleUnitToggle(unit.id, !!checked)}
                    />
                    <Label htmlFor={`unit-${unit.id}`} className="text-sm">
                      {unit.name}
                    </Label>
                  </div>
                ))}
              </div>
              {formData.unit_ids.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Técnicos devem ter pelo menos uma unidade selecionada
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="unit">Unidade</Label>
              <Select value={formData.unit_id} onValueChange={(value) => setFormData(prev => ({ ...prev, unit_id: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma unidade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhuma unidade</SelectItem>
                  {units?.map((unit) => (
                    <SelectItem key={unit.id} value={unit.id}>
                      {unit.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          
          <Button type="submit" className="w-full" disabled={createUser.isPending}>
            {createUser.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Criando...
              </>
            ) : (
              'Criar Usuário'
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
