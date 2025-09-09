
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { useUpdateUser } from '@/hooks/useUserManagement'
import { useUnits } from '@/hooks/useUnits'
import { useTechnicianUnits } from '@/hooks/useTechnicianUnits'
import { Tables } from '@/integrations/supabase/types'
import { Loader2 } from 'lucide-react'

type Profile = Tables<'profiles'>

interface EditUserDialogProps {
  user: Profile | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditUserDialog({ user, open, onOpenChange }: EditUserDialogProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'user' as 'admin' | 'technician' | 'user',
    unit_id: 'none',
    unit_ids: [] as string[],
    status: 'ativo'
  })

  const updateUser = useUpdateUser()
  const { data: units } = useUnits()
  const { data: technicianUnits } = useTechnicianUnits(user?.id)

  useEffect(() => {
    if (user) {
      // Buscar unidades do técnico se for técnico
      const currentUnitIds = technicianUnits?.map(tu => tu.unit_id) || []
      
      setFormData({
        name: user.name,
        email: user.email,
        phone: user.phone || '',
        role: user.role,
        unit_id: user.unit_id || 'none',
        unit_ids: user.role === 'technician' ? currentUnitIds : [],
        status: user.status
      })
    }
  }, [user, technicianUnits])

  const handleUnitToggle = (unitId: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      unit_ids: checked 
        ? [...prev.unit_ids, unitId]
        : prev.unit_ids.filter(id => id !== unitId)
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    // Validação para técnicos
    if (formData.role === 'technician' && formData.unit_ids.length === 0) {
      return
    }

    const updateData = {
      id: user.id,
      name: formData.name,
      email: formData.email,
      phone: formData.phone || null,
      role: formData.role,
      status: formData.status,
      // Para técnicos, usar unit_ids; para outros, usar unit_id
      ...(formData.role === 'technician' 
        ? { unit_ids: formData.unit_ids }
        : { unit_id: formData.unit_id === 'none' ? null : formData.unit_id }
      )
    }

    updateUser.mutate(updateData, {
      onSuccess: () => {
        onOpenChange(false)
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Usuário</DialogTitle>
          <DialogDescription>
            Altere os dados do usuário conforme necessário.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-name">Nome</Label>
            <Input
              id="edit-name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="edit-email">Email</Label>
            <Input
              id="edit-email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="edit-phone">Telefone</Label>
            <Input
              id="edit-phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              placeholder="Ex: 85999999999"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="edit-role">Função</Label>
            <Select 
              value={formData.role} 
              onValueChange={(value: 'admin' | 'technician' | 'user') => 
                setFormData(prev => ({ 
                  ...prev, 
                  role: value,
                  // Limpar unidades ao mudar role
                  unit_ids: value === 'technician' ? prev.unit_ids : [],
                  unit_id: value !== 'technician' ? prev.unit_id : 'none'
                }))
              }
            >
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
              <Label>Unidades do Técnico</Label>
              <div className="grid grid-cols-1 gap-2 max-h-32 overflow-y-auto border rounded p-2">
                {units?.map((unit) => (
                  <div key={unit.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`unit-${unit.id}`}
                      checked={formData.unit_ids.includes(unit.id)}
                      onCheckedChange={(checked) => handleUnitToggle(unit.id, checked as boolean)}
                    />
                    <Label htmlFor={`unit-${unit.id}`} className="text-sm">
                      {unit.name}
                    </Label>
                  </div>
                ))}
              </div>
              {formData.unit_ids.length === 0 && (
                <p className="text-sm text-destructive">
                  Técnicos devem ter pelo menos uma unidade atribuída
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="edit-unit">Unidade</Label>
              <Select 
                value={formData.unit_id} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, unit_id: value }))}
              >
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
          
          <div className="space-y-2">
            <Label htmlFor="edit-status">Status</Label>
            <Select 
              value={formData.status} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ativo">Ativo</SelectItem>
                <SelectItem value="inativo">Inativo</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={updateUser.isPending || (formData.role === 'technician' && formData.unit_ids.length === 0)} 
              className="flex-1"
            >
              {updateUser.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Salvar Alterações'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
