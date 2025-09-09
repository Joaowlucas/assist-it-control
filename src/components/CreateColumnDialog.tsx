import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useCreateColumn } from '@/hooks/useKanbanColumns'

interface CreateColumnDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  boardId: string
}

const COLUMN_COLORS = [
  { value: 'bg-slate-100', label: 'Cinza', color: 'bg-slate-100' },
  { value: 'bg-blue-100', label: 'Azul', color: 'bg-blue-100' },
  { value: 'bg-green-100', label: 'Verde', color: 'bg-green-100' },
  { value: 'bg-yellow-100', label: 'Amarelo', color: 'bg-yellow-100' },
  { value: 'bg-red-100', label: 'Vermelho', color: 'bg-red-100' },
  { value: 'bg-purple-100', label: 'Roxo', color: 'bg-purple-100' },
  { value: 'bg-pink-100', label: 'Rosa', color: 'bg-pink-100' },
  { value: 'bg-orange-100', label: 'Laranja', color: 'bg-orange-100' },
]

export function CreateColumnDialog({ open, onOpenChange, boardId }: CreateColumnDialogProps) {
  const [name, setName] = useState('')
  const [color, setColor] = useState('bg-slate-100')
  const createColumn = useCreateColumn()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    await createColumn.mutateAsync({
      board_id: boardId,
      name: name.trim(),
      color,
    })

    setName('')
    setColor('bg-slate-100')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nova Coluna</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome da Coluna</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: A Fazer, Em Andamento..."
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="color">Cor</Label>
            <Select value={color} onValueChange={setColor}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma cor" />
              </SelectTrigger>
              <SelectContent>
                {COLUMN_COLORS.map((colorOption) => (
                  <SelectItem key={colorOption.value} value={colorOption.value}>
                    <div className="flex items-center space-x-2">
                      <div className={`w-4 h-4 rounded ${colorOption.color} border border-border`} />
                      <span>{colorOption.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={!name.trim() || createColumn.isPending}
            >
              {createColumn.isPending ? 'Criando...' : 'Criar Coluna'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}