
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { useAssignments } from "@/hooks/useAssignments"
import { useCreateAssignment } from "@/hooks/useCreateAssignment"
import { useEndAssignment } from "@/hooks/useEndAssignment"
import { useDeleteAssignment } from "@/hooks/useDeleteAssignment"
import { useAvailableEquipment } from "@/hooks/useAvailableEquipment"
import { useAvailableUsers } from "@/hooks/useAvailableUsers"
import { ConfirmEndAssignmentDialog } from "@/components/ConfirmEndAssignmentDialog"
import { AssignmentPDFPreviewDialog } from "@/components/AssignmentPDFPreviewDialog"
import { Edit, Trash2, FileText, Calendar, CalendarX } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

export function AssignmentManagementSection() {
  const { data: assignments = [], isLoading } = useAssignments()
  const { data: availableEquipment = [] } = useAvailableEquipment()
  const { data: availableUsers = [] } = useAvailableUsers()
  const createAssignmentMutation = useCreateAssignment()
  const endAssignmentMutation = useEndAssignment()
  const deleteAssignmentMutation = useDeleteAssignment()
  
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [endingAssignment, setEndingAssignment] = useState<any>(null)
  const [pdfPreviewAssignment, setPdfPreviewAssignment] = useState<any>(null)

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault()
    const formData = new FormData(e.target as HTMLFormElement)
    
    const assignmentData = {
      user_id: formData.get('user_id') as string,
      equipment_id: formData.get('equipment_id') as string,
      notes: formData.get('notes') as string || undefined,
      assigned_by: 'current-user-id' // This should be the current user's ID
    }

    try {
      await createAssignmentMutation.mutateAsync(assignmentData)
      setIsDialogOpen(false)
      ;(e.target as HTMLFormElement).reset()
    } catch (error) {
      console.error('Error creating assignment:', error)
    }
  }

  const handleEndAssignment = async (assignmentId: string, reason?: string) => {
    try {
      await endAssignmentMutation.mutateAsync({ assignmentId, reason })
      setEndingAssignment(null)
    } catch (error) {
      console.error('Error ending assignment:', error)
    }
  }

  const handleDeleteAssignment = async (assignmentId: string) => {
    try {
      await deleteAssignmentMutation.mutateAsync(assignmentId)
    } catch (error) {
      console.error('Error deleting assignment:', error)
    }
  }

  const handlePDFPreview = (assignment: any) => {
    setPdfPreviewAssignment(assignment)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">Gerenciamento de Atribuições</h3>
          <p className="text-sm text-muted-foreground">
            Gerencie as atribuições de equipamentos aos usuários
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>Nova Atribuição</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Nova Atribuição</DialogTitle>
              <DialogDescription>
                Atribua um equipamento disponível a um usuário
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateAssignment} className="space-y-4">
              <div>
                <Label htmlFor="equipment_id">Equipamento</Label>
                <Select name="equipment_id" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um equipamento" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableEquipment.map((equipment) => (
                      <SelectItem key={equipment.id} value={equipment.id}>
                        {equipment.name} - {equipment.tombamento}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="user_id">Usuário</Label>
                <Select name="user_id" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um usuário" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableUsers.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name} - {user.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="notes">Observações</Label>
                <Textarea 
                  name="notes" 
                  placeholder="Observações sobre a atribuição (opcional)"
                />
              </div>
              
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={createAssignmentMutation.isPending}>
                  {createAssignmentMutation.isPending ? 'Criando...' : 'Criar Atribuição'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Atribuições Ativas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Equipamento</TableHead>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Data de Início</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assignments.filter(a => a.status === 'ativo').map((assignment) => (
                  <TableRow key={assignment.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{assignment.equipment?.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {assignment.equipment?.tombamento}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{assignment.user?.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {assignment.user?.email}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {format(new Date(assignment.start_date), "dd/MM/yyyy", { locale: ptBR })}
                    </TableCell>
                    <TableCell>
                      <Badge variant="default">Ativo</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handlePDFPreview(assignment)}
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEndingAssignment(assignment)}
                        >
                          <CalendarX className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja excluir esta atribuição? 
                                Esta ação não pode ser desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteAssignment(assignment.id)}
                              >
                                Excluir
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Histórico de Atribuições</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Equipamento</TableHead>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Período</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assignments.filter(a => a.status === 'finalizado').map((assignment) => (
                  <TableRow key={assignment.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{assignment.equipment?.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {assignment.equipment?.tombamento}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{assignment.user?.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {assignment.user?.email}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>Início: {format(new Date(assignment.start_date), "dd/MM/yyyy", { locale: ptBR })}</div>
                        {assignment.end_date && (
                          <div>Fim: {format(new Date(assignment.end_date), "dd/MM/yyyy", { locale: ptBR })}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">Finalizado</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handlePDFPreview(assignment)}
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja excluir esta atribuição? 
                                Esta ação não pode ser desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteAssignment(assignment.id)}
                              >
                                Excluir
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {endingAssignment && (
        <ConfirmEndAssignmentDialog
          assignment={endingAssignment}
          onConfirm={handleEndAssignment}
          onCancel={() => setEndingAssignment(null)}
        />
      )}

      {pdfPreviewAssignment && (
        <AssignmentPDFPreviewDialog
          assignment={pdfPreviewAssignment}
          onClose={() => setPdfPreviewAssignment(null)}
        />
      )}
    </div>
  )
}
