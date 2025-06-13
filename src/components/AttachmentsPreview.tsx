
import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useTicketAttachments } from "@/hooks/useTicketAttachments"
import { FileImage, Download, Eye, Paperclip } from "lucide-react"

interface AttachmentsPreviewProps {
  ticketId: string
  attachmentCount?: number
  showAsIcon?: boolean
}

export function AttachmentsPreview({ ticketId, attachmentCount = 0, showAsIcon = true }: AttachmentsPreviewProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const { data: attachments = [], isLoading } = useTicketAttachments(ticketId)

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

  if (attachmentCount === 0 && !attachments.length) {
    return null
  }

  const TriggerComponent = showAsIcon ? (
    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
      <Paperclip className="h-4 w-4 text-gray-500" />
      {attachmentCount > 0 && (
        <Badge variant="secondary" className="ml-1 h-4 w-4 p-0 text-xs">
          {attachmentCount}
        </Badge>
      )}
    </Button>
  ) : (
    <div className="flex items-center gap-1 text-xs text-gray-500">
      <Paperclip className="h-3 w-3" />
      <span>{attachmentCount}</span>
    </div>
  )

  return (
    <>
      <Dialog>
        <DialogTrigger asChild>
          {TriggerComponent}
        </DialogTrigger>
        <DialogContent className="max-w-4xl w-[95vw] max-h-[80vh] bg-gray-50">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileImage className="h-5 w-5" />
              Anexos ({attachments.length})
            </DialogTitle>
          </DialogHeader>
          
          <div className="overflow-y-auto max-h-[60vh] p-2">
            {isLoading ? (
              <div className="text-center text-gray-500 py-8">Carregando anexos...</div>
            ) : attachments.length === 0 ? (
              <div className="text-center text-gray-500 py-8">Nenhum anexo encontrado</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {attachments.map((attachment: any) => (
                  <div key={attachment.id} className="border border-gray-200 rounded-lg p-3 bg-white">
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
                    </div>
                  </div>
                ))}
              </div>
            )}
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
