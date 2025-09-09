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
      className={`group cursor-grab active:cursor-grabbing transition-all duration-300 hover:shadow-lg hover:shadow-black/10 hover:-translate-y-1 bg-white/80 backdrop-blur-sm border-0 rounded-xl overflow-hidden ${
        isDragging ? 'opacity-50 scale-95 rotate-3' : ''
      } ${isOverdue ? 'ring-2 ring-red-200 shadow-red-100' : ''} ${onClick ? 'hover:cursor-pointer hover:bg-white/90' : ''}`}
    >
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2 flex-1">
              {getTaskTypeIcon(task)}
              <h4 className="font-semibold text-sm line-clamp-2 text-slate-800 group-hover:text-slate-900 transition-colors">
                {task.title}
              </h4>
            </div>
            {isOverdue && (
              <div className="flex-shrink-0 ml-2">
                <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
              </div>
            )}
          </div>
          
          {/* Mostrar informações específicas do tipo de tarefa */}
          {task.task_type === 'equipment' && task.equipment && (
            <div className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100 shadow-sm transition-all duration-200 group-hover:shadow-md">
              <p className="text-xs font-semibold text-blue-900 mb-1">Equipamento</p>
              <p className="text-xs text-blue-800 font-medium">{task.equipment.name}</p>
              <p className="text-xs text-blue-600">
                {task.equipment.type} • {task.equipment.tombamento}
              </p>
            </div>
          )}
          
          {task.task_type === 'ticket' && task.ticket && (
            <div className="p-3 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg border border-emerald-100 shadow-sm transition-all duration-200 group-hover:shadow-md">
              <p className="text-xs font-semibold text-emerald-900 mb-1">Chamado</p>
              <p className="text-xs text-emerald-800 font-medium">#{task.ticket.ticket_number}</p>
              <p className="text-xs text-emerald-600">{task.ticket.status}</p>
            </div>
          )}
          
          {task.description && (
            <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
              {task.description}
            </p>
          )}

          <div className="flex flex-wrap gap-1.5">
            <Badge 
              variant="secondary" 
              className={`text-xs font-medium rounded-full px-2.5 py-1 shadow-sm border-0 ${PRIORITY_COLORS[task.priority]}`}
            >
              {PRIORITY_LABELS[task.priority]}
            </Badge>
            {task.labels.map((label) => (
              <Badge 
                key={label} 
                variant="outline" 
                className="text-xs bg-white/60 border-slate-200 text-slate-700 rounded-full px-2.5 py-1 shadow-sm"
              >
                {label}
              </Badge>
            ))}
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500">
            {task.due_date && (
              <div className={`flex items-center space-x-1 px-2 py-1 rounded-full ${
                isOverdue 
                  ? 'bg-red-50 text-red-600 border border-red-100' 
                  : 'bg-slate-50 text-slate-600 border border-slate-100'
              }`}>
                <Calendar className="h-3 w-3" />
                <span className="font-medium">
                  {new Date(task.due_date).toLocaleDateString('pt-BR')}
                </span>
              </div>
            )}
            
            {task.profiles && (
              <div className="flex items-center">
                <Avatar className="h-6 w-6 ring-2 ring-white shadow-sm">
                  <AvatarImage src={task.profiles.avatar_url} />
                  <AvatarFallback className="text-xs font-medium bg-gradient-to-br from-slate-100 to-slate-200 text-slate-700">
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