
import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAdminEquipmentRequests, useApproveEquipmentRequest, useRejectEquipmentRequest } from "@/hooks/useAdminEquipmentRequests"
import { useAvailableEquipment } from "@/hooks/useAvailableEquipment"
import { Clock, User, AlertCircle, CheckCircle, XCircle } from "lucide-react"

interface PendingRequestsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function PendingRequestsModal({ open, onOpenChange }: PendingRequestsModalProps) {
  const { data: requests = [], isLoading } = useAdminEquipmentRequests()
  const { data: availableEquipment = [] } = useAvailableEquipment()
  const approveMutation = useApproveEquipmentRequest()
  const rejectMutation = useRejectEquipmentRequest()

  const [selectedRequest, setSelectedRequest] = useState<string | null>(null)
  const [selectedEquipment, setSelectedEquipment] = useState<string>("")
  const [adminComments, setAdminComments] = useState<string>("")

  const pendingRequests = requests.filter(request => request.status === 'pendente')

  const handleApprove = async (requestId: string) => {
    if (!selectedEquipment) return
    
    await approveMutation.mutateAsync({
      requestId,
      equipmentId: selectedEquipment,
      adminComments: adminComments || undefined
    })
    
    setSelectedRequest(null)
    setSelectedEquipment("")
    setAdminComments("")
  }

  const handleReject = async (requestId: string) => {
    await rejectMutation.mutateAsync({
      requestId,
      adminComments: adminComments || undefined
    })
    
    setSelectedRequest(null)
    setAdminComments("")
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'alta': return 'destructive'
      case 'media': return 'outline'
      case 'baixa': return 'secondary'
      default: return 'outline'
    }
  }

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'alta': return 'Alta'
      case 'media': return 'Média'
      case 'baixa': return 'Baixa'
      default: return priority
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Solicitações Pendentes ({pendingRequests.length})
          </DialogTitle>
          <DialogDescription>
            Gerencie as solicitações de equipamentos aguardando aprovação
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-600"></div>
            </div>
          ) : pendingRequests.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Nenhuma solicitação pendente encontrada.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Solicitante</TableHead>
                  <TableHead>Equipamento</TableHead>
                  <TableHead>Prioridade</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Justificativa</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingRequests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="font-medium">{request.requester?.name}</div>
                          <div className="text-sm text-muted-foreground">{request.requester?.email}</div>
                          {request.requester?.unit?.name && (
                            <Badge variant="secondary" className="text-xs mt-1">
                              {request.requester.unit.name}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{request.equipment_type}</div>
                        {request.specifications && typeof request.specifications === 'object' && (
                          <div className="text-xs text-muted-foreground mt-1">
                            {Object.entries(request.specifications).map(([key, value]) => (
                              <div key={key}>{key}: {String(value)}</div>
                            ))}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getPriorityColor(request.priority) as any}>
                        {getPriorityLabel(request.priority)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {new Date(request.requested_at).toLocaleDateString('pt-BR')}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-muted-foreground max-w-xs">
                        <p className="truncate" title={request.justification}>
                          {request.justification}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {selectedRequest === request.id ? (
                          <div className="space-y-2 min-w-64">
                            <Select value={selectedEquipment} onValueChange={setSelectedEquipment}>
                              <SelectTrigger className="text-xs">
                                <SelectValue placeholder="Selecionar equipamento" />
                              </SelectTrigger>
                              <SelectContent>
                                {availableEquipment
                                  .filter(eq => eq.type?.toLowerCase().includes(request.equipment_type.toLowerCase()))
                                  .map((equipment) => (
                                  <SelectItem key={equipment.id} value={equipment.id}>
                                    {equipment.name} - {equipment.type}
                                    {equipment.brand && equipment.model && ` (${equipment.brand} ${equipment.model})`}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Textarea
                              placeholder="Comentários (opcional)"
                              value={adminComments}
                              onChange={(e) => setAdminComments(e.target.value)}
                              className="text-xs"
                              rows={2}
                            />
                            <div className="flex gap-1">
                              <Button 
                                size="sm" 
                                onClick={() => handleApprove(request.id)}
                                disabled={!selectedEquipment || approveMutation.isPending}
                                className="text-xs"
                              >
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Aprovar
                              </Button>
                              <Button 
                                size="sm" 
                                variant="destructive"
                                onClick={() => handleReject(request.id)}
                                disabled={rejectMutation.isPending}
                                className="text-xs"
                              >
                                <XCircle className="h-3 w-3 mr-1" />
                                Rejeitar
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => {
                                  setSelectedRequest(null)
                                  setSelectedEquipment("")
                                  setAdminComments("")
                                }}
                                className="text-xs"
                              >
                                Cancelar
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => setSelectedRequest(request.id)}
                            className="text-xs"
                          >
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Revisar
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
