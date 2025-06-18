
import React, { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Calendar, CalendarDays, User, Package, MapPin, Wrench } from "lucide-react"
import { useAssignments, useCreateAssignment } from "@/hooks/useAssignments"
import { useAvailableEquipment } from "@/hooks/useAvailableEquipment"
import { useAvailableUsers } from "@/hooks/useAvailableUsers"
import { ConfirmEndAssignmentDialog } from "@/components/ConfirmEndAssignmentDialog"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

export function AssignmentManagementSection() {
  const { data: assignments = [], isLoading: loadingAssignments } = useAssignments()
  const { data: availableEquipment = [] } = useAvailableEquipment()
  const { data: availableUsers = [] } = useAvailableUsers()
  const createAssignment = useCreateAssignment()
  
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedEquipment, setSelectedEquipment] = useState("")
  const [selectedUser, setSelectedUser] = useState("")
  const [startDate, setStartDate] = useState("")
  const [notes, setNotes] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      await createAssignment.mutateAsync({
        equipment_id: selectedEquipment,
        user_id: selectedUser,
        start_date: startDate,
        notes: notes || null
      })
      
      // Reset form
      setSelectedEquipment("")
      setSelectedUser("")
      setStartDate("")
      setNotes("")
      setIsDialogOpen(false)
    } catch (error) {
      console.error('Error creating assignment:', error)
    }
  }

  if (loadingAssignments) {
    return <div className="flex justify-center p-4">Carregando...</div>
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Gerenciar Atribuições</CardTitle>
            <CardDescription>
              Controle a atribuição de equipamentos para usuários
            </CardDescription>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Package className="h-4 w-4 mr-2" />
                Nova Atribuição
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nova Atribuição de Equipamento</DialogTitle>
                <DialogDescription>
                  Atribua um equipamento disponível para um usuário
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="equipment">Equipamento</Label>
                  <Select value={selectedEquipment} onValueChange={setSelectedEquipment} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um equipamento" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableEquipment.map((equipment) => (
                        <SelectItem key={equipment.id} value={equipment.id}>
                          {equipment.name} - {equipment.type} ({equipment.brand || 'Sem marca'} {equipment.model || ''})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="user">Usuário</Label>
                  <Select value={selectedUser} onValueChange={setSelectedUser} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um usuário" />
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
                  <Label htmlFor="start_date">Data de Início</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="notes">Observações (opcional)</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Adicione observações sobre esta atribuição..."
                    rows={3}
                  />
                </div>
                
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={createAssignment.isPending}>
                    {createAssignment.isPending ? 'Criando...' : 'Criar Atribuição'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuário</TableHead>
                <TableHead>Equipamento</TableHead>
                <TableHead>Data Início</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Observações</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assignments.map((assignment) => (
                <TableRow key={assignment.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <div>
                        <div className="font-medium">{assignment.user?.name}</div>
                        <div className="text-sm text-muted-foreground">{assignment.user?.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      <div>
                        <div className="font-medium">{assignment.equipment?.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {assignment.equipment?.type} - {assignment.equipment?.brand || 'Sem marca'} {assignment.equipment?.model || ''}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {format(new Date(assignment.start_date), 'dd/MM/yyyy', { locale: ptBR })}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={assignment.status === 'ativo' ? 'default' : 'secondary'}>
                      {assignment.status === 'ativo' ? 'Ativo' : 'Finalizado'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-xs truncate">
                      {assignment.notes || 'Sem observações'}
                    </div>
                  </TableCell>
                  <TableCell>
                    {assignment.status === 'ativo' && (
                      <ConfirmEndAssignmentDialog
                        assignmentId={assignment.id}
                        equipmentName={assignment.equipment?.name || 'Equipamento'}
                        userName={assignment.user?.name || 'Usuário'}
                      >
                        <Button variant="outline" size="sm">
                          <CalendarDays className="h-4 w-4 mr-2" />
                          Finalizar
                        </Button>
                      </ConfirmEndAssignmentDialog>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {assignments.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma atribuição encontrada</p>
              <p className="text-sm">Crie uma nova atribuição para começar</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
