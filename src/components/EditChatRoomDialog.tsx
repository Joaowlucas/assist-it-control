
import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'
import { ChatRoom, useChatParticipants, useUpdateChatRoom } from '@/hooks/useChat'
import { useUnits } from '@/hooks/useUnits'
import { useProfiles } from '@/hooks/useProfiles'

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
    unitId: 'general',
    participants: [] as string[],
  })

  useEffect(() => {
    if (room && participants) {
      setFormData({
        name: room.name,
        unitId: room.unit_id || 'general',
        participants: participants.map(p => p.user_id),
      })
    }
  }, [room, participants])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!room || !formData.name.trim()) return

    await updateRoom.mutateAsync({
      roomId: room.id,
      name: formData.name,
      unitId: formData.unitId === 'general' ? undefined : formData.unitId,
      participants: formData.participants,
    })
    
    onOpenChange(false)
  }

  const handleParticipantToggle = (userId: string) => {
    setFormData(prev => ({
      ...prev,
      participants: prev.participants.includes(userId)
        ? prev.participants.filter(id => id !== userId)
        : [...prev.participants, userId]
    }))
  }

  const availableUsers = profiles?.filter(p => 
    formData.unitId === 'general' ? true : p.unit_id === formData.unitId
  )

  if (!room) return null

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Editar Sala de Chat</DialogTitle>
          <DialogDescription>
            Modifique as configurações da sala de chat
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Nome da Sala</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Ex: Chat Geral, Suporte Técnico..."
              required
            />
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
              <div className="border rounded-md p-3 max-h-40 overflow-y-auto">
                <div className="space-y-2">
                  {availableUsers.map((user) => (
                    <div key={user.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`user-${user.id}`}
                        checked={formData.participants.includes(user.id)}
                        onChange={() => handleParticipantToggle(user.id)}
                        className="rounded"
                      />
                      <label 
                        htmlFor={`user-${user.id}`}
                        className="text-sm font-medium flex-1 cursor-pointer"
                      >
                        {user.name}
                        <span className="text-muted-foreground ml-1">
                          ({user.role})
                        </span>
                      </label>
                    </div>
                  ))}
                </div>
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
