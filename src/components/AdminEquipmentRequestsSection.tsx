import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useAdminEquipmentRequests, useApproveEquipmentRequest, useRejectEquipmentRequest } from "@/hooks/useAdminEquipmentRequests"
import { useEquipmentByType } from "@/hooks/useAvailableEquipment"
import { Check, X, Eye } from "lucide-react"

export function AdminEquipmentRequestsSection() {
  const { data: requests = [], isLoading } = useAdminEquipmentRequests()
  const approveRequestMutation = useApproveEquipmentRequest()
  const rejectRequestMutation = useRejectEquipmentRequest()
  
  const [selectedRequest, setSelectedRequest] = useState<any>(null)
  const [selectedEquipment, setSelectedEquipment] = useState<string>("")
  const [adminComments, setAdminComments] = useState<string>("")
  const [actionType, setActionType] = useState<'approve' | 'reject'>('approve')

  const { data: availableEquipment = [] } = useEquipmentByType(
    selectedRequest?.equipment_type || ""
  )

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pendente": return "default"
      case "aprovado": return "outline"
      case "rejeitado": return "destructive"
      case "entregue": return "secondary"
      case "cancelado": return "secondary"
      default: return "default"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critica": return "destructive"
      case "alta": return "destructive"
      case "media": return "default"
      case "baixa": return "secondary"
      default: return "default"
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pendente": return "Pendente"
      case "aprovado": return "Aprovado"
      case "rejeitado": return "Rejeitado"
      case "entregue": return "Entregue"
      case "cancelado": return "Cancelado"
      default: return status
    }
  }

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case "critica": return "Crítica"
      case "alta": return "Alta"
      case "media": return "Média"
      case "baixa": return "Baixa"
      default: return priority
    }
  }

  const getEquipmentTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      notebook: "Notebook",
      desktop: "Desktop",
      monitor: "Monitor",
      impressora: "Impressora",
      telefone: "Telefone",
      tablet: "Tablet",
      outros: "Outros"
    }
    return types[type] || type
  }

  const handleApprove = async () => {
    if (!selectedRequest || !selectedEquipment) return

    try {
      await approveRequestMutation.mutateAsync({
        requestId: selectedRequest.id,
        equipmentId: selectedEquipment,
        adminComments
      })
      setSelectedRequest(null)
      setSelectedEquipment("")
      setAdminComments("")
    } catch (error) {
      console.error('Error approving request:', error)
    }
  }

  const handleReject = async () => {
    if (!selectedRequest) return

    try {
      await rejectRequestMutation.mutateAsync({
        requestId: selectedRequest.id,
        adminComments
      })
      setSelectedRequest(null)
      setAdminComments("")
    } catch (error) {
      console.error('Error rejecting request:', error)
    }
  }

  const openDialog = (request: any, action: 'approve' | 'reject') => {
    setSelectedRequest(request)
    setActionType(action)
    setAdminComments("")
    setSelectedEquipment("")
  }

  const formatSpecifications = (specs: Record<string, any>) => {
    if (!specs || Object.keys(specs).length === 0) return '-'
    
    return Object.entries(specs)
      .map(([key, value]) => `${key}: ${value}`)
      .join(', ')
      .substring(0, 60) + (Object.keys(specs).length > 2 ? '...' : '')
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-600"></div>
      </div>
    )
  }

  const pendingRequests = requests.filter(req => req.status === 'pendente')

  return (
    <Card className="bg-slate-100/50 border-slate-200">
      <CardHeader>
        <CardTitle className="text-slate-700">Solicitações de Equipamentos</CardTitle>
        <CardDescription className="text-slate-600">
          Gerencie as solicitações de equipamentos dos usuários
        </CardDescription>
      </CardHeader>
      <CardContent>
        {requests.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-slate-500">Nenhuma solicitação de equipamento encontrada.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-slate-200">
                <TableHead className="text-slate-600">Solicitante</TableHead>
                <TableHead className="text-slate-600">Tipo</TableHead>
                <TableHead className="text-slate-600">Prioridade</TableHead>
                <TableHead className="text-slate-600">Status</TableHead>
                <TableHead className="text-slate-600">Data</TableHead>
                <TableHead className="text-slate-600">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map((request) => (
                <TableRow key={request.id} className="border-slate-200">
                  <TableCell>
                    <div>
                      <div className="font-medium text-slate-700">
                        {request.requester?.name}
                      </div>
                      <div className="text-sm text-slate-500">
                        {request.requester?.unit?.name}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium text-slate-700">
                        {getEquipmentTypeLabel(request.equipment_type)}
                      </div>
                      <div className="text-sm text-slate-500">
                        {request.justification.length > 40 
                          ? `${request.justification.substring(0, 40)}...` 
                          : request.justification}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getPriorityColor(request.priority) as any}>
                      {getPriorityLabel(request.priority)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusColor(request.status) as any}>
                      {getStatusLabel(request.status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-slate-600">
                    {new Date(request.requested_at).toLocaleDateString('pt-BR')}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {request.status === 'pendente' && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-green-600 hover:text-green-700"
                            onClick={() => openDialog(request, 'approve')}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                            onClick={() => openDialog(request, 'reject')}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-slate-600 hover:text-slate-700"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Detalhes da Solicitação</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <strong>Solicitante:</strong> {request.requester?.name} ({request.requester?.email})
                            </div>
                            <div>
                              <strong>Tipo de Equipamento:</strong> {getEquipmentTypeLabel(request.equipment_type)}
                            </div>
                            <div>
                              <strong>Especificações:</strong> {formatSpecifications(request.specifications)}
                            </div>
                            <div>
                              <strong>Justificativa:</strong> {request.justification}
                            </div>
                            <div>
                              <strong>Prioridade:</strong> {getPriorityLabel(request.priority)}
                            </div>
                            {request.admin_comments && (
                              <div>
                                <strong>Comentários do Admin:</strong> {request.admin_comments}
                              </div>
                            )}
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {actionType === 'approve' ? 'Aprovar Solicitação' : 'Rejeitar Solicitação'}
              </DialogTitle>
              <DialogDescription>
                {actionType === 'approve' 
                  ? 'Selecione um equipamento para atribuir ao usuário'
                  : 'Adicione um comentário explicando o motivo da rejeição'
                }
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              {actionType === 'approve' && (
                <div>
                  <Label>Equipamento Disponível</Label>
                  <Select value={selectedEquipment} onValueChange={setSelectedEquipment}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um equipamento" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableEquipment.map((equipment) => (
                        <SelectItem key={equipment.id} value={equipment.id}>
                          {equipment.name} - {equipment.brand} {equipment.model}
                          {equipment.serial_number && ` (SN: ${equipment.serial_number})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              <div>
                <Label>Comentários</Label>
                <Textarea
                  value={adminComments}
                  onChange={(e) => setAdminComments(e.target.value)}
                  placeholder={actionType === 'approve' 
                    ? "Comentários sobre a aprovação (opcional)"
                    : "Explique o motivo da rejeição"
                  }
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedRequest(null)}>
                Cancelar
              </Button>
              <Button
                onClick={actionType === 'approve' ? handleApprove : handleReject}
                disabled={
                  (actionType === 'approve' && !selectedEquipment) ||
                  approveRequestMutation.isPending ||
                  rejectRequestMutation.isPending
                }
                className={actionType === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
              >
                {actionType === 'approve' ? 'Aprovar e Atribuir' : 'Rejeitar'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}
