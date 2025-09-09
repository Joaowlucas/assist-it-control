import { useState } from 'react'
import { Plus, Settings, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { KanbanBoard } from '@/components/KanbanBoard'
import { CreateBoardDialog } from '@/components/CreateBoardDialog'
import { useKanbanBoards } from '@/hooks/useKanbanBoards'
import { useAuth } from '@/hooks/useAuth'

export default function Kanban() {
  const { profile } = useAuth()
  const { data: boards, isLoading } = useKanbanBoards()
  const [selectedBoardId, setSelectedBoardId] = useState<string | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-64 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (selectedBoardId) {
    return <KanbanBoard boardId={selectedBoardId} onBack={() => setSelectedBoardId(null)} />
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Quadros Kanban</h1>
          <p className="text-muted-foreground mt-2">
            Gerencie suas tarefas e projetos com quadros Kanban
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Criar Quadro
        </Button>
      </div>

      {!boards || boards.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <div className="mx-auto w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-4">
              <Plus className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Nenhum quadro encontrado</h3>
            <p className="text-muted-foreground mb-4">
              Crie seu primeiro quadro Kanban para começar a organizar suas tarefas
            </p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Criar Primeiro Quadro
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {boards.map((board) => (
            <Card 
              key={board.id} 
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => setSelectedBoardId(board.id)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{board.name}</CardTitle>
                    {board.description && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {board.description}
                      </p>
                    )}
                  </div>
                  <div className="flex space-x-1 ml-2">
                    {board.created_by === profile?.id && (
                      <Button variant="ghost" size="sm">
                        <Settings className="h-4 w-4" />
                      </Button>
                    )}
                    <Button variant="ghost" size="sm">
                      <Users className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>
                    {board.is_unit_wide ? 'Toda a unidade' : 'Privado'}
                  </span>
                  <span>
                    {new Date(board.created_at).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <CreateBoardDialog 
        open={showCreateDialog} 
        onOpenChange={setShowCreateDialog} 
      />
    </div>
  )
}