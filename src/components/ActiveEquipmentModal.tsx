
import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useAssignmentStats } from "@/hooks/useAssignmentStats"
import { useAssignmentPDF } from "@/hooks/useAssignmentPDF"
import { ConfirmEndAssignmentDialog } from "@/components/ConfirmEndAssignmentDialog"
import { AssignmentPDFPreviewDialog } from "@/components/AssignmentPDFPreviewDialog"
import { Search, Calendar, User, Settings, FileText } from "lucide-react"

interface ActiveEquipmentModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ActiveEquipmentModal({ open, onOpenChange }: ActiveEquipmentModalProps) {
  const { data, isLoading } = useAssignmentStats()
  const { previewAssignmentPDF, isLoadingPreview } = useAssignmentPDF()
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState("all")
  const [filterUnit, setFilterUnit] = useState("all")
  const [previewModalOpen, setPreviewModalOpen] = useState(false)
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null)
  const [previewData, setPreviewData] = useState<any>(null)
  const [endAssignmentDialogOpen, setEndAssignmentDialogOpen] = useState(false)
  const [assignmentToEnd, setAssignmentToEnd] = useState<any>(null)

  if (!data) return null

  const activeAssignments = data.activeAssignments || []

  // Filtros
  const filteredAssignments = activeAssignments.filter(assignment => {
    const matchesSearch = 
      assignment.equipment?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assignment.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assignment.equipment?.type?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesType = filterType === "all" || assignment.equipment?.type === filterType
    const matchesUnit = filterUnit === "all" || assignment.user?.unit?.name === filterUnit

    return matchesSearch && matchesType && matchesUnit
  })

  // Obter tipos únicos para filtro
  const uniqueTypes = [...new Set(activeAssignments.map(a => a.equipment?.type).filter(Boolean))]
  const uniqueUnits = [...new Set(activeAssignments.map(a => a.user?.unit?.name).filter(Boolean))]

  const handlePreviewAssignment = async (assignment: any) => {
    try {
      setSelectedAssignment(assignment)
      const data = await previewAssignmentPDF(assignment.id)
      setPreviewData(data)
      setPreviewModalOpen(true)
    } catch (error) {
      console.error('Erro ao carregar preview:', error)
    }
  }

  const handleEndAssignment = (assignment: any) => {
    setAssignmentToEnd(assignment)
    setEndAssignmentDialogOpen(true)
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-6xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Equipamentos em Uso ({filteredAssignments.length})
            </DialogTitle>
            <DialogDescription>
              Lista detalhada de todos os equipamentos atualmente atribuídos aos usuários
            </DialogDescription>
          </DialogHeader>

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
            <Select value={filterUnit} onValueChange={setFilterUnit}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrar por unidade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as unidades</SelectItem>
                {uniqueUnits.map(unit => (
                  <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1 overflow-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-600"></div>
              </div>
            ) : filteredAssignments.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Nenhum equipamento em uso encontrado.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Equipamento</TableHead>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Unidade</TableHead>
                    <TableHead>Data de Início</TableHead>
                    <TableHead>Duração</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAssignments.map((assignment) => {
                    const startDate = new Date(assignment.start_date)
                    const daysSinceStart = Math.ceil((new Date().getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
                    
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
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <div className="font-medium">{assignment.user?.name}</div>
                              <div className="text-sm text-muted-foreground">{assignment.user?.email}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {assignment.user?.unit?.name || 'Não informado'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            {startDate.toLocaleDateString('pt-BR')}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={daysSinceStart > 90 ? "destructive" : daysSinceStart > 30 ? "outline" : "default"}>
                            {daysSinceStart} dias
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handlePreviewAssignment(assignment)}
                              disabled={isLoadingPreview}
                              title="Visualizar relatório da atribuição"
                            >
                              <FileText className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleEndAssignment(assignment)}
                            >
                              Finalizar
                            </Button>
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

      {/* Modal de Preview */}
      {selectedAssignment && previewData && (
        <AssignmentPDFPreviewDialog
          open={previewModalOpen}
          onOpenChange={setPreviewModalOpen}
          assignment={previewData.assignment}
          equipment={previewData.equipment}
          user={previewData.user}
          assignedByUser={previewData.assignedByUser}
        />
      )}

      {/* Modal de Finalizar Atribuição */}
      <ConfirmEndAssignmentDialog
        open={endAssignmentDialogOpen}
        onOpenChange={setEndAssignmentDialogOpen}
        assignmentId={assignmentToEnd?.id || ''}
        equipmentName={assignmentToEnd?.equipment?.name || ''}
        userName={assignmentToEnd?.user?.name || ''}
      />
    </>
  )
}
