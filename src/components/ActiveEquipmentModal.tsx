import React, { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Calendar, User, AlertTriangle } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useAssignments } from '@/hooks/useAssignments'
import { ConfirmEndAssignmentDialog } from './ConfirmEndAssignmentDialog'

interface ActiveEquipmentModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ActiveEquipmentModal({ open, onOpenChange }: ActiveEquipmentModalProps) {
  const { data: assignments = [], isLoading } = useAssignments()
  const [confirmEndDialog, setConfirmEndDialog] = useState<{
    open: boolean
    assignmentId: string
    equipmentName: string
    userName: string
  }>({
    open: false,
    assignmentId: '',
    equipmentName: '',
    userName: ''
  })

  const activeAssignments = assignments.filter(assignment => assignment.status === 'ativo')

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ativo':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'finalizado':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
    }
  }

  const handleEndAssignment = (assignmentId: string, equipmentName: string, userName: string) => {
    setConfirmEndDialog({
      open: true,
      assignmentId,
      equipmentName,
      userName
    })
  }

  const handleConfirmEndAssignment = () => {
    setConfirmEndDialog({
      open: false,
      assignmentId: '',
      equipmentName: '',
      userName: ''
    })
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Equipamentos Ativos ({activeAssignments.length})
            </DialogTitle>
            <DialogDescription>
              Lista de todos os equipamentos atualmente em uso
            </DialogDescription>
          </DialogHeader>

          {isLoading ? (
            <div className="flex justify-center p-8">
              <div className="text-muted-foreground">Carregando...</div>
            </div>
          ) : activeAssignments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum equipamento ativo encontrado</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Equipamento</TableHead>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Data Atribuição</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeAssignments.map((assignment) => (
                  <TableRow key={assignment.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {assignment.equipment?.name || 'Equipamento não encontrado'}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {assignment.equipment?.type}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>
                            <User className="h-4 w-4" />
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">
                            {assignment.profiles?.name || 'Usuário não encontrado'}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {assignment.profiles?.email}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          {format(new Date(assignment.start_date), 'dd/MM/yyyy', { locale: ptBR })}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(assignment.status)}>
                        Ativo
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEndAssignment(
                          assignment.id,
                          assignment.equipment?.name || 'Equipamento',
                          assignment.profiles?.name || 'Usuário'
                        )}
                      >
                        Finalizar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmEndAssignmentDialog
        open={confirmEndDialog.open}
        assignmentId={confirmEndDialog.assignmentId}
        equipmentName={confirmEndDialog.equipmentName}
        userName={confirmEndDialog.userName}
        onConfirm={handleConfirmEndAssignment}
        onOpenChange={(open) => setConfirmEndDialog(prev => ({ ...prev, open }))}
      />
    </>
  )
}
