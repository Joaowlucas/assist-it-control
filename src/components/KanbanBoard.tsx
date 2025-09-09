import { useState } from 'react'
import { ArrowLeft, Plus, Settings, Users, Columns } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { KanbanColumn } from '@/components/KanbanColumn'
import { CreateTaskDialog } from '@/components/CreateTaskDialog'
import { CreateColumnDialog } from '@/components/CreateColumnDialog'
import { EditColumnDialog } from '@/components/EditColumnDialog'
import { ManageParticipantsDialog } from '@/components/ManageParticipantsDialog'
import { TaskDetailsDialog } from '@/components/TaskDetailsDialog'
import { useKanbanTasks, useUpdateTask } from '@/hooks/useKanbanTasks'
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
  const updateTaskMutation = useUpdateTask()
  const [showCreateTask, setShowCreateTask] = useState(false)
  const [showCreateColumn, setShowCreateColumn] = useState(false)
  const [showEditColumn, setShowEditColumn] = useState(false)
  const [showParticipants, setShowParticipants] = useState(false)
  const [showTaskDetails, setShowTaskDetails] = useState(false)
  const [selectedColumn, setSelectedColumn] = useState<string>('')
  const [editingColumn, setEditingColumn] = useState<any>(null)
  const [selectedTask, setSelectedTask] = useState<any>(null)

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
    const newStatus = over.id as string
    
    // Encontrar a tarefa que está sendo movida
    const task = tasks?.find(t => t.id === taskId)
    if (!task || task.status === newStatus) return

    // Usar o hook de update para mover a tarefa
    updateTaskMutation.mutate({
      id: taskId,
      board_id: boardId,
      status: newStatus
    })
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
    <div className="min-h-screen bg-[#0079bf]">
      <div className="container mx-auto p-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              onClick={onBack}
              className="text-white hover:bg-white/20 transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-white">
                {board.name}
              </h1>
              {board.description && (
                <p className="text-blue-100 text-sm mt-1">{board.description}</p>
              )}
            </div>
            <Badge 
              variant={board.is_unit_wide ? 'default' : 'secondary'}
              className={`px-3 py-1 text-xs ${
                board.is_unit_wide 
                  ? 'bg-white/20 text-white border-white/30' 
                  : 'bg-white/10 text-blue-100 border-white/20'
              }`}
            >
              {board.is_unit_wide ? 'Toda a unidade' : 'Privado'}
            </Badge>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setShowParticipants(true)}
              className="text-white hover:bg-white/20 transition-colors"
            >
              <Users className="h-4 w-4 mr-2" />
              Participantes
            </Button>
            {columns && columns.length > 0 && (
              <Button 
                size="sm"
                onClick={() => {
                  setSelectedColumn(columns[0].name)
                  setShowCreateTask(true)
                }}
                className="bg-white/20 text-white hover:bg-white/30 transition-colors"
              >
                <Plus className="h-4 w-4 mr-2" />
                Nova Tarefa
              </Button>
            )}
            {isOwner && (
              <Button 
                variant="ghost"
                size="sm"
                onClick={() => setShowCreateColumn(true)}
                className="text-white hover:bg-white/20 transition-colors"
              >
                <Columns className="h-4 w-4 mr-2" />
                Nova Coluna
              </Button>
            )}
            {isOwner && (
              <Button 
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/20 transition-colors"
              >
                <Settings className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        <DndContext onDragEnd={handleDragEnd}>
          {columns && columns.length > 0 ? (
            <div className="flex gap-3 overflow-x-auto pb-4">
              {columns.map((column) => (
                <div key={column.id} className="flex-shrink-0">
                  <KanbanColumn
                    id={column.name}
                    title={column.name}
                    color={column.color}
                    tasks={tasksByColumn[column.name] || []}
                    onAddTask={() => {
                      setSelectedColumn(column.name)
                      setShowCreateTask(true)
                    }}
                    onEditColumn={() => {
                      setEditingColumn(column)
                      setShowEditColumn(true)
                    }}
                    onTaskClick={(task) => {
                      setSelectedTask(task)
                      setShowTaskDetails(true)
                    }}
                    isOwner={isOwner}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="max-w-md mx-auto bg-white rounded-lg p-8 shadow-sm">
                <div className="w-16 h-16 bg-slate-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Columns className="h-8 w-8 text-slate-600" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-3">Nenhuma coluna criada</h3>
                <p className="text-slate-600 mb-6">
                  Crie sua primeira coluna para começar a organizar suas tarefas.
                </p>
                {isOwner && (
                  <Button 
                    onClick={() => setShowCreateColumn(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
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

      <EditColumnDialog
        open={showEditColumn}
        onOpenChange={setShowEditColumn}
        column={editingColumn}
      />

      <ManageParticipantsDialog
        open={showParticipants}
        onOpenChange={setShowParticipants}
        boardId={boardId}
        isOwner={isOwner}
      />
      <TaskDetailsDialog
        open={showTaskDetails}
        onOpenChange={setShowTaskDetails}
        task={selectedTask}
        columns={columns}
      />
      </div>
    </div>
  )
}