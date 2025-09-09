import { useState } from 'react'
import { ArrowLeft, Plus, Settings, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { KanbanColumn } from '@/components/KanbanColumn'
import { CreateTaskDialog } from '@/components/CreateTaskDialog'
import { ManageParticipantsDialog } from '@/components/ManageParticipantsDialog'
import { useKanbanTasks } from '@/hooks/useKanbanTasks'
import { useKanbanBoards } from '@/hooks/useKanbanBoards'
import { useAuth } from '@/hooks/useAuth'
import { DndContext, DragEndEvent, DragOverEvent } from '@dnd-kit/core'

interface KanbanBoardProps {
  boardId: string
  onBack: () => void
}

const COLUMNS = [
  { id: 'todo', title: 'A Fazer', color: 'bg-slate-100' },
  { id: 'in_progress', title: 'Em Progresso', color: 'bg-blue-100' },
  { id: 'done', title: 'Concluído', color: 'bg-green-100' }
]

export function KanbanBoard({ boardId, onBack }: KanbanBoardProps) {
  const { profile } = useAuth()
  const { data: boards } = useKanbanBoards()
  const { data: tasks, isLoading } = useKanbanTasks(boardId)
  const [showCreateTask, setShowCreateTask] = useState(false)
  const [showParticipants, setShowParticipants] = useState(false)
  const [selectedColumn, setSelectedColumn] = useState<string>('todo')

  const board = boards?.find(b => b.id === boardId)
  const isOwner = board?.created_by === profile?.id

  const tasksByColumn = {
    todo: tasks?.filter(task => task.status === 'todo') || [],
    in_progress: tasks?.filter(task => task.status === 'in_progress') || [],
    done: tasks?.filter(task => task.status === 'done') || []
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    
    if (!over) return

    const taskId = active.id as string
    const newColumn = over.id as string
    
    // TODO: Implement task status update
    console.log('Move task', taskId, 'to', newColumn)
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-64 mb-6"></div>
          <div className="grid grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-96 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!board) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold">Quadro não encontrado</h2>
          <Button onClick={onBack} className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{board.name}</h1>
            {board.description && (
              <p className="text-muted-foreground">{board.description}</p>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant={board.is_unit_wide ? 'default' : 'secondary'}>
              {board.is_unit_wide ? 'Toda a unidade' : 'Privado'}
            </Badge>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            onClick={() => setShowParticipants(true)}
          >
            <Users className="h-4 w-4 mr-2" />
            Participantes
          </Button>
          <Button 
            onClick={() => {
              setSelectedColumn('todo')
              setShowCreateTask(true)
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Nova Tarefa
          </Button>
          {isOwner && (
            <Button variant="outline">
              <Settings className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <DndContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-3 gap-6">
          {COLUMNS.map((column) => (
            <KanbanColumn
              key={column.id}
              id={column.id}
              title={column.title}
              color={column.color}
              tasks={tasksByColumn[column.id as keyof typeof tasksByColumn]}
              onAddTask={() => {
                setSelectedColumn(column.id)
                setShowCreateTask(true)
              }}
            />
          ))}
        </div>
      </DndContext>

      <CreateTaskDialog
        open={showCreateTask}
        onOpenChange={setShowCreateTask}
        boardId={boardId}
        defaultStatus={selectedColumn as 'todo' | 'in_progress' | 'done'}
      />

      <ManageParticipantsDialog
        open={showParticipants}
        onOpenChange={setShowParticipants}
        boardId={boardId}
        isOwner={isOwner}
      />
    </div>
  )
}