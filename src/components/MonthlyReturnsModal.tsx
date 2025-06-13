
import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useMonthlyReturns } from "@/hooks/useAssignmentStats"
import { Calendar, Clock, TrendingUp, Package } from "lucide-react"

interface MonthlyReturnsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function MonthlyReturnsModal({ open, onOpenChange }: MonthlyReturnsModalProps) {
  const { data, isLoading } = useMonthlyReturns()

  if (!data) return null

  const { returns, avgUsageDays } = data

  // Estatísticas adicionais
  const equipmentReturnCount = returns.reduce((acc, assignment) => {
    const equipmentName = assignment.equipment?.name || 'Desconhecido'
    acc[equipmentName] = (acc[equipmentName] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const mostReturnedEquipment = Object.entries(equipmentReturnCount)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 3)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Devoluções deste Mês ({returns.length})
          </DialogTitle>
          <DialogDescription>
            Histórico detalhado das devoluções de equipamentos no mês atual
          </DialogDescription>
        </DialogHeader>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Tempo Médio de Uso
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{avgUsageDays} dias</div>
              <p className="text-xs text-muted-foreground">Por equipamento devolvido</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Total de Devoluções
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{returns.length}</div>
              <p className="text-xs text-muted-foreground">No mês corrente</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Mais Devolvido</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-semibold">
                {mostReturnedEquipment[0]?.[0] || 'N/A'}
              </div>
              <p className="text-xs text-muted-foreground">
                {mostReturnedEquipment[0]?.[1] || 0} devoluções
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="flex-1 overflow-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-600"></div>
            </div>
          ) : returns.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Nenhuma devolução encontrada neste mês.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Equipamento</TableHead>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Período de Uso</TableHead>
                  <TableHead>Duração</TableHead>
                  <TableHead>Data de Devolução</TableHead>
                  <TableHead>Observações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {returns.map((assignment) => {
                  const startDate = new Date(assignment.start_date)
                  const endDate = new Date(assignment.end_date!)
                  const usageDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
                  
                  return (
                    <TableRow key={assignment.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{assignment.equipment?.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {assignment.equipment?.type}
                            {assignment.equipment?.brand && assignment.equipment?.model && 
                              ` - ${assignment.equipment.brand} ${assignment.equipment.model}`
                            }
                          </div>
                          {assignment.equipment?.tombamento && (
                            <Badge variant="outline" className="text-xs mt-1">
                              {assignment.equipment.tombamento}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{assignment.user?.name}</div>
                          <div className="text-sm text-muted-foreground">{assignment.user?.email}</div>
                          {assignment.user?.unit?.name && (
                            <Badge variant="secondary" className="text-xs mt-1">
                              {assignment.user.unit.name}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{startDate.toLocaleDateString('pt-BR')} até</div>
                          <div>{endDate.toLocaleDateString('pt-BR')}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={usageDays > 90 ? "secondary" : usageDays > 30 ? "outline" : "default"}>
                          {usageDays} dias
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {endDate.toLocaleDateString('pt-BR')}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-muted-foreground max-w-xs truncate">
                          {assignment.notes || 'Sem observações'}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
