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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-6">
            <Button 
              variant="ghost" 
              onClick={onBack}
              className="group hover:bg-white/60 backdrop-blur-sm border border-white/20 shadow-sm transition-all duration-300 hover:shadow-md"
            >
              <ArrowLeft className="h-4 w-4 mr-2 transition-transform group-hover:-translate-x-1" />
              Voltar
            </Button>
            <div className="animate-fade-in">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                {board.name}
              </h1>
              {board.description && (
                <p className="text-slate-600 mt-1">{board.description}</p>
              )}
            </div>
            <div className="flex items-center space-x-3">
              <Badge 
                variant={board.is_unit_wide ? 'default' : 'secondary'}
                className={`px-3 py-1 rounded-full font-medium transition-all duration-200 ${
                  board.is_unit_wide 
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg shadow-blue-500/25' 
                    : 'bg-white/80 text-slate-700 border border-slate-200 shadow-sm'
                }`}
              >
                {board.is_unit_wide ? 'Toda a unidade' : 'Privado'}
              </Badge>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <Button 
              variant="outline" 
              onClick={() => setShowParticipants(true)}
              className="group hover:bg-white/60 backdrop-blur-sm border border-white/20 shadow-sm transition-all duration-300 hover:shadow-md hover:scale-105"
            >
              <Users className="h-4 w-4 mr-2 transition-transform group-hover:scale-110" />
              Participantes
            </Button>
            {columns && columns.length > 0 && (
              <Button 
                onClick={() => {
                  setSelectedColumn(columns[0].name)
                  setShowCreateTask(true)
                }}
                className="group bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/25 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/30 hover:scale-105"
              >
                <Plus className="h-4 w-4 mr-2 transition-transform group-hover:rotate-90" />
                Nova Tarefa
              </Button>
            )}
            {isOwner && (
              <Button 
                variant="outline"
                onClick={() => setShowCreateColumn(true)}
                className="group hover:bg-white/60 backdrop-blur-sm border border-white/20 shadow-sm transition-all duration-300 hover:shadow-md hover:scale-105"
              >
                <Columns className="h-4 w-4 mr-2 transition-transform group-hover:scale-110" />
                Nova Coluna
              </Button>
            )}
            {isOwner && (
              <Button 
                variant="outline"
                className="group hover:bg-white/60 backdrop-blur-sm border border-white/20 shadow-sm transition-all duration-300 hover:shadow-md hover:scale-105"
              >
                <Settings className="h-4 w-4 transition-transform group-hover:rotate-12" />
              </Button>
            )}
          </div>
        </div>

        <DndContext onDragEnd={handleDragEnd}>
          {columns && columns.length > 0 ? (
            <div 
              className="grid gap-6 pb-8 animate-fade-in" 
              style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(320px, 1fr))` }}
            >
              {columns.map((column, index) => (
                <div
                  key={column.id}
                  className="animate-fade-in"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
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
            <div className="text-center py-16 animate-fade-in">
              <div className="max-w-md mx-auto bg-white/60 backdrop-blur-sm rounded-2xl p-8 border border-white/20 shadow-lg">
                <div className="w-16 h-16 bg-gradient-to-br from-slate-200 to-slate-300 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner">
                  <Columns className="h-8 w-8 text-slate-600" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-3">Nenhuma coluna criada</h3>
                <p className="text-slate-600 mb-6 leading-relaxed">
                  Crie sua primeira coluna para começar a organizar suas tarefas com estilo.
                </p>
                {isOwner && (
                  <Button 
                    onClick={() => setShowCreateColumn(true)}
                    className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/25 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/30 hover:scale-105"
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