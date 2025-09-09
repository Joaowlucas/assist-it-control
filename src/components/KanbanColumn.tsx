import { Plus } from 'lucide-react'
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
}

export function KanbanColumn({ id, title, color, tasks, onAddTask }: KanbanColumnProps) {
  const { setNodeRef } = useDroppable({ id })

  return (
    <Card className="h-fit">
      <CardHeader className={`${color} pb-3`}>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center">
            {title}
            <span className="ml-2 bg-white/80 px-2 py-1 rounded-full text-xs">
              {tasks.length}
            </span>
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onAddTask}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent ref={setNodeRef} className="space-y-3 min-h-[200px] p-3">
        {tasks.map((task) => (
          <KanbanTaskCard key={task.id} task={task} />
        ))}
        {tasks.length === 0 && (
          <div className="text-center text-muted-foreground py-8">
            <p className="text-sm">Nenhuma tarefa</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}