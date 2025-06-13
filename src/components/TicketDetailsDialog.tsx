
import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { useTicketComments, useCreateTicketComment } from "@/hooks/useTicketComments"
import { useUpdateTicketStatus, useAssignTicket } from "@/hooks/useTicketStatus"
import { useAuth } from "@/hooks/useAuth"
import { Calendar, User, MapPin, Tag, AlertCircle, Clock } from "lucide-react"
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface TicketDetailsDialogProps {
  ticket: any
  open: boolean
  onOpenChange: (open: boolean) => void
  technicians: Array<{ id: string; name: string }>
}

export function TicketDetailsDialog({ 
  ticket, 
  open, 
  onOpenChange, 
  technicians = [] 
}: TicketDetailsDialogProps) {
  const [newComment, setNewComment] = useState('')
  const [isInternal, setIsInternal] = useState(false)
  
  const { user } = useAuth()
  const { data: comments = [], isLoading: commentsLoading } = useTicketComments(ticket?.id)
  const createComment = useCreateTicketComment()
  const updateStatus = useUpdateTicketStatus()
  const assignTicket = useAssignTicket()

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'aberto': return 'bg-red-100 text-red-700 border-red-200'
      case 'em_andamento': return 'bg-blue-100 text-blue-700 border-blue-200'
      case 'aguardando': return 'bg-purple-100 text-purple-700 border-purple-200'
      case 'fechado': return 'bg-green-100 text-green-700 border-green-200'
      default: return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critica': return 'bg-red-100 text-red-700 border-red-200'
      case 'alta': return 'bg-orange-100 text-orange-700 border-orange-200'
      case 'media': return 'bg-yellow-100 text-yellow-700 border-yellow-200'
      case 'baixa': return 'bg-green-100 text-green-700 border-green-200'
      default: return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  const handleAddComment = async () => {
    if (!newComment.trim() || !user || !ticket) return

    await createComment.mutateAsync({
      ticket_id: ticket.id,
      user_id: user.id,
      content: newComment,
      is_internal: isInternal,
    })

    setNewComment('')
    setIsInternal(false)
  }

  const handleStatusChange = async (newStatus: string) => {
    if (!ticket) return
    await updateStatus.mutateAsync({ id: ticket.id, status: newStatus as any })
  }

  const handleAssigneeChange = async (assigneeId: string) => {
    if (!ticket) return
    const actualAssigneeId = assigneeId === 'unassigned' ? null : assigneeId
    await assignTicket.mutateAsync({ id: ticket.id, assigneeId: actualAssigneeId })
  }

  if (!ticket) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] bg-gray-50">
        <DialogHeader className="bg-white rounded-lg p-4 border border-gray-200">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Tag className="h-5 w-5 text-gray-600" />
            #{ticket.ticket_number} - {ticket.title}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-1">
          {/* Coluna Principal - Detalhes e Comentários */}
          <div className="lg:col-span-2 space-y-4">
            {/* Informações do Ticket */}
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <h3 className="font-semibold text-gray-800 mb-3">Descrição</h3>
              <p className="text-gray-700 leading-relaxed">{ticket.description}</p>
              
              <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-600">Solicitante:</span>
                  <span className="font-medium">{ticket.requester?.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-600">Unidade:</span>
                  <span className="font-medium">{ticket.unit?.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-600">Criado em:</span>
                  <span className="font-medium">
                    {format(new Date(ticket.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-600">Categoria:</span>
                  <span className="font-medium capitalize">{ticket.category}</span>
                </div>
              </div>
            </div>

            {/* Comentários */}
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="p-4 border-b border-gray-200">
                <h3 className="font-semibold text-gray-800">Comentários</h3>
              </div>
              
              <ScrollArea className="h-64 p-4">
                {commentsLoading ? (
                  <div className="text-center text-gray-500">Carregando comentários...</div>
                ) : comments.length === 0 ? (
                  <div className="text-center text-gray-500">Nenhum comentário ainda</div>
                ) : (
                  <div className="space-y-4">
                    {comments.map((comment: any) => (
                      <div key={comment.id} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-800">{comment.user?.name}</span>
                            {comment.is_internal && (
                              <Badge variant="outline" className="text-xs bg-yellow-100 text-yellow-700 border-yellow-200">
                                Interno
                              </Badge>
                            )}
                          </div>
                          <span className="text-xs text-gray-500">
                            {format(new Date(comment.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                          </span>
                        </div>
                        <p className="text-gray-700 text-sm leading-relaxed">{comment.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>

              {/* Adicionar Comentário */}
              <div className="p-4 border-t border-gray-200 bg-gray-50">
                <div className="space-y-3">
                  <Label htmlFor="comment">Novo Comentário</Label>
                  <Textarea
                    id="comment"
                    placeholder="Digite seu comentário..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="bg-white border-gray-300"
                  />
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={isInternal}
                        onChange={(e) => setIsInternal(e.target.checked)}
                        className="rounded border-gray-300"
                      />
                      <span className="text-gray-600">Comentário interno</span>
                    </label>
                    <Button
                      onClick={handleAddComment}
                      disabled={!newComment.trim() || createComment.isPending}
                      className="bg-blue-100 text-blue-700 hover:bg-blue-200 border border-blue-200"
                    >
                      {createComment.isPending ? 'Adicionando...' : 'Adicionar'}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Coluna Lateral - Status e Ações */}
          <div className="space-y-4">
            {/* Status e Prioridade */}
            <div className="bg-white rounded-lg p-4 border border-gray-200 space-y-4">
              <div>
                <Label className="text-sm font-medium text-gray-600">Status</Label>
                <div className="mt-1">
                  <Select value={ticket.status} onValueChange={handleStatusChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="aberto">Aberto</SelectItem>
                      <SelectItem value="em_andamento">Em Andamento</SelectItem>
                      <SelectItem value="aguardando">Aguardando</SelectItem>
                      <SelectItem value="fechado">Fechado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-600">Prioridade</Label>
                <div className="mt-1">
                  <Badge className={`${getPriorityColor(ticket.priority)} capitalize`}>
                    {ticket.priority}
                  </Badge>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-600">Técnico Responsável</Label>
                <div className="mt-1">
                  <Select 
                    value={ticket.assignee_id || 'unassigned'} 
                    onValueChange={handleAssigneeChange}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Atribuir técnico" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">Não atribuído</SelectItem>
                      {technicians.map((tech) => (
                        <SelectItem key={tech.id} value={tech.id}>
                          {tech.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Informações Adicionais */}
            <div className="bg-white rounded-lg p-4 border border-gray-200 space-y-3">
              <h4 className="font-semibold text-gray-800">Informações</h4>
              
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-600">Última atualização:</span>
                </div>
                <p className="text-gray-700 ml-6">
                  {format(new Date(ticket.updated_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                </p>

                {ticket.resolved_at && (
                  <>
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-green-500" />
                      <span className="text-gray-600">Resolvido em:</span>
                    </div>
                    <p className="text-gray-700 ml-6">
                      {format(new Date(ticket.resolved_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
