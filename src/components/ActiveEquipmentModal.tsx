
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useActiveAssignments } from "@/hooks/useAssignmentStats"
import { ConfirmEndAssignmentDialog } from "@/components/ConfirmEndAssignmentDialog"
import { Loader2 } from "lucide-react"

interface ActiveEquipmentModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ActiveEquipmentModal({ open, onOpenChange }: ActiveEquipmentModalProps) {
  const { data: activeAssignments, isLoading } = useActiveAssignments()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Equipamentos em Uso</DialogTitle>
          <DialogDescription>
            Lista completa de todos os equipamentos atualmente atribuídos
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              Total: {activeAssignments?.length || 0} equipamentos em uso
            </div>
            
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Equipamento</TableHead>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Data de Início</TableHead>
                  <TableHead>Duração</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeAssignments?.map((assignment) => {
                  const startDate = new Date(assignment.start_date)
                  const daysSinceStart = Math.floor((Date.now() - startDate.getTime()) / (1000 * 60 * 60 * 24))
                  
                  return (
                    <TableRow key={assignment.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{assignment.equipment?.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {assignment.equipment?.type}
                            {assignment.equipment?.tombamento && ` - ${assignment.equipment.tombamento}`}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{assignment.user?.name}</div>
                          <div className="text-sm text-muted-foreground">{assignment.user?.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {new Date(assignment.start_date).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell>
                        <Badge variant={daysSinceStart > 90 ? "destructive" : daysSinceStart > 30 ? "secondary" : "outline"}>
                          {daysSinceStart} dias
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <ConfirmEndAssignmentDialog
                          assignmentId={assignment.id}
                          equipmentName={assignment.equipment?.name || 'Equipamento'}
                          userName={assignment.user?.name || 'Usuário'}
                        >
                          <Button variant="outline" size="sm">
                            Finalizar
                          </Button>
                        </ConfirmEndAssignmentDialog>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
