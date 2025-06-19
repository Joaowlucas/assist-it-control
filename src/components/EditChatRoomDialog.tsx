
import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, Upload, X, User, Settings, Shield } from 'lucide-react'
import { ChatRoom, useChatParticipants, useUpdateChatRoom } from '@/hooks/useChat'
import { useUnits } from '@/hooks/useUnits'
import { useProfiles } from '@/hooks/useProfiles'
import { supabase } from '@/integrations/supabase/client'

interface EditChatRoomDialogProps {
  room: ChatRoom | null
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

export function EditChatRoomDialog({ room, isOpen, onOpenChange }: EditChatRoomDialogProps) {
  const { data: units } = useUnits()
  const { data: profiles } = useProfiles()
  const { data: participants } = useChatParticipants(room?.id || '')
  const updateRoom = useUpdateChatRoom()
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    unitId: 'general',
    participants: [] as string[],
  })
  const [roomImage, setRoomImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [removeExistingImage, setRemoveExistingImage] = useState(false)

  useEffect(() => {
    if (room && participants) {
      setFormData({
        name: room.name,
        description: '',
        unitId: room.unit_id || 'general',
        participants: participants.map(p => p.user_id),
      })
      setImagePreview(room.image_url)
      setRoomImage(null)
      setRemoveExistingImage(false)
    }
  }, [room, participants])

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
        unitId: formData.unitId === 'general' ? undefined : formData.unitId,
        participants: formData.participants,
      })

      // Atualizar a URL da imagem se necessário
      if (imageUrl !== room.image_url) {
        await supabase
          .from('chat_rooms')
          .update({ image_url: imageUrl })
          .eq('id', room.id)
      }
      
      onOpenChange(false)
    } catch (error) {
      console.error('Error updating room:', error)
    }
  }

  const handleParticipantToggle = (userId: string) => {
    setFormData(prev => ({
      ...prev,
      participants: prev.participants.includes(userId)
        ? prev.participants.filter(id => id !== userId)
        : [...prev.participants, userId]
    }))
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Shield className="h-4 w-4" />
      case 'technician':
        return <Settings className="h-4 w-4" />
      default:
        return <User className="h-4 w-4" />
    }
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Admin'
      case 'technician':
        return 'Técnico'
      default:
        return 'Usuário'
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      case 'technician':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      default:
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
    }
  }

  const getUnitName = (unitId: string) => {
    const unit = units?.find(u => u.id === unitId)
    return unit?.name || 'Unidade desconhecida'
  }

  const availableUsers = profiles?.filter(p => 
    formData.unitId === 'general' ? true : p.unit_id === formData.unitId
  )

  if (!room) return null

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Sala de Chat</DialogTitle>
          <DialogDescription>
            Modifique as configurações da sala de chat
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informações Básicas */}
          <div className="space-y-4">
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

            <div>
              <Label htmlFor="description">Descrição (opcional)</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Descreva o propósito da sala..."
                rows={2}
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
          </div>

          <div>
            <Label htmlFor="unit">Unidade</Label>
            <Select 
              value={formData.unitId} 
              onValueChange={(value) => setFormData(prev => ({ 
                ...prev, 
                unitId: value,
                participants: [] 
              }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma unidade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="general">Chat Geral (Todas as unidades)</SelectItem>
                {units?.map((unit) => (
                  <SelectItem key={unit.id} value={unit.id}>
                    {unit.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Participantes</Label>
            
            {(!availableUsers || availableUsers.length === 0) ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Nenhum usuário disponível para a unidade selecionada
                </AlertDescription>
              </Alert>
            ) : (
              <div className="mt-2 max-h-60 overflow-y-auto border rounded-lg p-4 space-y-2">
                {availableUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center gap-3 p-2 rounded hover:bg-muted"
                  >
                    <Checkbox
                      id={`user-${user.id}`}
                      checked={formData.participants.includes(user.id)}
                      onCheckedChange={() => handleParticipantToggle(user.id)}
                    />
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.avatar_url || undefined} />
                      <AvatarFallback className="text-xs">
                        {user.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium truncate">{user.name}</p>
                        <Badge className={`${getRoleColor(user.role)} text-xs flex items-center gap-1`}>
                          {getRoleIcon(user.role)}
                          <span>{getRoleLabel(user.role)}</span>
                        </Badge>
                      </div>
                      {user.unit_id && (
                        <p className="text-xs text-muted-foreground truncate">
                          {getUnitName(user.unit_id)}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
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
