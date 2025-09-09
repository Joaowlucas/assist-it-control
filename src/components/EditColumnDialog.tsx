import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useUpdateColumn, useDeleteColumn, KanbanColumn } from '@/hooks/useKanbanColumns'
import { Trash2 } from 'lucide-react'

interface EditColumnDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  column: KanbanColumn | null
}

const COLUMN_COLORS = [
  { value: 'bg-slate-100 border-slate-200', label: 'Cinza Claro', color: 'bg-slate-100' },
  { value: 'bg-slate-200 border-slate-300', label: 'Cinza', color: 'bg-slate-200' },
  { value: 'bg-blue-50 border-blue-200', label: 'Azul Muito Claro', color: 'bg-blue-50' },
  { value: 'bg-blue-100 border-blue-200', label: 'Azul Claro', color: 'bg-blue-100' },
  { value: 'bg-blue-200 border-blue-300', label: 'Azul', color: 'bg-blue-200' },
  { value: 'bg-green-50 border-green-200', label: 'Verde Muito Claro', color: 'bg-green-50' },
  { value: 'bg-green-100 border-green-200', label: 'Verde Claro', color: 'bg-green-100' },
  { value: 'bg-green-200 border-green-300', label: 'Verde', color: 'bg-green-200' },
  { value: 'bg-yellow-50 border-yellow-200', label: 'Amarelo Muito Claro', color: 'bg-yellow-50' },
  { value: 'bg-yellow-100 border-yellow-200', label: 'Amarelo Claro', color: 'bg-yellow-100' },
  { value: 'bg-yellow-200 border-yellow-300', label: 'Amarelo', color: 'bg-yellow-200' },
  { value: 'bg-red-50 border-red-200', label: 'Vermelho Muito Claro', color: 'bg-red-50' },
  { value: 'bg-red-100 border-red-200', label: 'Vermelho Claro', color: 'bg-red-100' },
  { value: 'bg-red-200 border-red-300', label: 'Vermelho', color: 'bg-red-200' },
  { value: 'bg-purple-50 border-purple-200', label: 'Roxo Muito Claro', color: 'bg-purple-50' },
  { value: 'bg-purple-100 border-purple-200', label: 'Roxo Claro', color: 'bg-purple-100' },
  { value: 'bg-purple-200 border-purple-300', label: 'Roxo', color: 'bg-purple-200' },
  { value: 'bg-pink-50 border-pink-200', label: 'Rosa Muito Claro', color: 'bg-pink-50' },
  { value: 'bg-pink-100 border-pink-200', label: 'Rosa Claro', color: 'bg-pink-100' },
  { value: 'bg-pink-200 border-pink-300', label: 'Rosa', color: 'bg-pink-200' },
  { value: 'bg-orange-50 border-orange-200', label: 'Laranja Muito Claro', color: 'bg-orange-50' },
  { value: 'bg-orange-100 border-orange-200', label: 'Laranja Claro', color: 'bg-orange-100' },
  { value: 'bg-orange-200 border-orange-300', label: 'Laranja', color: 'bg-orange-200' },
  { value: 'bg-indigo-50 border-indigo-200', label: 'Índigo Muito Claro', color: 'bg-indigo-50' },
  { value: 'bg-indigo-100 border-indigo-200', label: 'Índigo Claro', color: 'bg-indigo-100' },
  { value: 'bg-indigo-200 border-indigo-300', label: 'Índigo', color: 'bg-indigo-200' },
  { value: 'bg-teal-50 border-teal-200', label: 'Turquesa Muito Claro', color: 'bg-teal-50' },
  { value: 'bg-teal-100 border-teal-200', label: 'Turquesa Claro', color: 'bg-teal-100' },
  { value: 'bg-teal-200 border-teal-300', label: 'Turquesa', color: 'bg-teal-200' },
]

export function EditColumnDialog({ open, onOpenChange, column }: EditColumnDialogProps) {
  const [name, setName] = useState('')
  const [color, setColor] = useState('bg-slate-100 border-slate-200')
  const updateColumn = useUpdateColumn()
  const deleteColumn = useDeleteColumn()

  useEffect(() => {
    if (column) {
      setName(column.name)
      setColor(column.color)
    }
  }, [column])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !column) return

    await updateColumn.mutateAsync({
      id: column.id,
      board_id: column.board_id,
      name: name.trim(),
      color,
    })

    onOpenChange(false)
  }

  const handleDelete = async () => {
    if (!column) return
    
    if (confirm('Tem certeza que deseja excluir esta coluna? Todas as tarefas nela serão perdidas.')) {
      await deleteColumn.mutateAsync({
        id: column.id,
        board_id: column.board_id
      })
      onOpenChange(false)
    }
  }

  if (!column) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Editar Coluna</DialogTitle>
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

          <div className="space-y-3">
            <Label htmlFor="color">Cor da Coluna</Label>
            <div className="grid grid-cols-6 gap-2 max-h-48 overflow-y-auto">
              {COLUMN_COLORS.map((colorOption) => (
                <button
                  key={colorOption.value}
                  type="button"
                  onClick={() => setColor(colorOption.value)}
                  className={`
                    relative w-full h-12 rounded-lg border-2 transition-all
                    ${colorOption.color} 
                    ${color === colorOption.value 
                      ? 'border-primary ring-2 ring-primary/20 scale-105' 
                      : 'border-border hover:border-primary/50 hover:scale-102'
                    }
                  `}
                  title={colorOption.label}
                >
                  {color === colorOption.value && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-4 h-4 bg-primary rounded-full border-2 border-white"></div>
                    </div>
                  )}
                </button>
              ))}
            </div>
            <div className="text-sm text-muted-foreground">
              Cor selecionada: <span className="font-medium">{COLUMN_COLORS.find(c => c.value === color)?.label}</span>
            </div>
          </div>

          <div className="flex justify-between pt-4">
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteColumn.isPending}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {deleteColumn.isPending ? 'Excluindo...' : 'Excluir Coluna'}
            </Button>
            
            <div className="space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={!name.trim() || updateColumn.isPending}
              >
                {updateColumn.isPending ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}