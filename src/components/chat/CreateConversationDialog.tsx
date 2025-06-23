
import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuth } from "@/hooks/useAuth"
import { useAvailableUsers } from "@/hooks/useAvailableUsers"
import { useCreateConversation } from "@/hooks/useCreateConversation"
import { toast } from "@/hooks/use-toast"

interface CreateConversationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateConversationDialog({ open, onOpenChange }: CreateConversationDialogProps) {
  const [type, setType] = useState<'direct' | 'group'>('direct')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  
  const { profile } = useAuth()
  const { users, loading: loadingUsers } = useAvailableUsers()
  const { createConversation, loading } = useCreateConversation()

  const handleSubmit = async () => {
    console.log('Creating conversation with:', {
      type,
      name,
      selectedUsers,
      profileUnitId: profile?.unit_id
    })

    // Validações
    if (type === 'direct' && selectedUsers.length !== 1) {
      toast({
        title: "Erro",
        description: "Selecione exatamente um usuário para conversa direta.",
        variant: "destructive"
      })
      return
    }

    if (type === 'group' && (!name.trim() || selectedUsers.length === 0)) {
      toast({
        title: "Erro", 
        description: "Preencha o nome do grupo e selecione pelo menos um participante.",
        variant: "destructive"
      })
      return
    }

    if (!profile?.unit_id) {
      toast({
        title: "Erro",
        description: "Usuário não possui unidade definida.",
        variant: "destructive"
      })
      return
    }

    try {
      console.log('Calling createConversation...')
      
      await createConversation({
        type,
        name: type === 'group' ? name : undefined,
        description: type === 'group' ? description : undefined,
        participantIds: selectedUsers,
        unitId: profile.unit_id
      })

      console.log('Conversation created, closing dialog...')
      onOpenChange(false)
      resetForm()
      
    } catch (error) {
      console.error('Failed to create conversation:', error)
      // O toast de erro já é mostrado pelo hook useCreateConversation
    }
  }

  const resetForm = () => {
    setType('direct')
    setName('')
    setDescription('')
    setSelectedUsers([])
  }

  const toggleUser = (userId: string) => {
    console.log('Toggling user:', userId, 'Current selection:', selectedUsers)
    
    if (type === 'direct') {
      setSelectedUsers([userId])
    } else {
      setSelectedUsers(prev => 
        prev.includes(userId) 
          ? prev.filter(id => id !== userId)
          : [...prev, userId]
      )
    }
  }

  // Filtrar usuários da mesma unidade (exceto admins que podem ver todos)
  const availableUsers = users.filter(user => {
    // Não mostrar o próprio usuário
    if (user.id === profile?.id) return false
    
    // Admin pode conversar com qualquer um
    if (profile?.role === 'admin') return true
    
    // Usuários comuns só podem conversar com pessoas da mesma unidade
    return user.unit_id === profile?.unit_id
  })

  console.log('Available users:', availableUsers)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nova Conversa</DialogTitle>
          <DialogDescription>
            Crie uma nova conversa direta ou grupo
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Tipo de Conversa</Label>
            <RadioGroup value={type} onValueChange={(value: 'direct' | 'group') => setType(value)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="direct" id="direct" />
                <Label htmlFor="direct">Conversa Direta</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="group" id="group" />
                <Label htmlFor="group">Grupo</Label>
              </div>
            </RadioGroup>
          </div>

          {type === 'group' && (
            <>
              <div>
                <Label htmlFor="name">Nome do Grupo</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Digite o nome do grupo"
                />
              </div>

              <div>
                <Label htmlFor="description">Descrição (opcional)</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Digite uma descrição para o grupo"
                  rows={2}
                />
              </div>
            </>
          )}

          <div>
            <Label>
              {type === 'direct' ? 'Selecione um usuário' : 'Selecione os participantes'}
            </Label>
            <div className="max-h-48 overflow-y-auto space-y-2 mt-2">
              {loadingUsers ? (
                <div className="text-center py-4">Carregando usuários...</div>
              ) : availableUsers.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">
                  Nenhum usuário disponível para conversa
                </div>
              ) : (
                availableUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center space-x-3 p-2 rounded hover:bg-accent cursor-pointer"
                    onClick={() => toggleUser(user.id)}
                  >
                    <Checkbox
                      checked={selectedUsers.includes(user.id)}
                      onChange={() => toggleUser(user.id)}
                    />
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.avatar_url} />
                      <AvatarFallback>
                        {user.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="font-medium">{user.name}</div>
                      <div className="text-sm text-muted-foreground">{user.email}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? 'Criando...' : 'Criar Conversa'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
