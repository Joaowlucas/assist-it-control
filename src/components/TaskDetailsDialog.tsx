import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Calendar, CalendarDays, User, Wrench, Ticket, Save, X } from 'lucide-react'
import { KanbanTask, useUpdateTask, useDeleteTask } from '@/hooks/useKanbanTasks'
import { useToast } from '@/hooks/use-toast'
import { useAvailableUsers } from '@/hooks/useAvailableUsers'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface TaskDetailsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  task: KanbanTask | null
  columns: Array<{ id: string; name: string; color: string }> | null
}

export function TaskDetailsDialog({ open, onOpenChange, task, columns }: TaskDetailsDialogProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState('')
  const [priority, setPriority] = useState('')
  const [assignedTo, setAssignedTo] = useState('')
  const [dueDate, setDueDate] = useState('')
  
  const { toast } = useToast()
  const updateTaskMutation = useUpdateTask()
  const deleteTaskMutation = useDeleteTask()
  const { data: users } = useAvailableUsers()

  // Inicializar form quando a tarefa mudar
  React.useEffect(() => {
    if (task) {
      setTitle(task.title)
      setDescription(task.description || '')
      setStatus(task.status)
      setPriority(task.priority)
      setAssignedTo(task.assigned_to || '')
      setDueDate(task.due_date || '')
    }
  }, [task])

  if (!task) return null

  const handleSave = () => {
    updateTaskMutation.mutate({
      id: task.id,
      board_id: task.board_id,
      title,
      description,
      status,
      priority: priority as 'low' | 'medium' | 'high' | 'urgent',
      assigned_to: assignedTo || undefined,
      due_date: dueDate || undefined
    }, {
      onSuccess: () => {
        setIsEditing(false)
        toast({
          title: 'Sucesso',
          description: 'Tarefa atualizada com sucesso',
        })
      }
    })
  }

  const handleDelete = () => {
    deleteTaskMutation.mutate({
      id: task.id,
      board_id: task.board_id
    }, {
      onSuccess: () => {
        onOpenChange(false)
        toast({
          title: 'Sucesso',
          description: 'Tarefa excluída com sucesso',
        })
      }
    })
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200'
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'Urgente'
      case 'high': return 'Alta'
      case 'medium': return 'Média'
      case 'low': return 'Baixa'
      default: return priority
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Detalhes da Tarefa</span>
            <div className="flex items-center space-x-2">
              {!isEditing ? (
                <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                  Editar
                </Button>
              ) : (
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>
                    <X className="h-4 w-4 mr-1" />
                    Cancelar
                  </Button>
                  <Button size="sm" onClick={handleSave} disabled={updateTaskMutation.isPending}>
                    <Save className="h-4 w-4 mr-1" />
                    Salvar
                  </Button>
                </div>
              )}
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Título */}
          <div>
            <Label htmlFor="title">Título</Label>
            {isEditing ? (
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1"
              />
            ) : (
              <h3 className="text-lg font-semibold mt-1">{task.title}</h3>
            )}
          </div>

          {/* Descrição */}
          <div>
            <Label htmlFor="description">Descrição</Label>
            {isEditing ? (
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="mt-1"
              />
            ) : (
              <p className="text-muted-foreground mt-1">
                {task.description || 'Nenhuma descrição fornecida'}
              </p>
            )}
          </div>

          {/* Metadados em duas colunas */}
          <div className="grid grid-cols-2 gap-4">
            {/* Status */}
            <div>
              <Label>Status</Label>
              {isEditing ? (
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {columns?.map((column) => (
                      <SelectItem key={column.id} value={column.name}>
                        {column.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Badge variant="outline" className="mt-1">
                  {task.status}
                </Badge>
              )}
            </div>

            {/* Prioridade */}
            <div>
              <Label>Prioridade</Label>
              {isEditing ? (
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Baixa</SelectItem>
                    <SelectItem value="medium">Média</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                    <SelectItem value="urgent">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <Badge className={`mt-1 ${getPriorityColor(task.priority)}`}>
                  {getPriorityLabel(task.priority)}
                </Badge>
              )}
            </div>
          </div>

          {/* Responsável */}
          <div>
            <Label>Responsável</Label>
            {isEditing ? (
              <Select value={assignedTo} onValueChange={setAssignedTo}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Selecionar responsável" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Nenhum</SelectItem>
                  {users?.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="flex items-center mt-1">
                <User className="h-4 w-4 mr-2 text-muted-foreground" />
                <span>{task.profiles?.name || 'Não atribuído'}</span>
              </div>
            )}
          </div>

          {/* Data de entrega */}
          <div>
            <Label>Data de Entrega</Label>
            {isEditing ? (
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="mt-1"
              />
            ) : (
              <div className="flex items-center mt-1">
                <CalendarDays className="h-4 w-4 mr-2 text-muted-foreground" />
                <span>
                  {task.due_date 
                    ? format(new Date(task.due_date), 'dd/MM/yyyy', { locale: ptBR })
                    : 'Não definida'
                  }
                </span>
              </div>
            )}
          </div>

          {/* Equipamento/Ticket relacionado */}
          {(task.equipment || task.ticket) && (
            <div>
              <Label>Item Relacionado</Label>
              <div className="mt-1">
                {task.equipment && (
                  <div className="flex items-center p-3 bg-blue-50 rounded-lg border">
                    <Wrench className="h-4 w-4 mr-2 text-blue-600" />
                    <div>
                      <p className="font-medium text-blue-900">{task.equipment.name}</p>
                      <p className="text-sm text-blue-700">
                        {task.equipment.type} • Tombamento: {task.equipment.tombamento}
                      </p>
                    </div>
                  </div>
                )}
                {task.ticket && (
                  <div className="flex items-center p-3 bg-purple-50 rounded-lg border">
                    <Ticket className="h-4 w-4 mr-2 text-purple-600" />
                    <div>
                      <p className="font-medium text-purple-900">#{task.ticket.ticket_number} - {task.ticket.title}</p>
                      <p className="text-sm text-purple-700">
                        Status: {task.ticket.status} • Prioridade: {task.ticket.priority}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Metadados de criação */}
          <div className="pt-4 border-t">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-1" />
                Criada em {format(new Date(task.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
              </div>
              {!isEditing && (
                <Button 
                  variant="destructive" 
                  size="sm" 
                  onClick={handleDelete}
                  disabled={deleteTaskMutation.isPending}
                >
                  Excluir Tarefa
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}