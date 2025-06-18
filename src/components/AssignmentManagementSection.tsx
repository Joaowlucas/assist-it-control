
import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Edit, Trash2, FileText, Filter } from "lucide-react"
import { useAssignments } from "@/hooks/useAssignments"
import { useDeleteAssignment } from "@/hooks/useDeleteAssignment"
import { useSystemSettings } from "@/hooks/useSystemSettings"
import { ConfirmDeleteDialog } from "@/components/ConfirmDeleteDialog"
import { ConfirmEndAssignmentDialog } from "@/components/ConfirmEndAssignmentDialog"
import { AssignmentPDFPreviewDialog } from "@/components/AssignmentPDFPreviewDialog"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

export function AssignmentManagementSection() {
  const { data: assignments = [], isLoading } = useAssignments()
  const { data: systemSettings } = useSystemSettings()
  const deleteAssignmentMutation = useDeleteAssignment()
  
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [endDialogOpen, setEndDialogOpen] = useState(false)
  const [pdfDialogOpen, setPdfDialogOpen] = useState(false)
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null)

  const filteredAssignments = assignments.filter(assignment => {
    const matchesSearch = 
      assignment.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assignment.equipment?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assignment.equipment?.tombamento?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === "all" || assignment.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  const handleDelete = async (assignmentId: string) => {
    try {
      await deleteAssignmentMutation.mutateAsync(assignmentId)
      setDeleteDialogOpen(false)
      setSelectedAssignment(null)
    } catch (error) {
      console.error('Erro ao deletar atribuição:', error)
    }
  }

  const handleEdit = (assignment: any) => {
    // Implementar lógica de edição aqui
    console.log('Editando atribuição:', assignment)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ativo':
        return <Badge className="bg-green-500">Ativo</Badge>
      case 'finalizado':
        return <Badge variant="secondary">Finalizado</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>
            Filtre as atribuições por usuário, equipamento ou status.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Buscar por usuário, equipamento ou tombamento..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select
              className="px-3 py-2 border rounded-md"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">Todos os Status</option>
              <option value="ativo">Ativo</option>
              <option value="finalizado">Finalizado</option>
            </select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Atribuições ({filteredAssignments.length})</CardTitle>
          <CardDescription>
            Gerencie todas as atribuições de equipamentos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredAssignments.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Nenhuma atribuição encontrada.</p>
              </div>
            ) : (
              filteredAssignments.map((assignment) => (
                <div key={assignment.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-2">
                        <h3 className="font-semibold">{assignment.equipment?.name}</h3>
                        {assignment.equipment?.tombamento && (
                          <Badge variant="outline">{assignment.equipment.tombamento}</Badge>
                        )}
                        {getStatusBadge(assignment.status)}
                      </div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <p><strong>Usuário:</strong> {assignment.user?.name}</p>
                        <p><strong>Data Início:</strong> {format(new Date(assignment.start_date), "dd/MM/yyyy", { locale: ptBR })}</p>
                        {assignment.end_date && (
                          <p><strong>Data Fim:</strong> {format(new Date(assignment.end_date), "dd/MM/yyyy", { locale: ptBR })}</p>
                        )}
                        {assignment.notes && (
                          <p><strong>Observações:</strong> {assignment.notes}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedAssignment(assignment)
                          setPdfDialogOpen(true)
                        }}
                      >
                        <FileText className="h-4 w-4" />
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(assignment)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      
                      {assignment.status === 'ativo' && (
                        <ConfirmEndAssignmentDialog
                          assignmentId={assignment.id}
                          equipmentName={assignment.equipment?.name || ''}
                          userName={assignment.user?.name || ''}
                          open={endDialogOpen && selectedAssignment?.id === assignment.id}
                          onOpenChange={(open) => {
                            setEndDialogOpen(open)
                            if (!open) setSelectedAssignment(null)
                          }}
                        >
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedAssignment(assignment)
                              setEndDialogOpen(true)
                            }}
                          >
                            Finalizar
                          </Button>
                        </ConfirmEndAssignmentDialog>
                      )}
                      
                      <ConfirmDeleteDialog
                        open={deleteDialogOpen && selectedAssignment?.id === assignment.id}
                        onOpenChange={(open) => {
                          setDeleteDialogOpen(open)
                          if (!open) setSelectedAssignment(null)
                        }}
                        onConfirm={() => handleDelete(assignment.id)}
                        title="Confirmar Exclusão"
                        description={`Tem certeza que deseja excluir a atribuição do equipamento "${assignment.equipment?.name}" para "${assignment.user?.name}"?`}
                        confirmText="Excluir"
                        cancelText="Cancelar"
                        isLoading={deleteAssignmentMutation.isPending}
                      >
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedAssignment(assignment)
                            setDeleteDialogOpen(true)
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </ConfirmDeleteDialog>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {selectedAssignment && (
        <AssignmentPDFPreviewDialog
          open={pdfDialogOpen}
          onOpenChange={(open) => {
            setPdfDialogOpen(open)
            if (!open) setSelectedAssignment(null)
          }}
          assignment={selectedAssignment}
          assignmentId={selectedAssignment.id}
          equipmentName={selectedAssignment.equipment?.name || ''}
          userName={selectedAssignment.user?.name || ''}
          systemSettings={systemSettings || null}
        />
      )}
    </div>
  )
}
