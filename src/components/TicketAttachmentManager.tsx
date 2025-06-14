
import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { ImageUpload } from '@/components/ImageUpload'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { useAddTicketAttachment, useRemoveTicketAttachment } from '@/hooks/useTicketAttachmentManagement'
import { X, FileImage, Download, Eye, ZoomIn } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface Attachment {
  id: string
  file_name: string
  file_path: string
  file_size?: number
  mime_type?: string
  public_url: string
  uploader: {
    name: string
    email: string
  }
}

interface TicketAttachmentManagerProps {
  ticketId: string
  existingAttachments: Attachment[]
}

export function TicketAttachmentManager({ ticketId, existingAttachments }: TicketAttachmentManagerProps) {
  const [newImages, setNewImages] = useState<File[]>([])
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  
  const addAttachmentMutation = useAddTicketAttachment()
  const removeAttachmentMutation = useRemoveTicketAttachment()

  console.log('TicketAttachmentManager - ticketId:', ticketId)
  console.log('TicketAttachmentManager - existingAttachments:', existingAttachments)

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

  const handleAddAttachments = async () => {
    if (newImages.length === 0) return

    console.log('Adding attachments for ticket:', ticketId)
    try {
      await addAttachmentMutation.mutateAsync({
        ticketId,
        files: newImages
      })
      setNewImages([])
    } catch (error) {
      console.error('Error adding attachments:', error)
    }
  }

  const handleRemoveAttachment = async (attachment: Attachment) => {
    console.log('Removing attachment:', attachment.id)
    try {
      await removeAttachmentMutation.mutateAsync({
        attachmentId: attachment.id,
        filePath: attachment.file_path
      })
    } catch (error) {
      console.error('Error removing attachment:', error)
    }
  }

  return (
    <div className="space-y-4">
      {/* Anexos Existentes */}
      {existingAttachments.length > 0 && (
        <div>
          <Label className="text-slate-700 text-sm font-medium">Anexos Atuais ({existingAttachments.length})</Label>
          <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {existingAttachments.map((attachment) => (
              <div key={attachment.id} className="relative border border-slate-200 rounded-lg p-3 bg-slate-50">
                {isImageFile(attachment.mime_type) ? (
                  <div className="space-y-2">
                    <div className="relative group">
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
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all rounded flex items-center justify-center">
                        <ZoomIn className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedImage(attachment.public_url)}
                        className="text-blue-600 hover:text-blue-800 p-1"
                      >
                        <Eye className="h-3 w-3" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(attachment.public_url, '_blank')}
                        className="text-gray-600 hover:text-gray-800 p-1"
                      >
                        <Download className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-3">
                    <FileImage className="h-6 w-6 mx-auto text-gray-400 mb-1" />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(attachment.public_url, '_blank')}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <Download className="h-3 w-3 mr-1" />
                      Baixar
                    </Button>
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
                    Por: {attachment.uploader?.name || 'Usuário'}
                  </div>
                </div>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute -top-1 -right-1 h-6 w-6 rounded-full p-0 bg-red-100 hover:bg-red-200 text-red-600"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Remover anexo</AlertDialogTitle>
                      <AlertDialogDescription>
                        Tem certeza que deseja remover o anexo "{attachment.file_name}"? 
                        Esta ação não pode ser desfeita.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleRemoveAttachment(attachment)}
                        className="bg-red-600 hover:bg-red-700"
                        disabled={removeAttachmentMutation.isPending}
                      >
                        {removeAttachmentMutation.isPending ? 'Removendo...' : 'Remover'}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Adicionar Novos Anexos */}
      <div>
        <ImageUpload 
          images={newImages}
          onImagesChange={setNewImages}
          maxImages={5}
        />
        
        {newImages.length > 0 && (
          <div className="mt-3 flex justify-end">
            <Button
              type="button"
              onClick={handleAddAttachments}
              disabled={addAttachmentMutation.isPending}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {addAttachmentMutation.isPending ? 'Adicionando...' : `Adicionar ${newImages.length} anexo(s)`}
            </Button>
          </div>
        )}
      </div>

      {/* Modal de visualização de imagem em tela cheia */}
      {selectedImage && (
        <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
          <DialogContent className="max-w-[98vw] w-[98vw] max-h-[98vh] h-[98vh] p-0 bg-black/95">
            <DialogHeader className="absolute top-0 left-0 right-0 z-10 bg-black/50 text-white p-4">
              <DialogTitle className="text-white flex items-center justify-between">
                <span>Visualização do Anexo</span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open(selectedImage, '_blank')}
                    className="text-white hover:bg-white/20"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Baixar Original
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedImage(null)}
                    className="text-white hover:bg-white/20"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </DialogTitle>
            </DialogHeader>
            <div className="w-full h-full flex items-center justify-center p-4">
              <img
                src={selectedImage}
                alt="Anexo em tela cheia"
                className="max-w-full max-h-full object-contain"
                style={{ maxHeight: 'calc(100vh - 100px)' }}
                onError={(e) => {
                  console.error('Error loading full size image:', selectedImage)
                }}
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
