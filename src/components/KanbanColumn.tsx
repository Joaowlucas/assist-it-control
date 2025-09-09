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
    <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg shadow-black/5 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-black/10 hover:scale-[1.02] animate-scale-in">
      <CardHeader className={`pb-4 relative overflow-hidden ${color}`}>
        <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"></div>
        <div className="flex items-center justify-between relative z-10">
          <CardTitle className="text-sm font-semibold flex items-center text-slate-800">
            {title}
            <span className="ml-3 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs font-medium shadow-sm border border-white/20">
              {tasks.length}
            </span>
          </CardTitle>
          <div className="flex items-center space-x-1">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onAddTask}
              className="group h-8 w-8 p-0 hover:bg-white/30 transition-all duration-200 hover:scale-110"
            >
              <Plus className="h-4 w-4 transition-transform group-hover:rotate-90" />
            </Button>
            {isOwner && onEditColumn && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onEditColumn}
                className="group h-8 w-8 p-0 hover:bg-white/30 transition-all duration-200 hover:scale-110"
              >
                <Settings className="h-4 w-4 transition-transform group-hover:rotate-12" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent ref={setNodeRef} className="space-y-3 min-h-[240px] p-4 bg-gradient-to-b from-transparent to-slate-50/30">
        {tasks.map((task, index) => (
          <div
            key={task.id}
            className="animate-fade-in"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <KanbanTaskCard 
              task={task} 
              onClick={() => onTaskClick?.(task)}
            />
          </div>
        ))}
        {tasks.length === 0 && (
          <div className="text-center text-slate-500 py-12 animate-fade-in">
            <div className="w-12 h-12 bg-gradient-to-br from-slate-100 to-slate-200 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-inner">
              <Plus className="h-6 w-6 text-slate-400" />
            </div>
            <p className="text-sm font-medium">Nenhuma tarefa</p>
            <p className="text-xs text-slate-400 mt-1">Adicione a primeira tarefa</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}