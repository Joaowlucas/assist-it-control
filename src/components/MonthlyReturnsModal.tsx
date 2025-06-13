
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useMonthlyReturns } from "@/hooks/useAssignmentStats"
import { Loader2 } from "lucide-react"

interface MonthlyReturnsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function MonthlyReturnsModal({ open, onOpenChange }: MonthlyReturnsModalProps) {
  const { data: monthlyReturns, isLoading } = useMonthlyReturns()

  const calculateUsageDuration = (startDate: string, endDate: string) => {
    const start = new Date(startDate)
    const end = new Date(endDate)
    const diffTime = Math.abs(end.getTime() - start.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const averageUsageDays = monthlyReturns?.length 
    ? Math.round(monthlyReturns.reduce((acc, assignment) => 
        acc + calculateUsageDuration(assignment.start_date, assignment.end_date!), 0) / monthlyReturns.length)
    : 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Devoluções deste Mês</DialogTitle>
          <DialogDescription>
            Equipamentos devolvidos no mês atual
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
              <div>
                <div className="text-2xl font-bold">{monthlyReturns?.length || 0}</div>
                <div className="text-sm text-muted-foreground">Total de devoluções</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{averageUsageDays}</div>
                <div className="text-sm text-muted-foreground">Dias médios de uso</div>
              </div>
            </div>
            
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Equipamento</TableHead>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Data de Devolução</TableHead>
                  <TableHead>Período de Uso</TableHead>
                  <TableHead>Duração</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {monthlyReturns?.map((assignment) => {
                  const usageDays = calculateUsageDuration(assignment.start_date, assignment.end_date!)
                  
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
                        {new Date(assignment.end_date!).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{new Date(assignment.start_date).toLocaleDateString('pt-BR')}</div>
                          <div className="text-muted-foreground">até</div>
                          <div>{new Date(assignment.end_date!).toLocaleDateString('pt-BR')}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={usageDays > 90 ? "destructive" : usageDays > 30 ? "secondary" : "outline"}>
                          {usageDays} dias
                        </Badge>
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
