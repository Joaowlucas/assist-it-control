
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAssignments } from "@/hooks/useAssignments"
import { useState, useMemo } from "react"
import { Loader2, Search } from "lucide-react"

interface AllAssignmentsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AllAssignmentsModal({ open, onOpenChange }: AllAssignmentsModalProps) {
  const { data: assignments, isLoading } = useAssignments()
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  const filteredAssignments = useMemo(() => {
    if (!assignments) return []
    
    return assignments.filter(assignment => {
      const matchesSearch = 
        assignment.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        assignment.equipment?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        assignment.equipment?.tombamento?.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesStatus = statusFilter === "all" || assignment.status === statusFilter
      
      return matchesSearch && matchesStatus
    })
  }, [assignments, searchTerm, statusFilter])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ativo": return "default"
      case "finalizado": return "secondary"
      default: return "outline"
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "ativo": return "Ativo"
      case "finalizado": return "Finalizado"
      default: return status
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Histórico de Atribuições</DialogTitle>
          <DialogDescription>
            Histórico completo de todas as atribuições de equipamentos
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex gap-4 items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por usuário, equipamento ou tombamento..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="ativo">Ativo</SelectItem>
                  <SelectItem value="finalizado">Finalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="text-sm text-muted-foreground">
              Mostrando {filteredAssignments.length} de {assignments?.length || 0} atribuições
            </div>
            
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Equipamento</TableHead>
                  <TableHead>Data Início</TableHead>
                  <TableHead>Data Fim</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Duração</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAssignments.map((assignment) => {
                  const startDate = new Date(assignment.start_date)
                  const endDate = assignment.end_date ? new Date(assignment.end_date) : new Date()
                  const durationDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
                  
                  return (
                    <TableRow key={assignment.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{assignment.user?.name}</div>
                          <div className="text-sm text-muted-foreground">{assignment.user?.email}</div>
                        </div>
                      </TableCell>
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
                        {startDate.toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell>
                        {assignment.end_date ? new Date(assignment.end_date).toLocaleDateString('pt-BR') : '-'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusColor(assignment.status) as any}>
                          {getStatusLabel(assignment.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={durationDays > 90 ? "destructive" : durationDays > 30 ? "secondary" : "outline"}>
                          {durationDays} dias
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
