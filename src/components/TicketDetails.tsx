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
    case 'aberto': return 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800'
    case 'em_andamento': return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800'
    case 'aguardando': return 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800'
    case 'fechado': return 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800'
    default: return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600'
  }
}

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'critica': return 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800'
    case 'alta': return 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-800'
    case 'media': return 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-800'
    case 'baixa': return 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800'
    default: return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600'
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
          <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Status</Label>
          <Badge className={`${getStatusColor(ticket.status)} capitalize`}>
            {getStatusText(ticket.status)}
          </Badge>
        </div>
        
        <div className="space-y-2">
          <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Prioridade</Label>
          <Badge className={`${getPriorityColor(ticket.priority)} capitalize`}>
            {getPriorityText(ticket.priority)}
          </Badge>
        </div>
        
        <div className="space-y-2">
          <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Categoria</Label>
          <p className="text-sm text-slate-600 dark:text-slate-400">{getCategoryText(ticket.category)}</p>
        </div>
        
        <div className="space-y-2">
          <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Solicitante</Label>
          <p className="text-sm text-slate-600 dark:text-slate-400">{ticket.requester.name}</p>
        </div>
        
        <div className="space-y-2">
          <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Unidade</Label>
          <p className="text-sm text-slate-600 dark:text-slate-400">{ticket.unit?.name || 'Não informado'}</p>
        </div>
        
        <div className="space-y-2">
          <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Técnico Responsável</Label>
          <p className="text-sm text-slate-600 dark:text-slate-400">{ticket.assignee?.name || 'Não atribuído'}</p>
        </div>
        
        <div className="space-y-2">
          <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Data de Criação</Label>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {format(new Date(ticket.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
          </p>
        </div>
        
        {ticket.resolved_at && (
          <div className="space-y-2">
            <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Data de Resolução</Label>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {format(new Date(ticket.resolved_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
            </p>
          </div>
        )}
      </div>

      {/* Título e Descrição */}
      <div className="space-y-4">
        <div>
          <Label className="text-lg font-semibold text-slate-900 dark:text-slate-100">Título</Label>
          <p className="mt-1 text-slate-700 dark:text-slate-300">{ticket.title}</p>
        </div>
        
        <div>
          <Label className="text-lg font-semibold text-slate-900 dark:text-slate-100">Descrição</Label>
          <div className="mt-1 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-600">
            <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{ticket.description}</p>
          </div>
        </div>
      </div>

      {/* Anexos */}
      <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600">
        <CardHeader>
          <CardTitle className="text-lg text-slate-900 dark:text-slate-100">Anexos</CardTitle>
        </CardHeader>
        <CardContent>
          {attachmentsLoading ? (
            <div className="text-center text-slate-500 dark:text-slate-400 py-4">Carregando anexos...</div>
          ) : attachmentsError ? (
            <div className="text-center text-red-500 dark:text-red-400 py-4">
              Erro ao carregar anexos: {attachmentsError.message}
            </div>
          ) : attachments.length === 0 ? (
            <div className="text-center text-slate-500 dark:text-slate-400 py-4">Nenhum anexo encontrado</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {attachments.map((attachment) => (
                <div key={attachment.id} className="border border-slate-200 dark:border-slate-600 rounded-lg p-3 bg-slate-50 dark:bg-slate-700/50">
                  {isImageFile(attachment.mime_type) ? (
                    <div className="space-y-2">
                      <img
                        src={attachment.public_url}
                        alt={attachment.file_name}
                        className="w-full h-24 object-cover rounded cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => setSelectedImage(attachment.public_url)}
                        onError={(e) => {
                          console.error('Error loading image:', attachment.public_url)
                          e.currentTarget.style.display = 'none'
                        }}
                      />
                      <div className="flex items-center justify-between">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedImage(attachment.public_url)}
                          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 p-1"
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(attachment.public_url, '_blank')}
                          className="text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 p-1"
                        >
                          <Download className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-3">
                      <FileImage className="h-6 w-6 mx-auto text-slate-400 dark:text-slate-500 mb-1" />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(attachment.public_url, '_blank')}
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        <Download className="h-3 w-3 mr-1" />
                        Baixar
                      </Button>
                    </div>
                  )}
                  
                  <div className="mt-2 text-xs space-y-1">
                    <div className="font-medium truncate text-slate-700 dark:text-slate-300" title={attachment.file_name}>
                      {attachment.file_name}
                    </div>
                    {attachment.file_size && (
                      <div className="text-slate-500 dark:text-slate-400">
                        {formatFileSize(attachment.file_size)}
                      </div>
                    )}
                    <div className="text-slate-400 dark:text-slate-500">
                      Por: {attachment.uploader?.name || 'Usuário'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de visualização de imagem */}
      {selectedImage && (
        <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
          <DialogContent className="max-w-[95vw] md:max-w-4xl max-h-[90vh] p-2 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600">
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
                className="absolute top-2 right-2 bg-black/50 text-white hover:bg-black/70 dark:bg-slate-900/50 dark:hover:bg-slate-900/70"
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
