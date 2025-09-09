import { Plus, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { KanbanTaskCard } from '@/components/KanbanTaskCard'
import { KanbanTask } from '@/hooks/useKanbanTasks'
import { useDroppable } from '@dnd-kit/core'

interface KanbanColumnProps {
  id: string
  title: string
  color: string
  tasks: KanbanTask[]
  onAddTask: () => void
  onEditColumn?: () => void
  onTaskClick?: (task: KanbanTask) => void
  isOwner?: boolean
}

export function KanbanColumn({ id, title, color, tasks, onAddTask, onEditColumn, onTaskClick, isOwner }: KanbanColumnProps) {
  const { setNodeRef } = useDroppable({ id })

  return (
    <div className="w-72 bg-[#ebecf0] rounded-lg">
      <div className="p-2">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-sm text-slate-800 flex items-center">
            {title}
            <span className="ml-2 bg-slate-500/20 px-2 py-0.5 rounded text-xs text-slate-600">
              {tasks.length}
            </span>
          </h3>
          <div className="flex items-center space-x-1">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onAddTask}
              className="h-6 w-6 p-0 hover:bg-slate-300 text-slate-600 hover:text-slate-800"
            >
              <Plus className="h-3 w-3" />
            </Button>
            {isOwner && onEditColumn && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onEditColumn}
                className="h-6 w-6 p-0 hover:bg-slate-300 text-slate-600 hover:text-slate-800"
              >
                <Settings className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
      </div>
      <div ref={setNodeRef} className="space-y-2 min-h-[100px] p-2 pt-0">
        {tasks.map((task) => (
          <KanbanTaskCard 
            key={task.id}
            task={task} 
            onClick={() => onTaskClick?.(task)}
          />
        ))}
        {tasks.length === 0 && (
          <div className="text-center text-slate-500 py-4">
            <Plus className="h-4 w-4 mx-auto mb-2 text-slate-400" />
            <p className="text-xs">Adicionar tarefa</p>
          </div>
        )}
      </div>
    </div>
  )
}