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
  low: 'bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-800 border border-emerald-200',
  medium: 'bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 border border-blue-200',
  high: 'bg-gradient-to-r from-amber-100 to-orange-100 text-amber-800 border border-amber-200',
  urgent: 'bg-gradient-to-r from-red-100 to-pink-100 text-red-800 border border-red-200'
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
        return <Wrench className="h-4 w-4 text-blue-600 drop-shadow-sm" />
      case 'ticket':
        return <Ticket className="h-4 w-4 text-emerald-600 drop-shadow-sm" />
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
      className={`group cursor-grab active:cursor-grabbing transition-all duration-200 hover:shadow-md bg-white border border-slate-200 rounded-lg overflow-hidden ${
        isDragging ? 'opacity-50' : ''
      } ${isOverdue ? 'border-l-4 border-l-red-400' : ''} ${onClick ? 'hover:cursor-pointer' : ''}`}
    >
      <CardContent className="p-3">
        <div className="space-y-2">
          {task.labels.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {task.labels.map((label) => (
                <div 
                  key={label} 
                  className="bg-green-200 text-green-800 text-xs px-2 py-0.5 rounded font-medium"
                >
                  {label}
                </div>
              ))}
            </div>
          )}

          <div className="flex items-start justify-between">
            <h4 className="font-medium text-sm text-slate-800 leading-tight">
              {task.title}
            </h4>
            {getTaskTypeIcon(task)}
          </div>
          
          {task.description && (
            <p className="text-xs text-slate-600 line-clamp-2">
              {task.description}
            </p>
          )}

          {/* Mostrar informações específicas do tipo de tarefa */}
          {task.task_type === 'equipment' && task.equipment && (
            <div className="p-2 bg-blue-50 rounded border border-blue-100">
              <p className="text-xs font-medium text-blue-900">Equipamento: {task.equipment.name}</p>
              <p className="text-xs text-blue-700">{task.equipment.type}</p>
            </div>
          )}
          
          {task.task_type === 'ticket' && task.ticket && (
            <div className="p-2 bg-emerald-50 rounded border border-emerald-100">
              <p className="text-xs font-medium text-emerald-900">Chamado #{task.ticket.ticket_number}</p>
              <p className="text-xs text-emerald-700">{task.ticket.status}</p>
            </div>
          )}

          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2">
              {task.priority !== 'low' && (
                <Badge 
                  variant="secondary" 
                  className={`text-xs px-1.5 py-0.5 ${PRIORITY_COLORS[task.priority]}`}
                >
                  {PRIORITY_LABELS[task.priority]}
                </Badge>
              )}
              {task.due_date && (
                <div className={`flex items-center text-xs ${
                  isOverdue ? 'text-red-600' : 'text-slate-500'
                }`}>
                  <Calendar className="h-3 w-3 mr-1" />
                  <span>{new Date(task.due_date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}</span>
                </div>
              )}
            </div>
            
            {task.profiles && (
              <Avatar className="h-6 w-6">
                <AvatarImage src={task.profiles.avatar_url} />
                <AvatarFallback className="text-xs bg-slate-100 text-slate-700">
                  {task.profiles.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}