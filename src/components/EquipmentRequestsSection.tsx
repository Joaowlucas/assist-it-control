
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { useEquipmentRequests, EquipmentRequest } from "@/hooks/useEquipmentRequests"
import { EquipmentRequestDialog } from "@/components/EquipmentRequestDialog"
import { Trash2 } from "lucide-react"
import { useState } from "react"

export function EquipmentRequestsSection() {
  const { data: requests = [], isLoading, deleteRequest } = useEquipmentRequests()
  const [isDialogOpen, setIsDialogOpen] = useState(false)

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

  const canCancelRequest = (request: EquipmentRequest) => {
    return request.status === 'pendente'
  }

  const handleCancelRequest = async (requestId: string) => {
    try {
      await deleteRequest.mutateAsync(requestId)
    } catch (error) {
      console.error('Error canceling request:', error)
    }
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

  return (
    <Card className="bg-slate-100/50 border-slate-200">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-slate-700">Solicitações de Equipamentos</CardTitle>
            <CardDescription className="text-slate-600">
              Gerencie suas solicitações de novos equipamentos
            </CardDescription>
          </div>
          <EquipmentRequestDialog 
            open={isDialogOpen} 
            onOpenChange={setIsDialogOpen}
          />
        </div>
      </CardHeader>
      <CardContent>
        {requests.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-slate-500 mb-4">Você ainda não fez nenhuma solicitação de equipamento.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-slate-200">
                <TableHead className="text-slate-600">Tipo</TableHead>
                <TableHead className="text-slate-600">Especificações</TableHead>
                <TableHead className="text-slate-600">Prioridade</TableHead>
                <TableHead className="text-slate-600">Status</TableHead>
                <TableHead className="text-slate-600">Solicitado em</TableHead>
                <TableHead className="text-slate-600">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map((request) => (
                <TableRow key={request.id} className="border-slate-200">
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
                  <TableCell className="text-slate-600 max-w-[200px]">
                    <span className="text-sm">
                      {formatSpecifications(request.specifications)}
                    </span>
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
                      {canCancelRequest(request) && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Cancelar solicitação</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja cancelar esta solicitação de equipamento? 
                                Esta ação não pode ser desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Voltar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleCancelRequest(request.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Cancelar Solicitação
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
