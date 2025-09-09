import { useState } from 'react'
import { Plus, X, UserCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useBoardParticipants, useAddParticipant, useRemoveParticipant, useUpdateParticipantRole } from '@/hooks/useKanbanParticipants'
import { useAvailableUsers } from '@/hooks/useAvailableUsers'

interface ManageParticipantsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  boardId: string
  isOwner: boolean
}

export function ManageParticipantsDialog({ open, onOpenChange, boardId, isOwner }: ManageParticipantsDialogProps) {
  const { data: participants } = useBoardParticipants(boardId)
  const { data: availableUsers } = useAvailableUsers()
  const addParticipant = useAddParticipant()
  const removeParticipant = useRemoveParticipant()
  const updateRole = useUpdateParticipantRole()
  
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedUserId, setSelectedUserId] = useState('')

  const participantIds = participants?.map(p => p.user_id) || []
  const filteredUsers = availableUsers?.filter(user => 
    !participantIds.includes(user.id) &&
    user.name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || []

  const handleAddParticipant = async () => {
    if (!selectedUserId) return
    
    try {
      await addParticipant.mutateAsync({
        board_id: boardId,
        user_id: selectedUserId,
        role: 'member'
      })
      setSelectedUserId('')
      setSearchTerm('')
    } catch (error) {
      console.error('Erro ao adicionar participante:', error)
    }
  }

  const handleRemoveParticipant = async (participantId: string) => {
    try {
      await removeParticipant.mutateAsync({
        id: participantId,
        board_id: boardId
      })
    } catch (error) {
      console.error('Erro ao remover participante:', error)
    }
  }

  const handleUpdateRole = async (participantId: string, newRole: 'member' | 'editor' | 'admin') => {
    try {
      await updateRole.mutateAsync({
        id: participantId,
        board_id: boardId,
        role: newRole
      })
    } catch (error) {
      console.error('Erro ao atualizar papel:', error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Gerenciar Participantes</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {isOwner && (
            <div className="space-y-3">
              <h4 className="font-medium">Adicionar Participante</h4>
              <div className="flex space-x-2">
                <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Selecionar usuário" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredUsers.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        <div className="flex items-center space-x-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={user.avatar_url} />
                            <AvatarFallback className="text-xs">
                              {user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span>{user.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button 
                  onClick={handleAddParticipant}
                  disabled={!selectedUserId || addParticipant.isPending}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          <div className="space-y-3">
            <h4 className="font-medium">Participantes ({participants?.length || 0})</h4>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {participants?.map((participant) => (
                <div key={participant.id} className="flex items-center justify-between p-2 border rounded">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={participant.profiles.avatar_url} />
                      <AvatarFallback className="text-xs">
                        {participant.profiles.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm">{participant.profiles.name}</p>
                      <p className="text-xs text-muted-foreground">{participant.profiles.email}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {isOwner ? (
                      <Select 
                        value={participant.role} 
                        onValueChange={(role: 'member' | 'editor' | 'admin') => 
                          handleUpdateRole(participant.id, role)
                        }
                      >
                        <SelectTrigger className="w-24">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="member">Membro</SelectItem>
                          <SelectItem value="editor">Editor</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge variant="secondary">
                        {participant.role === 'member' ? 'Membro' : 
                         participant.role === 'editor' ? 'Editor' : 'Admin'}
                      </Badge>
                    )}
                    
                    {isOwner && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveParticipant(participant.id)}
                        disabled={removeParticipant.isPending}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
              
              {(!participants || participants.length === 0) && (
                <div className="text-center text-muted-foreground py-4">
                  <UserCheck className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Nenhum participante ainda</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <Button onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}