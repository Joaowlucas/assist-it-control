
import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Plus, Users, Building2, Globe, User, Settings, Shield, Upload, X, MessageCircle } from 'lucide-react'
import { useCreateChatRoom } from '@/hooks/useChat'
import { useUnits } from '@/hooks/useUnits'
import { useProfiles } from '@/hooks/useProfiles'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/integrations/supabase/client'

interface CreateChatRoomDialogProps {
  onRoomCreated?: (roomId: string) => void
}

type RoomType = 'private' | 'unit' | 'group'

export function CreateChatRoomDialog({ onRoomCreated }: CreateChatRoomDialogProps) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [roomType, setRoomType] = useState<RoomType>('unit')
  const [selectedUnit, setSelectedUnit] = useState<string>('')
  const [selectedUnits, setSelectedUnits] = useState<string[]>([])
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [roomImage, setRoomImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const { profile } = useAuth()
  const { data: units = [], isLoading: unitsLoading } = useUnits()
  const { data: profiles = [], isLoading: profilesLoading } = useProfiles()
  const createChatRoom = useCreateChatRoom()

  const filteredProfiles = profiles.filter(p => 
    p.status === 'ativo' && 
    p.id !== profile?.id &&
    (roomType === 'group' ? 
      selectedUnits.length === 0 || selectedUnits.includes(p.unit_id || '') :
      roomType === 'private' ? true :
      !selectedUnit || p.unit_id === selectedUnit
    )
  )

  const handleImageSelect = (file: File) => {
    setRoomImage(file)
    const reader = new FileReader()
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleImageRemove = () => {
    setRoomImage(null)
    setImagePreview(null)
  }

  const uploadRoomImage = async (roomId: string): Promise<string | null> => {
    if (!roomImage) return null

    const fileExt = roomImage.name.split('.').pop()
    const fileName = `room-${roomId}-${Date.now()}.${fileExt}`
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
    if (!name.trim()) return

    setIsLoading(true)
    try {
      let participantIds: string[] = []
      let unitId: string | null = null
      let selectedUnitsArray: string[] = []

      if (roomType === 'private') {
        // Para conversas privadas, usar participantes selecionados
        participantIds = selectedUsers
      } else if (roomType === 'unit' && selectedUnit) {
        // Para salas de unidade, usar unit_id (participantes adicionados pelo trigger)
        unitId = selectedUnit
      } else if (roomType === 'group') {
        // Para grupos personalizados, usar unidades selecionadas + participantes específicos
        selectedUnitsArray = selectedUnits
        participantIds = selectedUsers
      }

      const roomId = await createChatRoom.mutateAsync({
        name,
        type: roomType,
        unitId,
        selectedUnits: selectedUnitsArray,
        participantIds
      })

      // Upload da imagem se fornecida
      if (roomImage) {
        const imageUrl = await uploadRoomImage(roomId)
        
        if (imageUrl) {
          await supabase
            .from('chat_rooms')
            .update({ image_url: imageUrl })
            .eq('id', roomId)
        }
      }

      // Reset form
      setName('')
      setDescription('')
      setRoomType('unit')
      setSelectedUnit('')
      setSelectedUnits([])
      setSelectedUsers([])
      setRoomImage(null)
      setImagePreview(null)
      setOpen(false)

      onRoomCreated?.(roomId)
    } catch (error) {
      console.error('Error creating room:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleUnitToggle = (unitId: string) => {
    setSelectedUnits(prev => 
      prev.includes(unitId) 
        ? prev.filter(id => id !== unitId)
        : [...prev, unitId]
    )
  }

  const handleUserToggle = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    )
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
    const unit = units.find(u => u.id === unitId)
    return unit?.name || 'Unidade desconhecida'
  }

  const isFormValid = () => {
    if (!name.trim()) return false
    
    switch (roomType) {
      case 'private':
        return selectedUsers.length > 0
      case 'unit':
        return !!selectedUnit
      case 'group':
        return selectedUsers.length > 0 || selectedUnits.length > 0
      default:
        return false
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Nova Sala
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Criar Nova Sala de Chat
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Nome da Sala */}
          <div>
            <Label htmlFor="name">Nome da Sala *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
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
                    id="image-upload"
                  />
                  <Label
                    htmlFor="image-upload"
                    className="inline-block mt-2 px-4 py-2 bg-primary text-primary-foreground rounded cursor-pointer hover:bg-primary/90"
                  >
                    Selecionar Imagem
                  </Label>
                </div>
              )}
            </div>
          </div>

          {/* Tipo de Sala */}
          <div className="space-y-4">
            <Label>Tipo de Sala</Label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                type="button"
                onClick={() => setRoomType('private')}
                className={`p-4 border rounded-lg text-left transition-colors ${
                  roomType === 'private' 
                    ? 'border-primary bg-primary/10' 
                    : 'border-border hover:bg-muted'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <MessageCircle className="h-5 w-5" />
                  <span className="font-medium">Conversa Privada</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Conversa direta entre usuários específicos
                </p>
              </button>

              <button
                type="button"
                onClick={() => setRoomType('unit')}
                className={`p-4 border rounded-lg text-left transition-colors ${
                  roomType === 'unit' 
                    ? 'border-primary bg-primary/10' 
                    : 'border-border hover:bg-muted'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Building2 className="h-5 w-5" />
                  <span className="font-medium">Sala de Unidade</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Incluir todos os usuários de uma unidade
                </p>
              </button>

              <button
                type="button"
                onClick={() => setRoomType('group')}
                className={`p-4 border rounded-lg text-left transition-colors ${
                  roomType === 'group' 
                    ? 'border-primary bg-primary/10' 
                    : 'border-border hover:bg-muted'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Globe className="h-5 w-5" />
                  <span className="font-medium">Grupo Personalizado</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Escolher unidades e participantes específicos
                </p>
              </button>
            </div>
          </div>

          {/* Configuração por Tipo */}
          {roomType === 'unit' && (
            <div>
              <Label htmlFor="unit">Selecionar Unidade *</Label>
              <Select value={selectedUnit} onValueChange={setSelectedUnit}>
                <SelectTrigger>
                  <SelectValue placeholder="Escolha uma unidade..." />
                </SelectTrigger>
                <SelectContent>
                  {units.map((unit) => (
                    <SelectItem key={unit.id} value={unit.id}>
                      {unit.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {roomType === 'group' && (
            <div className="space-y-4">
              {/* Seleção de Unidades */}
              <div>
                <Label>Unidades (opcional)</Label>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {units.map((unit) => (
                    <div key={unit.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`unit-${unit.id}`}
                        checked={selectedUnits.includes(unit.id)}
                        onCheckedChange={() => handleUnitToggle(unit.id)}
                      />
                      <Label 
                        htmlFor={`unit-${unit.id}`} 
                        className="text-sm font-normal cursor-pointer"
                      >
                        {unit.name}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Seleção de Participantes */}
          {(roomType === 'private' || roomType === 'group') && (
            <div>
              <Label>Participantes *</Label>
              <div className="mt-2 max-h-60 overflow-y-auto border rounded-lg p-4 space-y-2">
                {filteredProfiles.length === 0 ? (
                  <p className="text-muted-foreground text-sm">
                    {roomType === 'group' && selectedUnits.length === 0 
                      ? 'Selecione unidades para filtrar usuários ou deixe em branco para ver todos'
                      : 'Nenhum usuário encontrado'
                    }
                  </p>
                ) : (
                  filteredProfiles.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center gap-3 p-2 rounded hover:bg-muted"
                    >
                      <Checkbox
                        id={`user-${user.id}`}
                        checked={selectedUsers.includes(user.id)}
                        onCheckedChange={() => handleUserToggle(user.id)}
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
                  ))
                )}
              </div>
            </div>
          )}

          {/* Botões */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={!isFormValid() || isLoading || createChatRoom.isPending}
            >
              {isLoading || createChatRoom.isPending ? 'Criando...' : 'Criar Sala'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
