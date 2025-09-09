import { Calendar, User, AlertCircle, Wrench, Ticket } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { KanbanTask } from '@/hooks/useKanbanTasks'
import { useDraggable } from '@dnd-kit/core'

interface KanbanTaskCardProps {
  task: KanbanTask
  onClick?: () => void
}

const PRIORITY_COLORS = {
  low: 'bg-gray-100 text-gray-800',
  medium: 'bg-blue-100 text-blue-800',
  high: 'bg-orange-100 text-orange-800',
  urgent: 'bg-red-100 text-red-800'
}

const PRIORITY_LABELS = {
  low: 'Baixa',
  medium: 'Média',
  high: 'Alta',
  urgent: 'Urgente'
}

export function KanbanTaskCard({ task, onClick }: KanbanTaskCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id
  })

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined

  const handleClick = (e: React.MouseEvent) => {
    // Permitir clique apenas se não estiver arrastando
    if (!isDragging && onClick) {
      e.preventDefault()
      e.stopPropagation()
      onClick()
    }
  }

  const getTaskTypeIcon = (task: KanbanTask) => {
    switch (task.task_type) {
      case 'equipment':
        return <Wrench className="h-4 w-4 text-blue-600" />
      case 'ticket':
        return <Ticket className="h-4 w-4 text-green-600" />
      default:
        return null
    }
  }

  const isOverdue = task.due_date && new Date(task.due_date) < new Date()

  return (
    <Card 
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={handleClick}
      className={`cursor-grab hover:shadow-md transition-shadow ${
        isDragging ? 'opacity-50' : ''
      } ${isOverdue ? 'border-red-200' : ''} ${onClick ? 'hover:cursor-pointer' : ''}`}
    >
      <CardContent className="p-3">
        <div className="space-y-2">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2 flex-1">
              {getTaskTypeIcon(task)}
              <h4 className="font-medium text-sm line-clamp-2">{task.title}</h4>
            </div>
            {isOverdue && (
              <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0 ml-1" />
            )}
          </div>
          
          {/* Mostrar informações específicas do tipo de tarefa */}
          {task.task_type === 'equipment' && task.equipment && (
            <div className="p-2 bg-blue-50 rounded-md">
              <p className="text-xs font-medium text-blue-900">Equipamento</p>
              <p className="text-xs text-blue-700">{task.equipment.name}</p>
              <p className="text-xs text-blue-600">
                {task.equipment.type} • {task.equipment.tombamento}
              </p>
            </div>
          )}
          
          {task.task_type === 'ticket' && task.ticket && (
            <div className="p-2 bg-green-50 rounded-md">
              <p className="text-xs font-medium text-green-900">Chamado</p>
              <p className="text-xs text-green-700">#{task.ticket.ticket_number}</p>
              <p className="text-xs text-green-600">{task.ticket.status}</p>
            </div>
          )}
          
          {task.description && (
            <p className="text-xs text-muted-foreground line-clamp-2">
              {task.description}
            </p>
          )}

          <div className="flex flex-wrap gap-1">
            <Badge 
              variant="secondary" 
              className={`text-xs ${PRIORITY_COLORS[task.priority]}`}
            >
              {PRIORITY_LABELS[task.priority]}
            </Badge>
            {task.labels.map((label) => (
              <Badge key={label} variant="outline" className="text-xs">
                {label}
              </Badge>
            ))}
          </div>

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            {task.due_date && (
              <div className={`flex items-center ${isOverdue ? 'text-red-500' : ''}`}>
                <Calendar className="h-3 w-3 mr-1" />
                {new Date(task.due_date).toLocaleDateString('pt-BR')}
              </div>
            )}
            
            {task.profiles && (
              <div className="flex items-center">
                <Avatar className="h-5 w-5">
                  <AvatarImage src={task.profiles.avatar_url} />
                  <AvatarFallback className="text-xs">
                    {task.profiles.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}