import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { useTicketAttachments } from "@/hooks/useTicketAttachments"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { useState } from "react"
import { Eye, Download, FileImage } from "lucide-react"

interface Ticket {
  id: string
  ticket_number: number
  title: string
  description: string
  priority: string
  status: string
  category: string
  requester: {
    id: string
    name: string
    phone?: string
  }
  assignee?: {
    name: string
  }
  unit?: {
    name: string
  }
  created_at: string
  updated_at: string
  resolved_at: string | null
}

interface TicketDetailsProps {
  ticket: Ticket
}

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

const getStatusText = (status: string) => {
  switch (status) {
    case 'aberto': return 'Aberto'
    case 'em_andamento': return 'Em Andamento'
    case 'aguardando': return 'Aguardando'
    case 'fechado': return 'Fechado'
    default: return status
  }
}

const getPriorityText = (priority: string) => {
  switch (priority) {
    case 'critica': return 'Crítica'
    case 'alta': return 'Alta'
    case 'media': return 'Média'
    case 'baixa': return 'Baixa'
    default: return priority
  }
}

const getCategoryText = (category: string) => {
  switch (category) {
    case 'hardware': return 'Hardware'
    case 'software': return 'Software'
    case 'rede': return 'Rede'
    case 'acesso': return 'Acesso'
    case 'outros': return 'Outros'
    default: return category
  }
}

export function TicketDetails({ ticket }: TicketDetailsProps) {
  const { data: attachments = [], isLoading: attachmentsLoading, error: attachmentsError } = useTicketAttachments(ticket.id)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)

  console.log('TicketDetails - ticket ID:', ticket.id)
  console.log('TicketDetails - attachments:', attachments)
  console.log('TicketDetails - attachments loading:', attachmentsLoading)
  console.log('TicketDetails - attachments error:', attachmentsError)

  const isImageFile = (mimeType?: string) => {
    return mimeType?.startsWith('image/')
  }

  const formatFileSize = (bytes?: number) => {
    if (!bytes || bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="space-y-6">
      {/* Informações básicas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700">Status</Label>
          <Badge className={`${getStatusColor(ticket.status)} capitalize`}>
            {getStatusText(ticket.status)}
          </Badge>
        </div>
        
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700">Prioridade</Label>
          <Badge className={`${getPriorityColor(ticket.priority)} capitalize`}>
            {getPriorityText(ticket.priority)}
          </Badge>
        </div>
        
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700">Categoria</Label>
          <p className="text-sm">{getCategoryText(ticket.category)}</p>
        </div>
        
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700">Solicitante</Label>
          <p className="text-sm">{ticket.requester.name}</p>
        </div>
        
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700">Unidade</Label>
          <p className="text-sm">{ticket.unit?.name || 'Não informado'}</p>
        </div>
        
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700">Técnico Responsável</Label>
          <p className="text-sm">{ticket.assignee?.name || 'Não atribuído'}</p>
        </div>
        
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700">Data de Criação</Label>
          <p className="text-sm">
            {format(new Date(ticket.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
          </p>
        </div>
        
        {ticket.resolved_at && (
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">Data de Resolução</Label>
            <p className="text-sm">
              {format(new Date(ticket.resolved_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
            </p>
          </div>
        )}
      </div>

      {/* Título e Descrição */}
      <div className="space-y-4">
        <div>
          <Label className="text-lg font-semibold text-gray-900">Título</Label>
          <p className="mt-1 text-gray-700">{ticket.title}</p>
        </div>
        
        <div>
          <Label className="text-lg font-semibold text-gray-900">Descrição</Label>
          <div className="mt-1 p-3 bg-gray-50 rounded-lg border">
            <p className="text-gray-700 whitespace-pre-wrap">{ticket.description}</p>
          </div>
        </div>
      </div>

      {/* Anexos */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Anexos do Chamado</CardTitle>
        </CardHeader>
        <CardContent>
          {attachmentsLoading ? (
            <div className="text-center text-gray-500 py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
              Carregando anexos...
            </div>
          ) : attachmentsError ? (
            <div className="text-center text-red-500 py-4">
              <p className="font-medium">Erro ao carregar anexos</p>
              <p className="text-sm">{attachmentsError.message}</p>
            </div>
          ) : attachments.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <FileImage className="h-12 w-12 mx-auto mb-2 text-gray-300" />
              <p className="font-medium">Nenhum anexo encontrado</p>
              <p className="text-sm">Este chamado não possui arquivos anexados.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                {attachments.length} arquivo{attachments.length > 1 ? 's' : ''} anexado{attachments.length > 1 ? 's' : ''}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {attachments.map((attachment) => (
                  <div key={attachment.id} className="border border-gray-200 rounded-lg p-3 bg-gray-50 hover:bg-gray-100 transition-colors">
                    {isImageFile(attachment.mime_type) ? (
                      <div className="space-y-2">
                        <div className="relative">
                          <img
                            src={attachment.public_url}
                            alt={attachment.file_name}
                            className="w-full h-32 object-cover rounded cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => setSelectedImage(attachment.public_url)}
                            onError={(e) => {
                              console.error('Error loading image:', attachment.public_url)
                              e.currentTarget.style.display = 'none'
                            }}
                          />
                          <div className="absolute top-2 right-2 opacity-0 hover:opacity-100 transition-opacity">
                            <Button
                              type="button"
                              variant="secondary"
                              size="sm"
                              onClick={() => setSelectedImage(attachment.public_url)}
                              className="p-1 h-6 w-6"
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-green-600 font-medium">Imagem</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(attachment.public_url, '_blank')}
                            className="text-blue-600 hover:text-blue-800 p-1 h-6"
                          >
                            <Download className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <FileImage className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                        <div className="flex justify-center">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(attachment.public_url, '_blank')}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <Download className="h-3 w-3 mr-1" />
                            Baixar
                          </Button>
                        </div>
                      </div>
                    )}
                    
                    <div className="mt-2 text-xs space-y-1">
                      <div className="font-medium truncate" title={attachment.file_name}>
                        {attachment.file_name}
                      </div>
                      {attachment.file_size && (
                        <div className="text-gray-500">
                          {formatFileSize(attachment.file_size)}
                        </div>
                      )}
                      <div className="text-gray-400">
                        Enviado por: {attachment.uploader?.name || 'Usuário'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de visualização de imagem */}
      {selectedImage && (
        <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
          <DialogContent className="max-w-4xl w-[95vw] max-h-[90vh] p-2">
            <div className="relative">
              <img
                src={selectedImage}
                alt="Anexo"
                className="w-full h-auto max-h-[80vh] object-contain rounded"
                onError={(e) => {
                  console.error('Error loading full size image:', selectedImage)
                }}
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
    </div>
  )
}
