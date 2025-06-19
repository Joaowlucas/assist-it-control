
import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Upload, X } from 'lucide-react'
import { ChatRoom, useChatParticipants, useUpdateChatRoom } from '@/hooks/useChat'
import { supabase } from '@/integrations/supabase/client'

interface EditChatRoomDialogProps {
  room: ChatRoom | null
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

export function EditChatRoomDialog({ room, isOpen, onOpenChange }: EditChatRoomDialogProps) {
  const { data: participants } = useChatParticipants(room?.id || '')
  const updateRoom = useUpdateChatRoom()
  
  const [formData, setFormData] = useState({
    name: '',
  })
  const [roomImage, setRoomImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [removeExistingImage, setRemoveExistingImage] = useState(false)

  useEffect(() => {
    if (room) {
      setFormData({
        name: room.name,
      })
      setImagePreview(room.image_url)
      setRoomImage(null)
      setRemoveExistingImage(false)
    }
  }, [room])

  const handleImageSelect = (file: File) => {
    setRoomImage(file)
    const reader = new FileReader()
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)
    setRemoveExistingImage(false)
  }

  const handleImageRemove = () => {
    setRoomImage(null)
    setImagePreview(null)
    setRemoveExistingImage(true)
  }

  const uploadRoomImage = async (): Promise<string | null> => {
    if (!roomImage) return null

    const fileExt = roomImage.name.split('.').pop()
    const fileName = `room-${room?.id}-${Date.now()}.${fileExt}`
    const filePath = `rooms/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('chat-attachments')
      .upload(filePath, roomImage)

    if (uploadError) {
      console.error('Error uploading room image:', uploadError)
      throw new Error('Erro ao fazer upload da imagem')
    }

    const { data: urlData } = supabase.storage
      .from('chat-attachments')
      .getPublicUrl(filePath)

    return urlData.publicUrl
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!room || !formData.name.trim()) return

    try {
      // Upload da nova imagem se fornecida
      let imageUrl = room.image_url
      if (roomImage) {
        imageUrl = await uploadRoomImage()
      } else if (removeExistingImage) {
        imageUrl = null
      }

      await updateRoom.mutateAsync({
        roomId: room.id,
        name: formData.name,
        imageUrl: imageUrl,
      })
      
      onOpenChange(false)
    } catch (error) {
      console.error('Error updating room:', error)
    }
  }

  if (!room) return null

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Sala de Chat</DialogTitle>
          <DialogDescription>
            Modifique o nome e imagem da sala de chat
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Nome da Sala *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Digite o nome da sala..."
              required
            />
          </div>

          {/* Upload de Imagem */}
          <div>
            <Label>Imagem da Sala (opcional)</Label>
            <div className="mt-2">
              {imagePreview ? (
                <div className="flex items-center gap-4">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-16 h-16 object-cover rounded-lg border"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleImageRemove}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Remover Imagem
                  </Button>
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-gray-600 mb-2">Clique para selecionar uma imagem</p>
                  <p className="text-sm text-gray-500">Máximo 5MB (JPG, PNG, GIF)</p>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/gif"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file && file.size <= 5 * 1024 * 1024) {
                        handleImageSelect(file)
                      }
                    }}
                    className="hidden"
                    id="image-upload-edit"
                  />
                  <Label
                    htmlFor="image-upload-edit"
                    className="inline-block mt-2 px-4 py-2 bg-primary text-primary-foreground rounded cursor-pointer hover:bg-primary/90"
                  >
                    Selecionar Imagem
                  </Label>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={updateRoom.isPending}
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={updateRoom.isPending || !formData.name.trim()}
            >
              {updateRoom.isPending ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
