
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAdminEquipmentRequests } from "@/hooks/useAdminEquipmentRequests"
import { useAvailableEquipment } from "@/hooks/useAvailableEquipment"
import { useApproveEquipmentRequest, useRejectEquipmentRequest } from "@/hooks/useAdminEquipmentRequests"
import { useState } from "react"
import { Loader2 } from "lucide-react"

interface PendingRequestsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function PendingRequestsModal({ open, onOpenChange }: PendingRequestsModalProps) {
  const { data: requests, isLoading } = useAdminEquipmentRequests()
  const { data: availableEquipment } = useAvailableEquipment()
  const approveRequest = useApproveEquipmentRequest()
  const rejectRequest = useRejectEquipmentRequest()
  
  const [selectedEquipment, setSelectedEquipment] = useState<{[key: string]: string}>({})

  const pendingRequests = requests?.filter(r => r.status === 'pendente') || []

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'alta': return 'destructive'
      case 'media': return 'secondary'
      case 'baixa': return 'outline'
      default: return 'outline'
    }
  }

  const handleApprove = async (requestId: string) => {
    const equipmentId = selectedEquipment[requestId]
    if (!equipmentId) return

    try {
      await approveRequest.mutateAsync({
        requestId,
        equipmentId,
        adminComments: 'Aprovado via modal de solicitações pendentes'
      })
    } catch (error) {
      console.error('Error approving request:', error)
    }
  }

  const handleReject = async (requestId: string) => {
    try {
      await rejectRequest.mutateAsync({
        requestId,
        adminComments: 'Rejeitado via modal de solicitações pendentes'
      })
    } catch (error) {
      console.error('Error rejecting request:', error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Solicitações Pendentes</DialogTitle>
          <DialogDescription>
            Solicitações de equipamentos aguardando aprovação
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              Total: {pendingRequests.length} solicitações pendentes
            </div>
            
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Solicitante</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Prioridade</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Equipamento</TableHead>
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
                      </div>
                    </TableCell>
                    <TableCell>{request.equipment_type}</TableCell>
                    <TableCell>
                      <Badge variant={getPriorityColor(request.priority) as any}>
                        {request.priority.charAt(0).toUpperCase() + request.priority.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(request.requested_at).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell>
                      <Select
                        value={selectedEquipment[request.id] || ""}
                        onValueChange={(value) => 
                          setSelectedEquipment(prev => ({ ...prev, [request.id]: value }))
                        }
                      >
                        <SelectTrigger className="w-[200px]">
                          <SelectValue placeholder="Selecionar equipamento" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableEquipment
                            ?.filter(eq => eq.type === request.equipment_type)
                            .map((equipment) => (
                              <SelectItem key={equipment.id} value={equipment.id}>
                                {equipment.name} - {equipment.tombamento}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleApprove(request.id)}
                          disabled={!selectedEquipment[request.id] || approveRequest.isPending}
                        >
                          Aprovar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleReject(request.id)}
                          disabled={rejectRequest.isPending}
                        >
                          Rejeitar
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
