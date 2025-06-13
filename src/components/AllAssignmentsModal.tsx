
import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { UserAssignment } from "@/hooks/useUserAssignments"
import { Search } from "lucide-react"

interface AllAssignmentsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  assignments: UserAssignment[]
}

export function AllAssignmentsModal({ open, onOpenChange, assignments }: AllAssignmentsModalProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [typeFilter, setTypeFilter] = useState<string>("all")

  const filteredAssignments = assignments.filter(assignment => {
    const matchesSearch = assignment.equipment.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         assignment.equipment.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         assignment.equipment.model?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || assignment.status === statusFilter
    const matchesType = typeFilter === "all" || assignment.equipment.type === typeFilter
    
    return matchesSearch && matchesStatus && matchesType
  })

  // Obter tipos únicos para o filtro
  const equipmentTypes = Array.from(new Set(assignments.map(a => a.equipment.type)))

  const getAssignmentStatusColor = (status: string) => {
    switch (status) {
      case "ativo": return "default"
      case "finalizado": return "secondary"
      default: return "default"
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[1000px] bg-slate-50 border-slate-200 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-slate-700">Histórico de Equipamentos</DialogTitle>
          <DialogDescription className="text-slate-600">
            Todas as suas atribuições de equipamentos (ativas e finalizadas)
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Filtros */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Buscar por nome, marca ou modelo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 border-slate-300 focus:border-slate-400"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[140px] border-slate-300">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos Status</SelectItem>
                <SelectItem value="ativo">Ativo</SelectItem>
                <SelectItem value="finalizado">Finalizado</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-[140px] border-slate-300">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Tipos</SelectItem>
                {equipmentTypes.map(type => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tabela */}
          <div className="border border-slate-200 rounded-lg">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-200">
                  <TableHead className="text-slate-600">Equipamento</TableHead>
                  <TableHead className="text-slate-600">Tipo</TableHead>
                  <TableHead className="text-slate-600">Marca/Modelo</TableHead>
                  <TableHead className="text-slate-600">Data de Início</TableHead>
                  <TableHead className="text-slate-600">Data de Fim</TableHead>
                  <TableHead className="text-slate-600">Status</TableHead>
                  <TableHead className="text-slate-600">Observações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAssignments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-slate-500 py-8">
                      {assignments.length === 0 
                        ? "Você ainda não possui histórico de equipamentos"
                        : "Nenhuma atribuição encontrada"
                      }
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAssignments.map((assignment) => (
                    <TableRow key={assignment.id} className="border-slate-200">
                      <TableCell className="font-medium text-slate-700">
                        {assignment.equipment.name}
                      </TableCell>
                      <TableCell className="text-slate-600">
                        <Badge variant="outline">
                          {assignment.equipment.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-slate-600">
                        {assignment.equipment.brand && assignment.equipment.model 
                          ? `${assignment.equipment.brand} ${assignment.equipment.model}`
                          : assignment.equipment.brand || assignment.equipment.model || '-'
                        }
                      </TableCell>
                      <TableCell className="text-slate-600">
                        {new Date(assignment.start_date).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell className="text-slate-600">
                        {assignment.end_date 
                          ? new Date(assignment.end_date).toLocaleDateString('pt-BR') 
                          : "-"
                        }
                      </TableCell>
                      <TableCell>
                        <Badge variant={getAssignmentStatusColor(assignment.status) as any}>
                          {assignment.status === 'ativo' ? 'Ativo' : 'Finalizado'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-slate-600">
                        {assignment.notes ? (
                          <div className="max-w-[200px] truncate" title={assignment.notes}>
                            {assignment.notes}
                          </div>
                        ) : '-'}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          
          <div className="text-sm text-slate-500 text-center">
            Mostrando {filteredAssignments.length} de {assignments.length} atribuições
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
