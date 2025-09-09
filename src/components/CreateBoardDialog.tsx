import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useCreateBoard } from '@/hooks/useKanbanBoards'
import { useUnits } from '@/hooks/useUnits'
import { useAuth } from '@/hooks/useAuth'

interface CreateBoardDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateBoardDialog({ open, onOpenChange }: CreateBoardDialogProps) {
  const { profile } = useAuth()
  const { data: units } = useUnits()
  const createBoard = useCreateBoard()
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    unit_id: profile?.unit_id || '',
    is_unit_wide: false
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      await createBoard.mutateAsync({
        name: formData.name,
        description: formData.description || undefined,
        unit_id: formData.unit_id || undefined,
        is_unit_wide: formData.is_unit_wide
      })
      
      setFormData({
        name: '',
        description: '',
        unit_id: profile?.unit_id || '',
        is_unit_wide: false
      })
      
      onOpenChange(false)
    } catch (error) {
      console.error('Erro ao criar quadro:', error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Criar Novo Quadro</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome do Quadro *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Digite o nome do quadro"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Descreva o propósito do quadro"
              rows={3}
            />
          </div>

          {(profile?.role === 'admin' || profile?.role === 'technician') && (
            <div className="space-y-2">
              <Label htmlFor="unit">Unidade</Label>
              <Select 
                value={formData.unit_id} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, unit_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma unidade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Nenhuma unidade específica</SelectItem>
                  {units?.map((unit) => (
                    <SelectItem key={unit.id} value={unit.id}>
                      {unit.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex items-center space-x-2">
            <Switch
              id="unit-wide"
              checked={formData.is_unit_wide}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_unit_wide: checked }))}
            />
            <Label htmlFor="unit-wide">
              Visível para toda a unidade
            </Label>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={createBoard.isPending}
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={createBoard.isPending || !formData.name.trim()}
            >
              {createBoard.isPending ? 'Criando...' : 'Criar Quadro'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}