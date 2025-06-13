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
import { useAuth } from "@/hooks/useAuth"
import { Badge } from "@/components/ui/badge"
import { Plus, Edit } from "lucide-react"
import { ConfirmEndAssignmentDialog } from "@/components/ConfirmEndAssignmentDialog"

export function AssignmentManagementSection() {
  const { data: assignments = [], isLoading } = useAssignments()
  const { data: availableEquipment = [] } = useAvailableEquipment()
  const { data: availableUsers = [] } = useAvailableUsers()
  const { user } = useAuth()
  const createAssignmentMutation = useCreateAssignment()
  const updateAssignmentMutation = useUpdateAssignment()
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState<string>("")
  const [selectedEquipmentId, setSelectedEquipmentId] = useState<string>("")
  const [notes, setNotes] = useState<string>("")
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().split('T')[0])
  const [expectedReturnDate, setExpectedReturnDate] = useState<string>("")
  const [editingAssignment, setEditingAssignment] = useState<any>(null)

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-600"></div>
      </div>
    )
  }

  return (
    <Card className="bg-slate-100/50 border-slate-200">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-slate-700">Gestão de Atribuições</CardTitle>
            <CardDescription className="text-slate-600">
              Gerencie as atribuições de equipamentos aos usuários
            </CardDescription>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-slate-600 hover:bg-slate-700 text-white">
                <Plus className="h-4 w-4 mr-2" />
                Nova Atribuição
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
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
                    <p className="text-xs text-slate-500 mt-1">
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

              <DialogFooter>
                <Button variant="outline" onClick={() => {
                  setIsCreateDialogOpen(false)
                  resetCreateForm()
                }}>
                  Cancelar
                </Button>
                <Button
                  onClick={handleCreateAssignment}
                  disabled={!selectedUserId || !selectedEquipmentId || createAssignmentMutation.isPending || !user?.id || availableEquipment.length === 0}
                  className="bg-slate-600 hover:bg-slate-700"
                >
                  {createAssignmentMutation.isPending ? "Criando..." : "Criar Atribuição"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="max-w-md">
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
                  <p className="text-xs text-slate-500 mt-1">O usuário não pode ser alterado após a criação</p>
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
                  <p className="text-xs text-slate-500 mt-1">O equipamento não pode ser alterado após a criação</p>
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

              <DialogFooter>
                <Button variant="outline" onClick={() => {
                  setIsEditDialogOpen(false)
                  resetEditForm()
                }}>
                  Cancelar
                </Button>
                <Button
                  onClick={handleEditAssignment}
                  disabled={updateAssignmentMutation.isPending}
                  className="bg-slate-600 hover:bg-slate-700"
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
            <p className="text-slate-500">Nenhuma atribuição encontrada.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-slate-200">
                <TableHead className="text-slate-600">Usuário</TableHead>
                <TableHead className="text-slate-600">Equipamento</TableHead>
                <TableHead className="text-slate-600">Início</TableHead>
                <TableHead className="text-slate-600">Fim</TableHead>
                <TableHead className="text-slate-600">Status</TableHead>
                <TableHead className="text-slate-600">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assignments.map((assignment) => (
                <TableRow key={assignment.id} className="border-slate-200">
                  <TableCell>
                    <div>
                      <div className="font-medium text-slate-700">
                        {assignment.user?.name}
                      </div>
                      <div className="text-sm text-slate-500">
                        {assignment.user?.email}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium text-slate-700">
                        {assignment.equipment?.name}
                      </div>
                      <div className="text-sm text-slate-500">
                        {assignment.equipment?.type}
                        {assignment.equipment?.brand && assignment.equipment?.model && 
                          ` - ${assignment.equipment.brand} ${assignment.equipment.model}`
                        }
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-slate-600">
                    {new Date(assignment.start_date).toLocaleDateString('pt-BR')}
                  </TableCell>
                  <TableCell className="text-slate-600">
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
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
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
        )}
      </CardContent>
    </Card>
  )
}
