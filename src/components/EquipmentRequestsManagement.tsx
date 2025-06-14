
import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { useAdminEquipmentRequests, useApproveEquipmentRequest, useRejectEquipmentRequest } from "@/hooks/useAdminEquipmentRequests"
import { useAvailableEquipment } from "@/hooks/useAvailableEquipment"
import { CheckCircle, XCircle, Clock, AlertTriangle } from "lucide-react"

export function EquipmentRequestsManagement() {
  const { data: requests = [], isLoading } = useAdminEquipmentRequests()
  const { data: availableEquipment = [] } = useAvailableEquipment()
  const approveRequest = useApproveEquipmentRequest()
  const rejectRequest = useRejectEquipmentRequest()
  
  const [selectedRequest, setSelectedRequest] = useState<any>(null)
  const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false)
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false)
  const [selectedEquipmentId, setSelectedEquipmentId] = useState<string>("")
  const [adminComments, setAdminComments] = useState<string>("")

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critica": return "destructive"
      case "alta": return "default"
      case "media": return "secondary"
      case "baixa": return "outline"
      default: return "secondary"
    }
  }

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "critica": return <AlertTriangle className="h-4 w-4" />
      case "alta": return <AlertTriangle className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pendente": return "default"
      case "aprovado": return "default"
      case "rejeitado": return "destructive"
      case "entregue": return "default"
      default: return "secondary"
    }
  }

  const handleApprove = async () => {
    if (!selectedRequest || !selectedEquipmentId) return

    try {
      await approveRequest.mutateAsync({
        requestId: selectedRequest.id,
        equipmentId: selectedEquipmentId,
        adminComments: adminComments || undefined
      })
      
      setIsApproveDialogOpen(false)
      setSelectedRequest(null)
      setSelectedEquipmentId("")
      setAdminComments("")
    } catch (error) {
      console.error('Error approving request:', error)
    }
  }

  const handleReject = async () => {
    if (!selectedRequest) return

    try {
      await rejectRequest.mutateAsync({
        requestId: selectedRequest.id,
        adminComments: adminComments || undefined
      })
      
      setIsRejectDialogOpen(false)
      setSelectedRequest(null)
      setAdminComments("")
    } catch (error) {
      console.error('Error rejecting request:', error)
    }
  }

  const openApproveDialog = (request: any) => {
    setSelectedRequest(request)
    setIsApproveDialogOpen(true)
  }

  const openRejectDialog = (request: any) => {
    setSelectedRequest(request)
    setIsRejectDialogOpen(true)
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Solicitações de Equipamentos</CardTitle>
          <CardDescription>
            Gerencie as solicitações de equipamentos dos usuários
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <Skeleton className="h-12 w-12 rounded" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-[200px]" />
                  <Skeleton className="h-4 w-[150px]" />
                </div>
                <div className="space-x-2">
                  <Skeleton className="h-8 w-20 inline-block" />
                  <Skeleton className="h-8 w-20 inline-block" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  const pendingRequests = requests.filter(request => request.status === 'pendente')

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Solicitações de Equipamentos</CardTitle>
          <CardDescription>
            Gerencie as solicitações de equipamentos dos usuários
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pendingRequests.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Nenhuma solicitação pendente encontrada.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Tipo de Equipamento</TableHead>
                  <TableHead>Prioridade</TableHead>
                  <TableHead>Data da Solicitação</TableHead>
                  <TableHead>Justificativa</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingRequests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{request.requester?.name}</div>
                        <div className="text-sm text-muted-foreground">{request.requester?.email}</div>
                        {request.requester?.unit?.name && (
                          <div className="text-sm text-muted-foreground">
                            {request.requester.unit.name}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{request.equipment_type}</div>
                      {request.specifications && Object.keys(request.specifications).length > 0 && (
                        <div className="text-sm text-muted-foreground">
                          {Object.entries(request.specifications).map(([key, value]) => (
                            <div key={key}>{key}: {String(value)}</div>
                          ))}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getPriorityColor(request.priority) as any} className="flex items-center gap-1 w-fit">
                        {getPriorityIcon(request.priority)}
                        {request.priority.charAt(0).toUpperCase() + request.priority.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(request.requested_at).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <div className="truncate" title={request.justification}>
                        {request.justification}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => openApproveDialog(request)}
                          disabled={approveRequest.isPending}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Aprovar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openRejectDialog(request)}
                          disabled={rejectRequest.isPending}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Rejeitar
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialog para aprovar solicitação */}
      <Dialog open={isApproveDialogOpen} onOpenChange={setIsApproveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Aprovar Solicitação</DialogTitle>
            <DialogDescription>
              {selectedRequest && (
                <>Aprovar solicitação de {selectedRequest.equipment_type} para {selectedRequest.requester?.name}</>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>Equipamento a ser atribuído</Label>
              <Select value={selectedEquipmentId} onValueChange={setSelectedEquipmentId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um equipamento disponível" />
                </SelectTrigger>
                <SelectContent>
                  {availableEquipment
                    .filter(equipment => 
                      equipment.type.toLowerCase().includes(selectedRequest?.equipment_type.toLowerCase() || '') ||
                      equipment.name.toLowerCase().includes(selectedRequest?.equipment_type.toLowerCase() || '')
                    )
                    .map((equipment) => (
                      <SelectItem key={equipment.id} value={equipment.id}>
                        {equipment.name} - {equipment.type}
                        {equipment.brand && equipment.model && ` (${equipment.brand} ${equipment.model})`}
                        {equipment.serial_number && ` - SN: ${equipment.serial_number}`}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Comentários (opcional)</Label>
              <Textarea
                value={adminComments}
                onChange={(e) => setAdminComments(e.target.value)}
                placeholder="Adicione comentários sobre a aprovação"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsApproveDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleApprove}
              disabled={!selectedEquipmentId || approveRequest.isPending}
            >
              Aprovar e Atribuir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejeitar Solicitação</DialogTitle>
            <DialogDescription>
              {selectedRequest && (
                <>Rejeitar solicitação de {selectedRequest.equipment_type} para {selectedRequest.requester?.name}</>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <div>
            <Label>Motivo da rejeição</Label>
            <Textarea
              value={adminComments}
              onChange={(e) => setAdminComments(e.target.value)}
              placeholder="Explique o motivo da rejeição"
              rows={3}
              required
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRejectDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={!adminComments.trim() || rejectRequest.isPending}
            >
              Rejeitar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
