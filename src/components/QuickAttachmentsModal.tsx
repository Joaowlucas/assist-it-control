
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useTicketAttachments } from "@/hooks/useTicketAttachments"
import { Button } from "@/components/ui/button"
import { Download, Eye } from "lucide-react"

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
  const { data: attachments = [], isLoading } = useTicketAttachments(ticketId)

  const handleDownload = (url: string, filename: string) => {
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>
            Anexos do Chamado #{ticketNumber}
          </DialogTitle>
        </DialogHeader>
        
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600"></div>
          </div>
        ) : attachments.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">Nenhum anexo encontrado</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {attachments.map((attachment) => {
                const isImage = attachment.mime_type?.startsWith('image/')
                
                return (
                  <div key={attachment.id} className="border rounded-lg p-3">
                    {isImage ? (
                      <div className="space-y-2">
                        <img
                          src={attachment.public_url}
                          alt={attachment.file_name}
                          className="w-full h-32 object-cover rounded"
                          loading="lazy"
                        />
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
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-medium truncate">{attachment.file_name}</p>
                          <p className="text-sm text-gray-500">
                            {attachment.file_size ? `${(attachment.file_size / 1024).toFixed(1)} KB` : ''}
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
