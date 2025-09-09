import { useState } from 'react'
import { ArrowLeft, Plus, Settings, Users, Columns } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { KanbanColumn } from '@/components/KanbanColumn'
import { CreateTaskDialog } from '@/components/CreateTaskDialog'
import { CreateColumnDialog } from '@/components/CreateColumnDialog'
import { ManageParticipantsDialog } from '@/components/ManageParticipantsDialog'
import { useKanbanTasks } from '@/hooks/useKanbanTasks'
import { useKanbanBoards } from '@/hooks/useKanbanBoards'
import { useKanbanColumns } from '@/hooks/useKanbanColumns'
import { useAuth } from '@/hooks/useAuth'
import { DndContext, DragEndEvent, DragOverEvent } from '@dnd-kit/core'

interface KanbanBoardProps {
  boardId: string
  onBack: () => void
}

export function KanbanBoard({ boardId, onBack }: KanbanBoardProps) {
  const { profile } = useAuth()
  const { data: boards } = useKanbanBoards()
  const { data: tasks, isLoading: tasksLoading } = useKanbanTasks(boardId)
  const { data: columns, isLoading: columnsLoading } = useKanbanColumns(boardId)
  const [showCreateTask, setShowCreateTask] = useState(false)
  const [showCreateColumn, setShowCreateColumn] = useState(false)
  const [showParticipants, setShowParticipants] = useState(false)
  const [selectedColumn, setSelectedColumn] = useState<string>('')

  const board = boards?.find(b => b.id === boardId)
  const isOwner = board?.created_by === profile?.id
  const isLoading = tasksLoading || columnsLoading

  // Group tasks by column name
  const tasksByColumn = columns?.reduce((acc, column) => {
    acc[column.name] = tasks?.filter(task => task.status === column.name) || []
    return acc
  }, {} as Record<string, typeof tasks>) || {}

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
          {columns && columns.length > 0 && (
            <Button 
              onClick={() => {
                setSelectedColumn(columns[0].name)
                setShowCreateTask(true)
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Nova Tarefa
            </Button>
          )}
          {isOwner && (
            <Button 
              variant="outline"
              onClick={() => setShowCreateColumn(true)}
            >
              <Columns className="h-4 w-4 mr-2" />
              Nova Coluna
            </Button>
          )}
          {isOwner && (
            <Button variant="outline">
              <Settings className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <DndContext onDragEnd={handleDragEnd}>
        {columns && columns.length > 0 ? (
          <div className="grid gap-6" style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(300px, 1fr))` }}>
            {columns.map((column) => (
              <KanbanColumn
                key={column.id}
                id={column.name}
                title={column.name}
                color={column.color}
                tasks={tasksByColumn[column.name] || []}
                onAddTask={() => {
                  setSelectedColumn(column.name)
                  setShowCreateTask(true)
                }}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="max-w-md mx-auto">
              <Columns className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhuma coluna criada</h3>
              <p className="text-muted-foreground mb-4">
                Crie sua primeira coluna para começar a organizar suas tarefas.
              </p>
              {isOwner && (
                <Button onClick={() => setShowCreateColumn(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Primeira Coluna
                </Button>
              )}
            </div>
          </div>
        )}
      </DndContext>

      <CreateTaskDialog
        open={showCreateTask}
        onOpenChange={setShowCreateTask}
        boardId={boardId}
        defaultStatus={selectedColumn}
        columns={columns || []}
      />

      <CreateColumnDialog
        open={showCreateColumn}
        onOpenChange={setShowCreateColumn}
        boardId={boardId}
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