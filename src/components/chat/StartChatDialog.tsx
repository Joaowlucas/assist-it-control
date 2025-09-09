import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/hooks/useAuth'
import { useConversations } from '@/hooks/useConversations'
import { useAvailableUsers } from '@/hooks/useAvailableUsers'
import { useToast } from '@/components/ui/use-toast'
import { Search, Users, User } from 'lucide-react'

interface StartChatDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConversationCreated: (conversationId: string) => void
}

export function StartChatDialog({ open, onOpenChange, onConversationCreated }: StartChatDialogProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [groupName, setGroupName] = useState('')
  const [chatType, setChatType] = useState<'direct' | 'group'>('direct')
  const [loading, setLoading] = useState(false)
  
  const { profile } = useAuth()
  const { createConversation } = useConversations()
  const { data: availableUsers = [] } = useAvailableUsers()
  const { toast } = useToast()

  // Filtrar usuários disponíveis (excluir o próprio usuário)
  const filteredUsers = availableUsers
    .filter(user => user.id !== profile?.id)
    .filter(user => 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    )

  const handleUserToggle = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    )
  }

  const handleCreateConversation = async () => {
    if (selectedUsers.length === 0) {
      toast({
        title: "Erro",
        description: "Selecione pelo menos um usuário",
        variant: "destructive",
      })
      return
    }

    if (chatType === 'group' && !groupName.trim()) {
      toast({
        title: "Erro", 
        description: "Digite um nome para o grupo",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const conversationId = await createConversation(
        selectedUsers,
        chatType === 'group' ? groupName.trim() : undefined,
        chatType
      )
      
      onConversationCreated(conversationId)
      
      // Reset form
      setSelectedUsers([])
      setGroupName('')
      setSearchTerm('')
      setChatType('direct')
      
      toast({
        title: "Sucesso",
        description: "Conversa criada com sucesso",
      })
    } catch (error) {
      console.error('Error creating conversation:', error)
    } finally {
      setLoading(false)
    }
  }

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin': return 'destructive'
      case 'technician': return 'default'
      default: return 'secondary'
    }
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin': return 'Admin'
      case 'technician': return 'Técnico'
      default: return 'Usuário'
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nova Conversa</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Tipo de conversa */}
          <div className="space-y-3">
            <Label>Tipo de conversa</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={chatType === 'direct' ? 'default' : 'outline'}
                onClick={() => setChatType('direct')}
                className="flex-1 gap-2"
              >
                <User className="h-4 w-4" />
                Conversa Direta
              </Button>
              <Button
                type="button"
                variant={chatType === 'group' ? 'default' : 'outline'}
                onClick={() => setChatType('group')}
                className="flex-1 gap-2"
              >
                <Users className="h-4 w-4" />
                Grupo
              </Button>
            </div>
          </div>

          {/* Nome do grupo (se aplicável) */}
          {chatType === 'group' && (
            <div className="space-y-2">
              <Label>Nome do grupo</Label>
              <Input
                placeholder="Digite o nome do grupo..."
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
              />
            </div>
          )}

          {/* Pesquisar usuários */}
          <div className="space-y-2">
            <Label>
              {chatType === 'direct' ? 'Selecionar usuário' : 'Selecionar participantes'}
            </Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Digite o nome ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Lista de usuários */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>
                Usuários disponíveis ({filteredUsers.length})
                {chatType === 'direct' && selectedUsers.length > 0 && (
                  <span className="text-xs text-muted-foreground ml-2">
                    (máximo 1 para conversa direta)
                  </span>
                )}
              </Label>
              {selectedUsers.length > 0 && (
                <Badge variant="outline">
                  {selectedUsers.length} selecionado{selectedUsers.length > 1 ? 's' : ''}
                </Badge>
              )}
            </div>
            
            <ScrollArea className="h-64 border rounded-md p-2">
              {filteredUsers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-8 w-8 mx-auto mb-2" />
                  <p>Nenhum usuário encontrado</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredUsers.map((user) => {
                    const isSelected = selectedUsers.includes(user.id)
                    const isDisabledDirect = chatType === 'direct' && selectedUsers.length > 0 && !isSelected
                    
                    return (
                      <div
                        key={user.id}
                        className={`flex items-center space-x-3 p-2 rounded-md cursor-pointer transition-colors ${
                          isDisabledDirect 
                            ? 'opacity-50 cursor-not-allowed' 
                            : 'hover:bg-muted/50'
                        }`}
                        onClick={() => !isDisabledDirect && handleUserToggle(user.id)}
                      >
                        <Checkbox
                          checked={isSelected}
                          disabled={isDisabledDirect}
                          onChange={() => !isDisabledDirect && handleUserToggle(user.id)}
                        />
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={user.avatar_url} />
                          <AvatarFallback>
                            {user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {user.name}
                          </p>
                          <div className="flex items-center gap-2">
                            <p className="text-xs text-muted-foreground truncate">
                              {user.email}
                            </p>
                            <Badge 
                              variant={getRoleBadgeVariant(user.role)}
                              className="text-xs"
                            >
                              {getRoleLabel(user.role)}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Resumo da seleção */}
          {selectedUsers.length > 0 && (
            <div className="p-3 bg-muted/20 rounded-md">
              <div className="flex items-center gap-2 mb-2">
                {chatType === 'group' ? (
                  <Users className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <User className="h-4 w-4 text-muted-foreground" />
                )}
                <span className="text-sm font-medium">
                  {chatType === 'group' ? 'Grupo' : 'Conversa direta'}
                  {chatType === 'group' && groupName && `: ${groupName}`}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                {selectedUsers.length === 1 
                  ? '1 participante selecionado' 
                  : `${selectedUsers.length} participantes selecionados`}
              </p>
            </div>
          )}

          {/* Botões */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCreateConversation}
              disabled={selectedUsers.length === 0 || loading}
            >
              {loading ? 'Criando...' : 'Criar Conversa'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}