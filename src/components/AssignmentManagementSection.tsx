
import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { useAssignments, useUpdateAssignment } from "@/hooks/useAssignments"
import { useCreateAssignment } from "@/hooks/useCreateAssignment"
import { useAvailableEquipment } from "@/hooks/useAvailableEquipment"
import { useAvailableUsers } from "@/hooks/useAvailableUsers"
import { useAssignmentPDF } from "@/hooks/useAssignmentPDF"
import { useAuth } from "@/hooks/useAuth"
import { Badge } from "@/components/ui/badge"
import { Plus, Edit, FileText, Printer } from "lucide-react"
import { ConfirmEndAssignmentDialog } from "@/components/ConfirmEndAssignmentDialog"
import { AssignmentPDFPreviewDialog } from "@/components/AssignmentPDFPreviewDialog"

export function AssignmentManagementSection() {
  const { data: assignments = [], isLoading } = useAssignments()
  const { data: availableEquipment = [] } = useAvailableEquipment()
  const { data: availableUsers = [] } = useAvailableUsers()
  const { user } = useAuth()
  const createAssignmentMutation = useCreateAssignment()
  const updateAssignmentMutation = useUpdateAssignment()
  const { previewAssignmentPDF, isLoadingPreview, generateAssignmentPDF, isGenerating } = useAssignmentPDF()
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState<string>("")
  const [selectedEquipmentId, setSelectedEquipmentId] = useState<string>("")
  const [notes, setNotes] = useState<string>("")
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().split('T')[0])
  const [expectedReturnDate, setExpectedReturnDate] = useState<string>("")
  const [editingAssignment, setEditingAssignment] = useState<any>(null)
  const [previewModalOpen, setPreviewModalOpen] = useState(false)
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null)
  const [previewData, setPreviewData] = useState<any>(null)

  const handleCreateAssignment = async () => {
    if (!selectedUserId || !selectedEquipmentId || !user?.id) {
      console.error('Missing required fields:', { selectedUserId, selectedEquipmentId, userId: user?.id })
      return
    }

    try {
      await createAssignmentMutation.mutateAsync({
        user_id: selectedUserId,
        equipment_id: selectedEquipmentId,
        assigned_by: user.id,
        start_date: startDate,
        notes: notes || undefined
      })
      
      setIsCreateDialogOpen(false)
      resetCreateForm()
    } catch (error) {
      console.error('Error creating assignment:', error)
    }
  }

  const handleEditAssignment = async () => {
    if (!editingAssignment || !user?.id) return

    try {
      const updates: any = {
        id: editingAssignment.id,
        notes: notes || undefined
      }

      if (startDate !== editingAssignment.start_date) {
        updates.start_date = startDate
      }

      await updateAssignmentMutation.mutateAsync(updates)
      
      setIsEditDialogOpen(false)
      resetEditForm()
    } catch (error) {
      console.error('Error updating assignment:', error)
    }
  }

  const handleEndAssignment = async (assignmentId: string) => {
    try {
      await updateAssignmentMutation.mutateAsync({
        id: assignmentId,
        status: 'finalizado',
        end_date: new Date().toISOString().split('T')[0]
      })
    } catch (error) {
      console.error('Error ending assignment:', error)
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
      setPreviewModalOpen(true)
    } catch (error) {
      console.error('Erro ao carregar preview:', error)
    }
  }

  const openEditDialog = (assignment: any) => {
    setEditingAssignment(assignment)
    setSelectedUserId(assignment.user_id)
    setSelectedEquipmentId(assignment.equipment_id)
    setStartDate(assignment.start_date)
    setNotes(assignment.notes || "")
    setIsEditDialogOpen(true)
  }

  const resetCreateForm = () => {
    setSelectedUserId("")
    setSelectedEquipmentId("")
    setNotes("")
    setStartDate(new Date().toISOString().split('T')[0])
    setExpectedReturnDate("")
  }

  const resetEditForm = () => {
    setEditingAssignment(null)
    setSelectedUserId("")
    setSelectedEquipmentId("")
    setNotes("")
    setStartDate(new Date().toISOString().split('T')[0])
    setExpectedReturnDate("")
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ativo": return "default"
      case "finalizado": return "secondary"
      default: return "default"
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "ativo": return "Ativo"
      case "finalizado": return "Finalizado"
      default: return status
    }
  }

  const isOverdue = (assignment: any) => {
    if (assignment.status !== 'ativo' || !assignment.expected_return_date) return false
    return new Date(assignment.expected_return_date) < new Date()
  }

  const handlePrintAssignment = async (assignment: any) => {
    await generateAssignmentPDF(
      assignment.id,
      assignment.equipment?.name || 'Equipamento',
      assignment.user?.name || 'Usuário'
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <>
      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div>
              <CardTitle className="text-card-foreground">Gestão de Atribuições</CardTitle>
              <CardDescription className="text-muted-foreground">
                Gerencie as atribuições de equipamentos aos usuários
              </CardDescription>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground min-h-[44px]">
                  <Plus className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Nova Atribuição</span>
                  <span className="sm:hidden">Nova</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md mx-4 max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Criar Nova Atribuição</DialogTitle>
                  <DialogDescription>
                    Atribua um equipamento disponível a um usuário
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div>
                    <Label>Usuário</Label>
                    <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um usuário" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableUsers.map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.name} - {user.email}
                            {user.unit?.name && ` (${user.unit.name})`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label>Equipamento</Label>
                    <Select value={selectedEquipmentId} onValueChange={setSelectedEquipmentId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um equipamento" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableEquipment.length === 0 ? (
                          <SelectItem value="" disabled>
                            Nenhum equipamento disponível
                          </SelectItem>
                        ) : (
                          availableEquipment.map((equipment) => (
                            <SelectItem key={equipment.id} value={equipment.id}>
                              {equipment.name} - {equipment.type}
                              {equipment.brand && equipment.model && ` (${equipment.brand} ${equipment.model})`}
                              {equipment.serial_number && ` - SN: ${equipment.serial_number}`}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    {availableEquipment.length === 0 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Todos os equipamentos estão em uso ou indisponíveis
                      </p>
                    )}
                  </div>

                  <div>
                    <Label>Data de Início</Label>
                    <Input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>

                  <div>
                    <Label>Data Prevista de Devolução (opcional)</Label>
                    <Input
                      type="date"
                      value={expectedReturnDate}
                      onChange={(e) => setExpectedReturnDate(e.target.value)}
                      min={startDate}
                    />
                  </div>
                  
                  <div>
                    <Label>Observações</Label>
                    <Textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Observações sobre a atribuição (opcional)"
                      rows={3}
                    />
                  </div>
                </div>

                <DialogFooter className="flex-col sm:flex-row gap-2">
                  <Button variant="outline" onClick={() => {
                    setIsCreateDialogOpen(false)
                    resetCreateForm()
                  }} className="w-full sm:w-auto">
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleCreateAssignment}
                    disabled={!selectedUserId || !selectedEquipmentId || createAssignmentMutation.isPending || !user?.id || availableEquipment.length === 0}
                    className="bg-primary hover:bg-primary/90 w-full sm:w-auto"
                  >
                    {createAssignmentMutation.isPending ? "Criando..." : "Criar Atribuição"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
              <DialogContent className="max-w-md mx-4 max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Editar Atribuição</DialogTitle>
                  <DialogDescription>
                    Modifique os detalhes da atribuição
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div>
                    <Label>Usuário</Label>
                    <Select value={selectedUserId} disabled>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {availableUsers.map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.name} - {user.email}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-1">O usuário não pode ser alterado após a criação</p>
                  </div>
                  
                  <div>
                    <Label>Equipamento</Label>
                    <Select value={selectedEquipmentId} disabled>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {availableEquipment.map((equipment) => (
                          <SelectItem key={equipment.id} value={equipment.id}>
                            {equipment.name} - {equipment.type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-1">O equipamento não pode ser alterado após a criação</p>
                  </div>

                  <div>
                    <Label>Data de Início</Label>
                    <Input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <Label>Observações</Label>
                    <Textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Observações sobre a atribuição"
                      rows={3}
                    />
                  </div>
                </div>

                <DialogFooter className="flex-col sm:flex-row gap-2">
                  <Button variant="outline" onClick={() => {
                    setIsEditDialogOpen(false)
                    resetEditForm()
                  }} className="w-full sm:w-auto">
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleEditAssignment}
                    disabled={updateAssignmentMutation.isPending}
                    className="bg-primary hover:bg-primary/90 w-full sm:w-auto"
                  >
                    Salvar Alterações
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {assignments.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Nenhuma atribuição encontrada.</p>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border">
                      <TableHead className="text-muted-foreground">Usuário</TableHead>
                      <TableHead className="text-muted-foreground">Equipamento</TableHead>
                      <TableHead className="text-muted-foreground">Início</TableHead>
                      <TableHead className="text-muted-foreground">Fim</TableHead>
                      <TableHead className="text-muted-foreground">Status</TableHead>
                      <TableHead className="text-muted-foreground">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assignments.map((assignment) => (
                      <TableRow key={assignment.id} className="border-border">
                        <TableCell>
                          <div>
                            <div className="font-medium text-card-foreground">
                              {assignment.user?.name}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {assignment.user?.email}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium text-card-foreground">
                              {assignment.equipment?.name}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {assignment.equipment?.type}
                              {assignment.equipment?.brand && assignment.equipment?.model && 
                                ` - ${assignment.equipment.brand} ${assignment.equipment.model}`
                              }
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-card-foreground">
                          {new Date(assignment.start_date).toLocaleDateString('pt-BR')}
                        </TableCell>
                        <TableCell className="text-card-foreground">
                          {assignment.end_date ? new Date(assignment.end_date).toLocaleDateString('pt-BR') : '-'}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Badge variant={getStatusColor(assignment.status) as any}>
                              {getStatusLabel(assignment.status)}
                            </Badge>
                            {isOverdue(assignment) && (
                              <Badge variant="destructive" className="text-xs">
                                Vencido
                              </Badge>
                            )}
                          </div>
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
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openEditDialog(assignment)}
                                >
                                  <Edit className="h-4 w-4 mr-1" />
                                  Editar
                                </Button>
                                <ConfirmEndAssignmentDialog
                                  assignmentId={assignment.id}
                                  equipmentName={assignment.equipment?.name || 'Equipamento'}
                                  userName={assignment.user?.name || 'Usuário'}
                                >
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                                  >
                                    Finalizar
                                  </Button>
                                </ConfirmEndAssignmentDialog>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden space-y-4">
                {assignments.map((assignment) => (
                  <Card key={assignment.id} className="border-border">
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="font-medium text-card-foreground">
                              {assignment.user?.name}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {assignment.user?.email}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={getStatusColor(assignment.status) as any}>
                              {getStatusLabel(assignment.status)}
                            </Badge>
                            {isOverdue(assignment) && (
                              <Badge variant="destructive" className="text-xs">
                                Vencido
                              </Badge>
                            )}
                          </div>
                        </div>

                        <div>
                          <div className="font-medium text-card-foreground">
                            {assignment.equipment?.name}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {assignment.equipment?.type}
                            {assignment.equipment?.brand && assignment.equipment?.model && 
                              ` - ${assignment.equipment.brand} ${assignment.equipment.model}`
                            }
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Início:</span>
                            <div className="text-card-foreground">
                              {new Date(assignment.start_date).toLocaleDateString('pt-BR')}
                            </div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Fim:</span>
                            <div className="text-card-foreground">
                              {assignment.end_date ? new Date(assignment.end_date).toLocaleDateString('pt-BR') : '-'}
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2 pt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePreviewAssignment(assignment)}
                            disabled={isLoadingPreview}
                            className="min-h-[44px] flex-1"
                          >
                            <FileText className="h-4 w-4 mr-2" />
                            Relatório
                          </Button>
                          {assignment.status === 'ativo' && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openEditDialog(assignment)}
                                className="min-h-[44px] flex-1"
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                Editar
                              </Button>
                              <ConfirmEndAssignmentDialog
                                assignmentId={assignment.id}
                                equipmentName={assignment.equipment?.name || 'Equipamento'}
                                userName={assignment.user?.name || 'Usuário'}
                              >
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950 min-h-[44px] w-full"
                                >
                                  Finalizar
                                </Button>
                              </ConfirmEndAssignmentDialog>
                            </>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Modal de Preview */}
      {selectedAssignment && previewData && (
        <AssignmentPDFPreviewDialog
          open={previewModalOpen}
          onOpenChange={setPreviewModalOpen}
          assignment={previewData.assignment}
          systemSettings={previewData.systemSettings}
          assignmentId={selectedAssignment.id}
          equipmentName={selectedAssignment.equipment?.name || 'Equipamento'}
          userName={selectedAssignment.user?.name || 'Usuário'}
        />
      )}
    </>
  )
}
