
import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { useUnits } from '@/hooks/useUnits'
import { useProfiles } from '@/hooks/useProfiles'
import { useCreateChatRoom } from '@/hooks/useChat'
import { useAuth } from '@/hooks/useAuth'

interface CreateChatRoomDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateChatRoomDialog({ open, onOpenChange }: CreateChatRoomDialogProps) {
  const [name, setName] = useState('')
  const [selectedUnit, setSelectedUnit] = useState('')
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  
  const { profile } = useAuth()
  const { data: units } = useUnits()
  const { data: profiles } = useProfiles()
  const createRoom = useCreateChatRoom()

  // Filter users based on selected unit and current user role
  const availableUsers = profiles?.filter(user => {
    if (profile?.role === 'admin') {
      // Admin can see all users from selected unit
      return selectedUnit ? user.unit_id === selectedUnit : true
    } else {
      // Technicians can only see users from units they have access to
      return user.unit_id === profile?.unit_id
    }
  }) || []

  const handleSubmit = async () => {
    if (!name.trim() || !selectedUnit || selectedUsers.length === 0) return

    try {
      // Add current user to participants
      const allParticipants = [...selectedUsers, profile?.id].filter(Boolean) as string[]
      
      await createRoom.mutateAsync({
        name: name.trim(),
        unitId: selectedUnit,
        userIds: allParticipants
      })

      // Reset form
      setName('')
      setSelectedUnit('')
      setSelectedUsers([])
      onOpenChange(false)
    } catch (error) {
      console.error('Error creating chat room:', error)
    }
  }

  const handleUserToggle = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    )
  }

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setName('')
      setSelectedUnit('')
      setSelectedUsers([])
    }
  }, [open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Criar Sala de Chat</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="room-name">Nome da Sala</Label>
            <Input
              id="room-name"
              placeholder="Digite o nome da sala..."
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="unit-select">Unidade</Label>
            <Select value={selectedUnit} onValueChange={setSelectedUnit}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma unidade" />
              </SelectTrigger>
              <SelectContent>
                {units?.map((unit) => (
                  <SelectItem key={unit.id} value={unit.id}>
                    {unit.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedUnit && (
            <div>
              <Label>Participantes</Label>
              <div className="max-h-48 overflow-y-auto border rounded-md p-2 space-y-2">
                {availableUsers.map((user) => (
                  <div key={user.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={user.id}
                      checked={selectedUsers.includes(user.id)}
                      onCheckedChange={() => handleUserToggle(user.id)}
                    />
                    <Label htmlFor={user.id} className="flex-1 text-sm">
                      {user.name} ({user.email})
                    </Label>
                  </div>
                ))}
              </div>
              {availableUsers.length === 0 && (
                <p className="text-sm text-muted-foreground mt-2">
                  Nenhum usuário disponível para esta unidade
                </p>
              )}
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <Button
              onClick={handleSubmit}
              disabled={!name.trim() || !selectedUnit || selectedUsers.length === 0 || createRoom.isPending}
              className="flex-1"
            >
              {createRoom.isPending ? 'Criando...' : 'Criar Sala'}
            </Button>
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={createRoom.isPending}
            >
              Cancelar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
