import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CalendarIcon, Plus, Edit, FileText, Trash } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { useAssignments, useCreateAssignment, useUpdateAssignment } from "@/hooks/useAssignments"
import { useDeleteAssignment } from "@/hooks/useDeleteAssignment"
import { useAvailableEquipment } from "@/hooks/useAvailableEquipment"
import { useAvailableUsers } from "@/hooks/useAvailableUsers"
import { useAuth } from "@/hooks/useAuth"
import { useAssignmentPDF } from "@/hooks/useAssignmentPDF"
import { AssignmentPDFPreviewDialog } from "@/components/AssignmentPDFPreviewDialog"
import { ConfirmDeleteDialog } from "@/components/ConfirmDeleteDialog"
import { ConfirmEndAssignmentDialog } from "@/components/ConfirmEndAssignmentDialog"
import { useIsMobile } from "@/hooks/use-mobile"

export function AssignmentManagementSection() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingAssignment, setEditingAssignment] = useState<any>(null)
  const [deletingAssignment, setDeletingAssignment] = useState<any>(null)
  const [endingAssignment, setEndingAssignment] = useState<any>(null)
  const [isPDFPreviewOpen, setIsPDFPreviewOpen] = useState(false)
  const [previewData, setPreviewData] = useState<any>(null)

  const { data: assignments = [], isLoading } = useAssignments()
  const { data: availableEquipment = [] } = useAvailableEquipment()
  const { data: availableUsers = [] } = useAvailableUsers()
  const { profile } = useAuth()
  const isMobile = useIsMobile()
  const createAssignment = useCreateAssignment()
  const updateAssignment = useUpdateAssignment()
  const deleteAssignment = useDeleteAssignment()
  const { previewAssignmentPDF, isLoadingPreview } = useAssignmentPDF()

  const canEdit = profile?.role === 'admin' || profile?.role === 'technician'
  const canDelete = profile?.role === 'admin'
  const activeAssignments = assignments.filter(a => a.status === 'ativo')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const formData = new FormData(e.target as HTMLFormElement)

    const assignmentData = {
      user_id: formData.get('userId') as string,
      equipment_id: formData.get('equipmentId') as string,
      start_date: formData.get('startDate') as string,
      notes: formData.get('notes') as string || null,
      assigned_by: profile?.id,
    }

    try {
      await createAssignment.mutateAsync(assignmentData)
      setIsDialogOpen(false)

      // Reset form
      const form = e.target as HTMLFormElement
      form.reset()
    } catch (error) {
      console.error('Error creating assignment:', error)
    }
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingAssignment) return

    const formData = new FormData(e.target as HTMLFormElement)

    const assignmentData = {
      id: editingAssignment.id,
      notes: formData.get('notes') as string || null,
    }

    try {
      await updateAssignment.mutateAsync(assignmentData)
      setIsEditDialogOpen(false)
      setEditingAssignment(null)
    } catch (error) {
      console.error('Error updating assignment:', error)
    }
  }

  const handleEdit = (assignment: any) => {
    setEditingAssignment(assignment)
    setIsEditDialogOpen(true)
  }

  const handleEndAssignment = (assignment: any) => {
    setEndingAssignment(assignment)
  }

  const handlePreviewPDF = async (assignment: any) => {
    try {
      const data = await previewAssignmentPDF(assignment.id)
      setPreviewData(data)
      setIsPDFPreviewOpen(true)
    } catch (error) {
      console.error('Erro ao carregar pré-visualização:', error)
    }
  }

  const handleDelete = (assignment: any) => {
    setDeletingAssignment(assignment)
  }

  const confirmDelete = async () => {
    if (!deletingAssignment) return
    
    try {
      await deleteAssignment.mutateAsync(deletingAssignment.id)
      setDeletingAssignment(null)
    } catch (error) {
      console.error('Error deleting assignment:', error)
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
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div className="space-y-1">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">Gerenciar Atribuições</h2>
          <p className="text-sm md:text-base text-muted-foreground">
            Visualize e gerencie as atribuições de equipamentos
          </p>
        </div>

        {(profile?.role === 'admin' || profile?.role === 'technician') && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto">
                <Plus className="h-4 w-4 mr-2" />
                {isMobile ? "Atribuir" : "Atribuir Equipamento"}
              </Button>
            </DialogTrigger>
            <DialogContent className={`${isMobile ? 'w-[95vw] max-w-[95vw] h-[90vh]' : 'sm:max-w-[700px]'} max-h-[90vh] overflow-y-auto`}>
              <DialogHeader>
                <DialogTitle>Atribuir Novo Equipamento</DialogTitle>
                <DialogDescription>
                  Atribua um equipamento a um usuário
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-4">
                  <div>
                    <Label htmlFor="userId">Usuário</Label>
                    <Select name="userId" required>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Selecione o usuário" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableUsers.map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.name} ({user.email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="equipmentId">Equipamento</Label>
                    <Select name="equipmentId" required>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Selecione o equipamento" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableEquipment.map((equipment) => (
                          <SelectItem key={equipment.id} value={equipment.id}>
                            {equipment.name} ({equipment.type})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="startDate">Data de Início</Label>
                    <Input
                      id="startDate"
                      name="startDate"
                      type="date"
                      required
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="notes">Observações</Label>
                    <Textarea
                      id="notes"
                      name="notes"
                      placeholder="Observações sobre a atribuição"
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className={`flex gap-2 ${isMobile ? 'flex-col' : 'justify-end'}`}>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className={isMobile ? 'w-full' : ''}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={createAssignment.isPending} className={isMobile ? 'w-full' : ''}>
                    {createAssignment.isPending ? 'Atribuindo...' : 'Atribuir Equipamento'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-card-foreground">Atribuições Ativas</CardTitle>
          <CardDescription>
            Equipamentos atualmente atribuídos aos usuários
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {/* Desktop Table */}
          <div className="hidden lg:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Equipamento</TableHead>
                  <TableHead>Data de Início</TableHead>
                  <TableHead>Atribuído por</TableHead>
                  <TableHead>Observações</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeAssignments.map((assignment) => (
                  <TableRow key={assignment.id}>
                    <TableCell className="font-medium">{assignment.user?.name}</TableCell>
                    <TableCell>{assignment.equipment?.name} ({assignment.equipment?.type})</TableCell>
                    <TableCell>{format(new Date(assignment.start_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</TableCell>
                    <TableCell>{assignment.assigned_by_user?.name}</TableCell>
                    <TableCell>{assignment.notes || '-'}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {canEdit && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(assignment)}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Editar
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePreviewPDF(assignment)}
                          disabled={isLoadingPreview}
                        >
                          <FileText className="h-4 w-4 mr-1" />
                          {isLoadingPreview ? 'Carregando...' : 'PDF'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEndingAssignment(assignment)}
                        >
                          Finalizar
                        </Button>
                        {canDelete && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(assignment)}
                            className="hover:bg-destructive hover:text-destructive-foreground"
                          >
                            <Trash className="h-4 w-4 mr-1" />
                            Excluir
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Cards */}
          <div className="lg:hidden space-y-4 p-4">
            {activeAssignments.map((assignment) => (
              <Card key={assignment.id} className="border-border bg-muted/50">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-base">{assignment.equipment?.name}</CardTitle>
                      <CardDescription className="text-sm">
                        Atribuído a: {assignment.user?.name}
                      </CardDescription>
                    </div>
                    <Badge className="text-xs">Ativo</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="grid grid-cols-1 gap-2 text-sm">
                    <div>
                      <span className="font-medium">Usuário:</span> {assignment.user?.name}
                    </div>
                    <div>
                      <span className="font-medium">Equipamento:</span> {assignment.equipment?.name} ({assignment.equipment?.type})
                    </div>
                    <div>
                      <span className="font-medium">Data de Início:</span> {format(new Date(assignment.start_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                    </div>
                    <div>
                      <span className="font-medium">Atribuído por:</span> {assignment.assigned_by_user?.name}
                    </div>
                    {assignment.notes && (
                      <div>
                        <span className="font-medium">Observações:</span> {assignment.notes}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-col gap-2 pt-2">
                    {canEdit && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(assignment)}
                        className="w-full justify-start"
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Editar
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePreviewPDF(assignment)}
                      disabled={isLoadingPreview}
                      className="w-full justify-start"
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      {isLoadingPreview ? 'Carregando...' : 'Visualizar PDF'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEndingAssignment(assignment)}
                      className="w-full justify-start"
                    >
                      Finalizar Atribuição
                    </Button>
                    {canDelete && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(assignment)}
                        className="w-full justify-start hover:bg-destructive hover:text-destructive-foreground"
                      >
                        <Trash className="h-4 w-4 mr-2" />
                        Excluir
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className={`${isMobile ? 'w-[95vw] max-w-[95vw] h-[90vh]' : 'sm:max-w-[700px]'} max-h-[90vh] overflow-y-auto`}>
          <DialogHeader>
            <DialogTitle>Atribuir Novo Equipamento</DialogTitle>
            <DialogDescription>
              Atribua um equipamento a um usuário
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4">
              <div>
                <Label htmlFor="userId">Usuário</Label>
                <Select name="userId" required>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Selecione o usuário" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableUsers.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name} ({user.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="equipmentId">Equipamento</Label>
                <Select name="equipmentId" required>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Selecione o equipamento" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableEquipment.map((equipment) => (
                      <SelectItem key={equipment.id} value={equipment.id}>
                        {equipment.name} ({equipment.type})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="startDate">Data de Início</Label>
                <Input
                  id="startDate"
                  name="startDate"
                  type="date"
                  required
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="notes">Observações</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  placeholder="Observações sobre a atribuição"
                  className="mt-1"
                />
              </div>
            </div>

            <div className={`flex gap-2 ${isMobile ? 'flex-col' : 'justify-end'}`}>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className={isMobile ? 'w-full' : ''}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createAssignment.isPending} className={isMobile ? 'w-full' : ''}>
                {createAssignment.isPending ? 'Atribuindo...' : 'Atribuir Equipamento'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className={`${isMobile ? 'w-[95vw] max-w-[95vw] h-[90vh]' : 'sm:max-w-[700px]'} max-h-[90vh] overflow-y-auto`}>
          <DialogHeader>
            <DialogTitle>Editar Atribuição</DialogTitle>
            <DialogDescription>
              Altere as informações da atribuição
            </DialogDescription>
          </DialogHeader>
          {editingAssignment && (
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="grid gap-4">
                <div>
                  <Label htmlFor="edit-notes">Observações</Label>
                  <Textarea
                    id="edit-notes"
                    name="notes"
                    defaultValue={editingAssignment.notes || ''}
                    placeholder="Observações sobre a atribuição"
                    className="mt-1"
                  />
                </div>
              </div>

              <div className={`flex gap-2 ${isMobile ? 'flex-col' : 'justify-end'}`}>
                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)} className={isMobile ? 'w-full' : ''}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={updateAssignment.isPending} className={isMobile ? 'w-full' : ''}>
                  {updateAssignment.isPending ? 'Salvando...' : 'Salvar Alterações'}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmDeleteDialog
        open={!!deletingAssignment}
        onOpenChange={() => setDeletingAssignment(null)}
        onConfirm={confirmDelete}
        title="Excluir Atribuição"
        description={`Tem certeza que deseja excluir esta atribuição? O equipamento "${deletingAssignment?.equipment?.name}" será marcado como disponível. Esta ação não pode ser desfeita.`}
        isLoading={deleteAssignment.isPending}
      />

      <ConfirmEndAssignmentDialog 
        open={!!endingAssignment}
        onOpenChange={() => setEndingAssignment(null)}
        assignmentId={endingAssignment?.id || ''}
        equipmentName={endingAssignment?.equipment?.name || ''}
        userName={endingAssignment?.user?.name || ''}
      />

      <AssignmentPDFPreviewDialog
        open={isPDFPreviewOpen}
        onOpenChange={() => setIsPDFPreviewOpen(false)}
        assignment={previewData?.assignment}
        equipment={previewData?.equipment}
        user={previewData?.user}
        assignedByUser={previewData?.assignedByUser}
      />
    </div>
  )
}
