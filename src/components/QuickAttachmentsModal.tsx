
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useTicketAttachments } from "@/hooks/useTicketAttachments"
import { Button } from "@/components/ui/button"
import { Download, Eye, AlertTriangle, ImageIcon } from "lucide-react"
import { useState } from "react"

interface QuickAttachmentsModalProps {
  ticketId: string
  ticketNumber: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function QuickAttachmentsModal({ 
  ticketId, 
  ticketNumber, 
  open, 
  onOpenChange 
}: QuickAttachmentsModalProps) {
  const { data: attachments = [], isLoading, error } = useTicketAttachments(ticketId)
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set())

  console.log('🚀 QuickAttachmentsModal - Ticket ID:', ticketId)
  console.log('📎 Quick modal attachments:', attachments)

  const handleDownload = (url: string, filename: string) => {
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleImageError = (url: string) => {
    console.log('❌ Quick modal image failed to load:', url)
    setImageErrors(prev => new Set([...prev, url]))
  }

  const handleImageLoad = (url: string) => {
    console.log('✅ Quick modal image loaded:', url)
    setImageErrors(prev => {
      const newSet = new Set(prev)
      newSet.delete(url)
      return newSet
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>
            Anexos do Chamado #{ticketNumber}
          </DialogTitle>
        </DialogHeader>
        
        {error && (
          <div className="text-center py-8">
            <AlertTriangle className="h-8 w-8 mx-auto text-red-500 mb-2" />
            <p className="text-red-600">Erro ao carregar anexos: {error.message}</p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => window.location.reload()}
              className="mt-2"
            >
              Tentar novamente
            </Button>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {attachments.map((attachment) => {
                const isImage = attachment.mime_type?.startsWith('image/')
                const hasImageError = imageErrors.has(attachment.public_url)
                
                console.log('🖼️ Quick modal rendering attachment:', {
                  id: attachment.id,
                  filename: attachment.file_name,
                  url: attachment.public_url,
                  isImage,
                  hasError: hasImageError
                })
                
                return (
                  <div key={attachment.id} className="border rounded-lg p-3">
                    {isImage ? (
                      <div className="space-y-2">
                        {!hasImageError ? (
                          <img
                            src={attachment.public_url}
                            alt={attachment.file_name}
                            className="w-full h-32 object-cover rounded"
                            loading="lazy"
                            onError={() => handleImageError(attachment.public_url)}
                            onLoad={() => handleImageLoad(attachment.public_url)}
                          />
                        ) : (
                          <div className="w-full h-32 bg-gray-200 rounded flex flex-col items-center justify-center">
                            <AlertTriangle className="h-6 w-6 text-red-500 mb-1" />
                            <span className="text-xs text-red-600">Erro ao carregar imagem</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setImageErrors(prev => {
                                  const newSet = new Set(prev)
                                  newSet.delete(attachment.public_url)
                                  return newSet
                                })
                              }}
                              className="text-xs mt-1"
                            >
                              Tentar novamente
                            </Button>
                          </div>
                        )}
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium truncate">
                            {attachment.file_name}
                          </span>
                          <div className="flex gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(attachment.public_url, '_blank')}
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDownload(attachment.public_url, attachment.file_name)}
                            >
                              <Download className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        <div className="text-xs text-blue-600 font-mono truncate" title={attachment.public_url}>
                          {attachment.public_url}
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-medium truncate">{attachment.file_name}</p>
                          <p className="text-sm text-gray-500">
                            {attachment.file_size ? `${(attachment.file_size / 1024).toFixed(1)} KB` : ''}
                          </p>
                          <p className="text-xs text-blue-600 font-mono truncate" title={attachment.public_url}>
                            {attachment.public_url}
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownload(attachment.public_url, attachment.file_name)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
