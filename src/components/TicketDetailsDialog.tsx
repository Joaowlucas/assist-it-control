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
import { useTicketAttachments } from "@/hooks/useTicketAttachments"
import { useUpdateTicketStatus, useAssignTicket } from "@/hooks/useTicketStatus"
import { useAuth } from "@/hooks/useAuth"
import { Calendar, User, MapPin, Tag, AlertCircle, Clock, FileImage, Download, Eye } from "lucide-react"
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
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  
  const { user } = useAuth()
  const { data: comments = [], isLoading: commentsLoading } = useTicketComments(ticket?.id)
  const { data: attachments = [], isLoading: attachmentsLoading } = useTicketAttachments(ticket?.id)
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

  const isImageFile = (mimeType: string) => {
    return mimeType?.startsWith('image/')
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
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
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-6xl w-[95vw] max-h-[90vh] bg-gray-50 mx-auto">
          <DialogHeader className="bg-white rounded-lg p-3 md:p-4 border border-gray-200">
            <DialogTitle className="flex items-center gap-2 text-base md:text-lg">
              <Tag className="h-4 md:h-5 w-4 md:w-5 text-gray-600" />
              <span className="truncate">#{ticket.ticket_number} - {ticket.title}</span>
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 md:gap-6 p-1 overflow-y-auto max-h-[calc(90vh-120px)]">
            {/* Coluna Principal - Detalhes e Comentários */}
            <div className="xl:col-span-2 space-y-4">
              {/* Informações do Ticket */}
              <div className="bg-white rounded-lg p-3 md:p-4 border border-gray-200">
                <h3 className="font-semibold text-gray-800 mb-3 text-sm md:text-base">Descrição</h3>
                <p className="text-gray-700 leading-relaxed text-sm md:text-base">{ticket.description}</p>
                
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 text-xs md:text-sm">
                  <div className="flex items-center gap-2">
                    <User className="h-3 md:h-4 w-3 md:w-4 text-gray-500 flex-shrink-0" />
                    <span className="text-gray-600">Solicitante:</span>
                    <span className="font-medium truncate">{ticket.requester?.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-3 md:h-4 w-3 md:w-4 text-gray-500 flex-shrink-0" />
                    <span className="text-gray-600">Unidade:</span>
                    <span className="font-medium truncate">{ticket.unit?.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3 md:h-4 w-3 md:w-4 text-gray-500 flex-shrink-0" />
                    <span className="text-gray-600">Criado em:</span>
                    <span className="font-medium">
                      {format(new Date(ticket.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Tag className="h-3 md:h-4 w-3 md:w-4 text-gray-500 flex-shrink-0" />
                    <span className="text-gray-600">Categoria:</span>
                    <span className="font-medium capitalize">{ticket.category}</span>
                  </div>
                </div>
              </div>

              {/* Anexos */}
              {attachments.length > 0 && (
                <div className="bg-white rounded-lg border border-gray-200">
                  <div className="p-3 md:p-4 border-b border-gray-200">
                    <h3 className="font-semibold text-gray-800 text-sm md:text-base flex items-center gap-2">
                      <FileImage className="h-4 w-4" />
                      Anexos ({attachments.length})
                    </h3>
                  </div>
                  
                  <div className="p-3 md:p-4">
                    {attachmentsLoading ? (
                      <div className="text-center text-gray-500 text-sm">Carregando anexos...</div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {attachments.map((attachment: any) => (
                          <div key={attachment.id} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                            {isImageFile(attachment.mime_type) ? (
                              <div className="space-y-2">
                                <img
                                  src={attachment.public_url}
                                  alt={attachment.file_name}
                                  className="w-full h-32 object-cover rounded cursor-pointer hover:opacity-80 transition-opacity"
                                  onClick={() => setSelectedImage(attachment.public_url)}
                                />
                                <div className="flex items-center justify-between">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setSelectedImage(attachment.public_url)}
                                    className="text-blue-600 hover:text-blue-800 p-1"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => window.open(attachment.public_url, '_blank')}
                                    className="text-gray-600 hover:text-gray-800 p-1"
                                  >
                                    <Download className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div className="text-center py-4">
                                <FileImage className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => window.open(attachment.public_url, '_blank')}
                                  className="text-blue-600 hover:text-blue-800"
                                >
                                  <Download className="h-4 w-4 mr-1" />
                                  Baixar
                                </Button>
                              </div>
                            )}
                            
                            <div className="mt-2 text-xs space-y-1">
                              <div className="font-medium truncate" title={attachment.file_name}>
                                {attachment.file_name}
                              </div>
                              <div className="text-gray-500">
                                {attachment.file_size && formatFileSize(attachment.file_size)}
                              </div>
                              <div className="text-gray-500">
                                {format(new Date(attachment.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Comentários */}
              <div className="bg-white rounded-lg border border-gray-200">
                <div className="p-3 md:p-4 border-b border-gray-200">
                  <h3 className="font-semibold text-gray-800 text-sm md:text-base">Comentários</h3>
                </div>
                
                <div className="max-h-80 md:max-h-96 overflow-y-auto">
                  <div className="p-3 md:p-4">
                    {commentsLoading ? (
                      <div className="text-center text-gray-500 text-sm">Carregando comentários...</div>
                    ) : comments.length === 0 ? (
                      <div className="text-center text-gray-500 text-sm">Nenhum comentário ainda</div>
                    ) : (
                      <div className="space-y-3 md:space-y-4">
                        {comments.map((comment: any) => (
                          <div key={comment.id} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 gap-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-gray-800 text-sm">{comment.user?.name}</span>
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
                  </div>
                </div>

                {/* Adicionar Comentário */}
                <div className="p-3 md:p-4 border-t border-gray-200 bg-gray-50">
                  <div className="space-y-3">
                    <Label htmlFor="comment" className="text-sm">Novo Comentário</Label>
                    <Textarea
                      id="comment"
                      placeholder="Digite seu comentário..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      className="bg-white border-gray-300 text-sm min-h-[80px]"
                    />
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
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
                        className="bg-blue-100 text-blue-700 hover:bg-blue-200 border border-blue-200 w-full sm:w-auto text-sm"
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
              <div className="bg-white rounded-lg p-3 md:p-4 border border-gray-200 space-y-4">
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
                    <Badge className={`${getPriorityColor(ticket.priority)} capitalize text-sm`}>
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
              <div className="bg-white rounded-lg p-3 md:p-4 border border-gray-200 space-y-3">
                <h4 className="font-semibold text-gray-800 text-sm">Informações</h4>
                
                <div className="space-y-2 text-xs md:text-sm">
                  <div className="flex items-center gap-2">
                    <Clock className="h-3 md:h-4 w-3 md:w-4 text-gray-500 flex-shrink-0" />
                    <span className="text-gray-600">Última atualização:</span>
                  </div>
                  <p className="text-gray-700 ml-5 md:ml-6 text-xs">
                    {format(new Date(ticket.updated_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                  </p>

                  {ticket.resolved_at && (
                    <>
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-3 md:h-4 w-3 md:w-4 text-green-500 flex-shrink-0" />
                        <span className="text-gray-600">Resolvido em:</span>
                      </div>
                      <p className="text-gray-700 ml-5 md:ml-6 text-xs">
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

      {/* Modal de visualização de imagem */}
      {selectedImage && (
        <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
          <DialogContent className="max-w-4xl w-[95vw] max-h-[90vh] p-2">
            <div className="relative">
              <img
                src={selectedImage}
                alt="Anexo"
                className="w-full h-auto max-h-[80vh] object-contain rounded"
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.open(selectedImage, '_blank')}
                className="absolute top-2 right-2 bg-black/50 text-white hover:bg-black/70"
              >
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}
