import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAssignmentStats } from "@/hooks/useAssignmentStats"
import { useAssignmentPDF } from "@/hooks/useAssignmentPDF"
import { AssignmentPDFPreviewDialog } from "@/components/AssignmentPDFPreviewDialog"
import { Search, Calendar, BarChart3, Users, Package, FileText } from "lucide-react"

interface AllAssignmentsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AllAssignmentsModal({ open, onOpenChange }: AllAssignmentsModalProps) {
  const { data, isLoading } = useAssignmentStats()
  const { previewAssignmentPDF, isLoadingPreview } = useAssignmentPDF()
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterType, setFilterType] = useState("all")
  const [previewModalOpen, setPreviewModalOpen] = useState(false)
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null)
  const [previewData, setPreviewData] = useState<any>(null)

  if (!data) return null

  const allAssignments = data.allAssignments || []

  // Filtros
  const filteredAssignments = allAssignments.filter(assignment => {
    const matchesSearch = 
      assignment.equipment?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assignment.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assignment.equipment?.type?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = filterStatus === "all" || assignment.status === filterStatus
    const matchesType = filterType === "all" || assignment.equipment?.type === filterType

    return matchesSearch && matchesStatus && matchesType
  })

  // Estatísticas
  const activeCount = allAssignments.filter(a => a.status === 'ativo').length
  const finishedCount = allAssignments.filter(a => a.status === 'finalizado').length
  
  const equipmentCount = allAssignments.reduce((acc, assignment) => {
    const equipmentName = assignment.equipment?.name || 'Desconhecido'
    acc[equipmentName] = (acc[equipmentName] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const userCount = allAssignments.reduce((acc, assignment) => {
    const userName = assignment.user?.name || 'Desconhecido'
    acc[userName] = (acc[userName] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const mostAssignedEquipment = Object.entries(equipmentCount)
    .sort(([,a], [,b]) => b - a)[0]

  const mostActiveUser = Object.entries(userCount)
    .sort(([,a], [,b]) => b - a)[0]

  // Obter valores únicos para filtros
  const uniqueTypes = [...new Set(allAssignments.map(a => a.equipment?.type).filter(Boolean))]

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

  const handlePreviewAssignment = async (assignment: any) => {
    try {
      setSelectedAssignment(assignment)
      const data = await previewAssignmentPDF(
        assignment.id,
        assignment.equipment?.name || 'Equipamento',
        assignment.user?.name || 'Usuário'
      )
      setPreviewData(data)
      setPreviewModalOpen(true)
    } catch (error) {
      console.error('Erro ao carregar preview:', error)
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-7xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Histórico Completo de Atribuições ({filteredAssignments.length})
            </DialogTitle>
            <DialogDescription>
              Visualização completa de todas as atribuições de equipamentos (ativas e finalizadas)
            </DialogDescription>
          </DialogHeader>

          {/* Estatísticas */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Ativas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{activeCount}</div>
                <p className="text-xs text-muted-foreground">Atribuições em andamento</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Finalizadas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{finishedCount}</div>
                <p className="text-xs text-muted-foreground">Atribuições concluídas</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Equipamento Mais Usado</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg font-semibold truncate">
                  {mostAssignedEquipment?.[0] || 'N/A'}
                </div>
                <p className="text-xs text-muted-foreground">
                  {mostAssignedEquipment?.[1] || 0} atribuições
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Usuário Mais Ativo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg font-semibold truncate">
                  {mostActiveUser?.[0] || 'N/A'}
                </div>
                <p className="text-xs text-muted-foreground">
                  {mostActiveUser?.[1] || 0} atribuições
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Filtros */}
          <div className="flex gap-4 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por equipamento, usuário ou tipo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="ativo">Ativo</SelectItem>
                <SelectItem value="finalizado">Finalizado</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrar por tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                {uniqueTypes.map(type => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tabela */}
          <div className="flex-1 overflow-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-600"></div>
              </div>
            ) : filteredAssignments.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Nenhuma atribuição encontrada.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Equipamento</TableHead>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Período</TableHead>
                    <TableHead>Duração</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Responsável</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAssignments.map((assignment) => {
                    const startDate = new Date(assignment.start_date)
                    const endDate = assignment.end_date ? new Date(assignment.end_date) : new Date()
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
                            <div>{startDate.toLocaleDateString('pt-BR')}</div>
                            {assignment.end_date && (
                              <div>até {endDate.toLocaleDateString('pt-BR')}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={usageDays > 90 ? "destructive" : usageDays > 30 ? "outline" : "default"}>
                            {usageDays} dias
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusColor(assignment.status) as any}>
                            {getStatusLabel(assignment.status)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-muted-foreground">
                            {assignment.assigned_by_user?.name || 'Sistema'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePreviewAssignment(assignment)}
                            disabled={isLoadingPreview}
                            title="Visualizar relatório da atribuição"
                          >
                            <FileText className="h-4 w-4" />
                          </Button>
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

      {/* Modal de Preview */}
      {selectedAssignment && previewData && (
        <AssignmentPDFPreviewDialog
          open={previewModalOpen}
          onOpenChange={setPreviewModalOpen}
          assignment={previewData.assignment}
          systemSettings={previewData.systemSettings}
          assignmentId={selectedAssignment.id}
          equipmentName={selectedAssignment.equipment?.name || 'Equipamento'}
          userName={selectedAssignment.user?.name || 'Usuário'}
        />
      )}
    </>
  )
}
