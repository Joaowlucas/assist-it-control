import { Calendar, User, AlertCircle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { KanbanTask } from '@/hooks/useKanbanTasks'
import { useDraggable } from '@dnd-kit/core'

interface KanbanTaskCardProps {
  task: KanbanTask
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

export function KanbanTaskCard({ task }: KanbanTaskCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id
  })

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined

  const isOverdue = task.due_date && new Date(task.due_date) < new Date()

  return (
    <Card 
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`cursor-grab hover:shadow-md transition-shadow ${
        isDragging ? 'opacity-50' : ''
      } ${isOverdue ? 'border-red-200' : ''}`}
    >
      <CardContent className="p-3">
        <div className="space-y-2">
          <div className="flex items-start justify-between">
            <h4 className="font-medium text-sm line-clamp-2">{task.title}</h4>
            {isOverdue && (
              <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0 ml-1" />
            )}
          </div>
          
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