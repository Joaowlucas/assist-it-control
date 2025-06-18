
import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { useAssignments } from "@/hooks/useAssignments"
import { useCreateAssignment } from "@/hooks/useCreateAssignment"
import { useDeleteAssignment } from "@/hooks/useDeleteAssignment"
import { useAvailableEquipment } from "@/hooks/useAvailableEquipment"
import { useAvailableUsers } from "@/hooks/useAvailableUsers"
import { useAssignmentPDF } from "@/hooks/useAssignmentPDF"
import { ConfirmEndAssignmentDialog } from "@/components/ConfirmEndAssignmentDialog"
import { AssignmentPDFPreviewDialog } from "@/components/AssignmentPDFPreviewDialog"
import { Loader2, Plus, Calendar, User, Settings, FileText, Trash2 } from "lucide-react"

export function AssignmentManagementSection() {
  const { toast } = useToast()
  const { data: assignments, isLoading } = useAssignments()
  const { data: availableEquipment } = useAvailableEquipment()
  const { data: availableUsers } = useAvailableUsers()
  const createAssignment = useCreateAssignment()
  const deleteAssignment = useDeleteAssignment()
  const { previewAssignmentPDF, isLoadingPreview } = useAssignmentPDF()

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isEndDialogOpen, setIsEndDialogOpen] = useState(false)
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false)
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null)
  const [previewData, setPreviewData] = useState<any>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const formData = new FormData(e.target as HTMLFormElement)
    
    createAssignment.mutate({
      user_id: formData.get('user_id') as string,
      equipment_id: formData.get('equipment_id') as string,
      notes: formData.get('notes') as string,
    })

    setIsDialogOpen(false)
  }

  const handleDelete = (assignmentId: string) => {
    if (confirm('Tem certeza que deseja remover esta atribuição?')) {
      deleteAssignment.mutate(assignmentId)
    }
  }

  const handlePreviewAssignment = async (assignment: any) => {
    try {
      setSelectedAssignment(assignment)
      const data = await previewAssignmentPDF(
        assignment.id,
        assignment.equipment?.name || 'Equipamento',
        assignment.user?.name || 'Usuário'
      )
      setPreviewData(data)
      setIsPreviewModalOpen(true)
    } catch (error) {
      console.error('Erro ao carregar preview:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Gerenciar Atribuições</CardTitle>
            <CardDescription>
              Gerencie as atribuições de equipamentos para usuários
            </CardDescription>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nova Atribuição
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Nova Atribuição</DialogTitle>
                <DialogDescription>
                  Atribuir um equipamento disponível para um usuário
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="user_id">Usuário</Label>
                  <Select name="user_id" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar usuário" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableUsers?.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name} - {user.unit?.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="equipment_id">Equipamento</Label>
                  <Select name="equipment_id" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar equipamento" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableEquipment?.map((equipment) => (
                        <SelectItem key={equipment.id} value={equipment.id}>
                          {equipment.name} - {equipment.type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="notes">Observações</Label>
                  <Input 
                    id="notes" 
                    name="notes" 
                    placeholder="Observações sobre a atribuição"
                  />
                </div>
                
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={createAssignment.isPending}>
                    {createAssignment.isPending ? "Criando..." : "Criar Atribuição"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {assignments && assignments.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Equipamento</TableHead>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Data de Início</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Observações</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assignments.map((assignment) => (
                  <TableRow key={assignment.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{assignment.equipment?.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {assignment.equipment?.type}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="font-medium">{assignment.user?.name}</div>
                          <div className="text-sm text-muted-foreground">{assignment.user?.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {new Date(assignment.start_date).toLocaleDateString('pt-BR')}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={assignment.status === 'ativo' ? 'default' : 'secondary'}>
                        {assignment.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {assignment.notes || 'Sem observações'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePreviewAssignment(assignment)}
                          disabled={isLoadingPreview}
                          title="Visualizar relatório da atribuição"
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                        {assignment.status === 'ativo' && (
                          <ConfirmEndAssignmentDialog
                            assignmentId={assignment.id}
                            equipmentName={assignment.equipment?.name || 'Equipamento'}
                            userName={assignment.user?.name || 'Usuário'}
                          >
                            <Button variant="outline" size="sm">
                              Finalizar
                            </Button>
                          </ConfirmEndAssignmentDialog>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(assignment.id)}
                          disabled={deleteAssignment.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Nenhuma atribuição encontrada.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Preview */}
      {selectedAssignment && previewData && (
        <AssignmentPDFPreviewDialog
          open={isPreviewModalOpen}
          onOpenChange={setIsPreviewModalOpen}
          assignment={previewData.assignment}
          systemSettings={previewData.systemSettings}
          assignmentId={selectedAssignment.id}
          equipmentName={selectedAssignment.equipment?.name || 'Equipamento'}
          userName={selectedAssignment.user?.name || 'Usuário'}
        />
      )}
    </div>
  )
}
