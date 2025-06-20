import React, { useState, useMemo } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/useAuth'
import { useAssignments } from '@/hooks/useAssignments'
import { useAvailableEquipment } from '@/hooks/useAvailableEquipment'
import { useAvailableUsers } from '@/hooks/useAvailableUsers'
import { useCreateAssignment } from '@/hooks/useCreateAssignment'
import { useEndAssignment } from '@/hooks/useEndAssignment'
import { useDeleteAssignment } from '@/hooks/useDeleteAssignment'
import { AllAssignmentsModal } from '@/components/AllAssignmentsModal'
import { MonthlyReturnsModal } from '@/components/MonthlyReturnsModal'
import { PendingRequestsModal } from '@/components/PendingRequestsModal'
import { ConfirmEndAssignmentDialog } from '@/components/ConfirmEndAssignmentDialog'
import { ConfirmDeleteDialog } from '@/components/ConfirmDeleteDialog'
import { AssignmentPDFPreviewDialog } from '@/components/AssignmentPDFPreviewDialog'
import { useAssignmentPDF } from '@/hooks/useAssignmentPDF'
import { useSystemSettings } from '@/hooks/useSystemSettings'
import { Search, Plus, Calendar, Users, Archive, FileText, Eye, Trash2, Settings } from 'lucide-react'

export default function Assignments() {
  // State variables
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [selectedEquipmentId, setSelectedEquipmentId] = useState('')
  const [selectedUserId, setSelectedUserId] = useState('')
  const [notes, setNotes] = useState('')
  const [confirmEndDialog, setConfirmEndDialog] = useState<{open: boolean, assignment: any}>({open: false, assignment: null})
  const [confirmDeleteDialog, setConfirmDeleteDialog] = useState<{open: boolean, assignment: any}>({open: false, assignment: null})
  const [pdfPreviewDialog, setPdfPreviewDialog] = useState<{open: boolean, assignment: any}>({open: false, assignment: null})

  const { toast } = useToast()
  const { profile } = useAuth()
  const { data: assignments, isLoading } = useAssignments()
  const { data: availableEquipment } = useAvailableEquipment()
  const { data: availableUsers } = useAvailableUsers()
  const { mutate: createAssignment, isPending: isCreating } = useCreateAssignment()
  const { mutate: endAssignment } = useEndAssignment()
  const { mutate: deleteAssignment } = useDeleteAssignment()
  const { previewAssignmentPDF } = useAssignmentPDF()
  const { data: systemSettings } = useSystemSettings()

  // Filtered assignments logic
  const filteredAssignments = useMemo(() => {
    if (!assignments) return []
    
    return assignments.filter(assignment => {
      const matchesSearch = 
        assignment.equipment?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        assignment.user?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        assignment.equipment?.tombamento?.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesStatus = statusFilter === 'all' || assignment.status === statusFilter
      
      return matchesSearch && matchesStatus
    })
  }, [assignments, searchTerm, statusFilter])

  // Handlers
  const handleCreateAssignment = () => {
    if (!selectedEquipmentId || !selectedUserId) {
      toast({
        title: 'Erro',
        description: 'Selecione um equipamento e um usuário.',
        variant: 'destructive',
      })
      return
    }

    createAssignment({
      equipment_id: selectedEquipmentId,
      user_id: selectedUserId,
      notes: notes.trim() || null,
    }, {
      onSuccess: () => {
        toast({
          title: 'Sucesso',
          description: 'Atribuição criada com sucesso.',
        })
        setIsCreateDialogOpen(false)
        setSelectedEquipmentId('')
        setSelectedUserId('')
        setNotes('')
      },
      onError: (error: any) => {
        toast({
          title: 'Erro',
          description: error.message || 'Não foi possível criar a atribuição.',
          variant: 'destructive',
        })
      }
    })
  }

  const handlePreviewPDF = async (assignment: any) => {
    try {
      const data = await previewAssignmentPDF(
        assignment.id, 
        assignment.equipment?.name || 'Equipamento', 
        assignment.user?.name || 'Usuário'
      )
      setPdfPreviewDialog({
        open: true,
        assignment: { ...assignment, ...data.assignment }
      })
    } catch (error) {
      console.error('Erro ao carregar preview:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header and Stats Cards */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold text-gray-900">Atribuições de Equipamentos</h1>
        <div className="flex flex-wrap gap-2">
          <AllAssignmentsModal />
          <MonthlyReturnsModal />
          <PendingRequestsModal />
        </div>
      </div>

      {/* Stats Cards */}

      {/* Filters and Create Button */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Buscar por equipamento, usuário ou tombamento..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filtrar por status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="ativo">Ativo</SelectItem>
              <SelectItem value="finalizado">Finalizado</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Nova Atribuição
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Nova Atribuição</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="equipment" className="text-right font-medium">
                  Equipamento
                </label>
                <Select
                  id="equipment"
                  value={selectedEquipmentId}
                  onValueChange={setSelectedEquipmentId}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Selecione um equipamento" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableEquipment?.map((equipment) => (
                      <SelectItem key={equipment.id} value={equipment.id}>
                        {equipment.name} ({equipment.tombamento})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="user" className="text-right font-medium">
                  Usuário
                </label>
                <Select
                  id="user"
                  value={selectedUserId}
                  onValueChange={setSelectedUserId}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Selecione um usuário" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableUsers?.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name} ({user.unit?.name})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-start gap-4">
                <label htmlFor="notes" className="text-right font-medium">
                  Observações
                </label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="col-span-3"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => setIsCreateDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" onClick={handleCreateAssignment} disabled={isCreating}>
                {isCreating ? 'Criando...' : 'Criar Atribuição'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Assignments Table */}
      <Card>
        <CardHeader>
          <CardTitle>Atribuições Ativas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
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
                {filteredAssignments.map((assignment) => (
                  <TableRow key={assignment.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{assignment.equipment?.name}</div>
                        <div className="text-sm text-gray-500">
                          {assignment.equipment?.tombamento}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{assignment.user?.name}</div>
                        <div className="text-sm text-gray-500">
                          {assignment.user?.unit?.name}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {format(new Date(assignment.start_date), 'dd/MM/yyyy', { locale: ptBR })}
                    </TableCell>
                    <TableCell>
                      <Badge variant={assignment.status === 'ativo' ? 'default' : 'secondary'}>
                        {assignment.status === 'ativo' ? 'Ativo' : 'Finalizado'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePreviewPDF(assignment)}
                          title="Visualizar PDF"
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                        {assignment.status === 'ativo' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setConfirmEndDialog({open: true, assignment})}
                            title="Finalizar Atribuição"
                          >
                            <Settings className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setConfirmDeleteDialog({open: true, assignment})}
                          title="Excluir Atribuição"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Dialogs */}
      <ConfirmEndAssignmentDialog
        open={confirmEndDialog.open}
        onOpenChange={(open) => setConfirmEndDialog({open, assignment: null})}
        assignment={confirmEndDialog.assignment}
        onConfirm={(assignment) => {
          endAssignment(assignment.id, {
            onSuccess: () => {
              toast({
                title: 'Sucesso',
                description: 'Atribuição finalizada com sucesso.',
              })
              setConfirmEndDialog({open: false, assignment: null})
            }
          })
        }}
      />

      <ConfirmDeleteDialog
        open={confirmDeleteDialog.open}
        onOpenChange={(open) => setConfirmDeleteDialog({open, assignment: null})}
        title="Excluir Atribuição"
        description="Tem certeza que deseja excluir esta atribuição? Esta ação não pode ser desfeita."
        onConfirm={() => {
          if (confirmDeleteDialog.assignment) {
            deleteAssignment(confirmDeleteDialog.assignment.id, {
              onSuccess: () => {
                toast({
                  title: 'Sucesso',
                  description: 'Atribuição excluída com sucesso.',
                })
                setConfirmDeleteDialog({open: false, assignment: null})
              }
            })
          }
        }}
      />

      <AssignmentPDFPreviewDialog
        open={pdfPreviewDialog.open}
        onOpenChange={(open) => setPdfPreviewDialog({open, assignment: null})}
        assignment={pdfPreviewDialog.assignment}
        systemSettings={systemSettings}
        assignmentId={pdfPreviewDialog.assignment?.id || ''}
        equipmentName={pdfPreviewDialog.assignment?.equipment?.name || ''}
        userName={pdfPreviewDialog.assignment?.user?.name || ''}
      />
    </div>
  )
}
