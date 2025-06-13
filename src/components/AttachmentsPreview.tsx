
import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useTicketAttachments } from "@/hooks/useTicketAttachments"
import { useUpdateTicketAttachments } from "@/hooks/useUpdateTicketAttachments"
import { Download, Eye, AlertTriangle, ImageIcon, Trash2 } from "lucide-react"
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface AttachmentsPreviewProps {
  ticketId: string
  ticketNumber: string
  open: boolean
  onOpenChange: (open: boolean) => void
  canEdit?: boolean
}

export function AttachmentsPreview({ 
  ticketId, 
  ticketNumber, 
  open, 
  onOpenChange,
  canEdit = false
}: AttachmentsPreviewProps) {
  const { data: attachments = [], isLoading, error } = useTicketAttachments(ticketId)
  const { removeAttachment } = useUpdateTicketAttachments()
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set())
  const [selectedImage, setSelectedImage] = useState<string | null>(null)

  const handleDownload = (url: string, filename: string) => {
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleImageError = (url: string) => {
    setImageErrors(prev => new Set([...prev, url]))
  }

  const handleImageLoad = (url: string) => {
    setImageErrors(prev => {
      const newSet = new Set(prev)
      newSet.delete(url)
      return newSet
    })
  }

  const handleRemoveAttachment = async (attachmentId: string, filePath: string) => {
    if (confirm('Tem certeza que deseja remover este anexo?')) {
      await removeAttachment.mutateAsync({ attachmentId, filePath })
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              Anexos do Chamado #{ticketNumber}
              <Badge variant="secondary">{attachments.length}</Badge>
            </DialogTitle>
          </DialogHeader>
          
          {error && (
            <div className="text-center py-8">
              <AlertTriangle className="h-8 w-8 mx-auto text-red-500 mb-2" />
              <p className="text-red-600">Erro ao carregar anexos: {error.message}</p>
            </div>
          )}
          
          {isLoading && !error && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600 mr-2"></div>
              <span className="text-gray-600">Carregando anexos...</span>
            </div>
          )}
          
          {!isLoading && !error && attachments.length === 0 && (
            <div className="text-center py-8">
              <ImageIcon className="h-8 w-8 mx-auto text-gray-400 mb-2" />
              <p className="text-gray-500">Nenhum anexo encontrado</p>
            </div>
          )}
          
          {!isLoading && !error && attachments.length > 0 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {attachments.map((attachment) => {
                  const isImage = attachment.mime_type?.startsWith('image/')
                  const hasImageError = imageErrors.has(attachment.public_url)
                  
                  return (
                    <div key={attachment.id} className="border rounded-lg p-3 bg-gray-50">
                      {isImage ? (
                        <div className="space-y-2">
                          {!hasImageError ? (
                            <img
                              src={attachment.public_url}
                              alt={attachment.file_name}
                              className="w-full h-32 object-cover rounded cursor-pointer hover:opacity-80 transition-opacity"
                              loading="lazy"
                              onClick={() => setSelectedImage(attachment.public_url)}
                              onError={() => handleImageError(attachment.public_url)}
                              onLoad={() => handleImageLoad(attachment.public_url)}
                            />
                          ) : (
                            <div className="w-full h-32 bg-gray-200 rounded flex flex-col items-center justify-center">
                              <AlertTriangle className="h-6 w-6 text-red-500 mb-1" />
                              <span className="text-xs text-red-600">Erro ao carregar</span>
                            </div>
                          )}
                          <div className="flex items-center justify-between">
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedImage(attachment.public_url)}
                                className="p-1"
                              >
                                <Eye className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDownload(attachment.public_url, attachment.file_name)}
                                className="p-1"
                              >
                                <Download className="h-3 w-3" />
                              </Button>
                              {canEdit && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRemoveAttachment(attachment.id, attachment.file_path)}
                                  className="p-1 text-red-600 hover:text-red-700"
                                  disabled={removeAttachment.isPending}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="w-full h-32 bg-gray-200 rounded flex items-center justify-center">
                            <ImageIcon className="h-8 w-8 text-gray-400" />
                          </div>
                          <div className="flex items-center justify-between">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDownload(attachment.public_url, attachment.file_name)}
                              className="p-1"
                            >
                              <Download className="h-3 w-3" />
                            </Button>
                            {canEdit && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveAttachment(attachment.id, attachment.file_path)}
                                className="p-1 text-red-600 hover:text-red-700"
                                disabled={removeAttachment.isPending}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                      )}
                      
                      <div className="mt-2 space-y-1">
                        <div className="text-sm font-medium truncate" title={attachment.file_name}>
                          {attachment.file_name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {attachment.file_size && formatFileSize(attachment.file_size)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {format(new Date(attachment.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                        </div>
                        {attachment.uploader && (
                          <div className="text-xs text-blue-600">
                            Por: {attachment.uploader.name}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
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
