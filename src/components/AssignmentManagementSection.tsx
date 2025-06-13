
import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useAssignments, useCreateAssignment, useUpdateAssignment } from "@/hooks/useAssignments"
import { useAvailableEquipment } from "@/hooks/useAvailableEquipment"
import { useAvailableUsers } from "@/hooks/useAvailableUsers"
import { Badge } from "@/components/ui/badge"
import { Plus, Settings } from "lucide-react"

export function AssignmentManagementSection() {
  const { data: assignments = [], isLoading } = useAssignments()
  const { data: availableEquipment = [] } = useAvailableEquipment()
  const { data: availableUsers = [] } = useAvailableUsers()
  const createAssignmentMutation = useCreateAssignment()
  const updateAssignmentMutation = useUpdateAssignment()
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState<string>("")
  const [selectedEquipmentId, setSelectedEquipmentId] = useState<string>("")
  const [notes, setNotes] = useState<string>("")
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null)

  const handleCreateAssignment = async () => {
    if (!selectedUserId || !selectedEquipmentId) return

    try {
      await createAssignmentMutation.mutateAsync({
        user_id: selectedUserId,
        equipment_id: selectedEquipmentId,
        assigned_by: '', // Will be set by the backend
        start_date: new Date().toISOString().split('T')[0],
        notes: notes || undefined
      })
      
      setIsCreateDialogOpen(false)
      setSelectedUserId("")
      setSelectedEquipmentId("")
      setNotes("")
    } catch (error) {
      console.error('Error creating assignment:', error)
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
            <DialogContent>
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
                      {availableEquipment.map((equipment) => (
                        <SelectItem key={equipment.id} value={equipment.id}>
                          {equipment.name} - {equipment.type}
                          {equipment.brand && equipment.model && ` (${equipment.brand} ${equipment.model})`}
                          {equipment.serial_number && ` - SN: ${equipment.serial_number}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button
                  onClick={handleCreateAssignment}
                  disabled={!selectedUserId || !selectedEquipmentId || createAssignmentMutation.isPending}
                  className="bg-slate-600 hover:bg-slate-700"
                >
                  Criar Atribuição
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
                    <Badge variant={getStatusColor(assignment.status) as any}>
                      {getStatusLabel(assignment.status)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {assignment.status === 'ativo' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEndAssignment(assignment.id)}
                        disabled={updateAssignmentMutation.isPending}
                      >
                        Finalizar
                      </Button>
                    )}
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
