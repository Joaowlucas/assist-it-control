
import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Trash2, Plus, MessageCircle, Users, Settings } from 'lucide-react'
import { useChatRooms, useCreateChatRoom, useDeleteChatRoom } from '@/hooks/useChat'
import { useUnits } from '@/hooks/useUnits'
import { useProfiles } from '@/hooks/useProfiles'
import { useToast } from '@/hooks/use-toast'

export function ChatManagement() {
  const { toast } = useToast()
  const { data: rooms, isLoading: roomsLoading } = useChatRooms()
  const { data: units } = useUnits()
  const { data: profiles } = useProfiles()
  const createRoom = useCreateChatRoom()
  const deleteRoom = useDeleteChatRoom()
  
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    unitId: '',
    participants: [] as string[],
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      toast({
        title: 'Nome obrigatório',
        description: 'Digite um nome para a sala de chat.',
        variant: 'destructive',
      })
      return
    }

    try {
      await createRoom.mutateAsync({
        name: formData.name,
        unitId: formData.unitId || undefined,
        participants: formData.participants,
      })
      
      setFormData({ name: '', unitId: '', participants: [] })
      setIsDialogOpen(false)
    } catch (error) {
      console.error('Erro ao criar sala:', error)
    }
  }

  const handleDeleteRoom = (roomId: string, roomName: string) => {
    if (confirm(`Tem certeza que deseja excluir a sala "${roomName}"?`)) {
      deleteRoom.mutate(roomId)
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

  const availableUsers = profiles?.filter(p => 
    formData.unitId ? p.unit_id === formData.unitId : true
  )

  if (roomsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <MessageCircle className="h-8 w-8 animate-pulse mx-auto mb-2" />
          <p>Carregando salas de chat...</p>
        </div>
      </div>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Gerenciamento de Chat
          </CardTitle>
          <CardDescription>
            Gerencie salas de chat, participantes e configurações
          </CardDescription>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nova Sala
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Criar Nova Sala de Chat</DialogTitle>
              <DialogDescription>
                Configure uma nova sala de chat para sua equipe
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
                <Label htmlFor="unit">Unidade (Opcional)</Label>
                <Select 
                  value={formData.unitId} 
                  onValueChange={(value) => setFormData(prev => ({ 
                    ...prev, 
                    unitId: value,
                    participants: [] // Reset participantes quando mudar unidade
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma unidade ou deixe em branco para chat geral" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Chat Geral (Todas as unidades)</SelectItem>
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
                <div className="border rounded-md p-3 max-h-40 overflow-y-auto">
                  {availableUsers?.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Nenhum usuário disponível
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {availableUsers?.map((user) => (
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
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={createRoom.isPending}
                >
                  {createRoom.isPending ? 'Criando...' : 'Criar Sala'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome da Sala</TableHead>
              <TableHead>Unidade</TableHead>
              <TableHead>Criado por</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rooms?.map((room) => (
              <TableRow key={room.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <MessageCircle className="h-4 w-4" />
                    {room.name}
                  </div>
                </TableCell>
                <TableCell>
                  {room.units?.name || (
                    <Badge variant="secondary">
                      Chat Geral
                    </Badge>
                  )}
                </TableCell>
                <TableCell>{room.profiles?.name}</TableCell>
                <TableCell>
                  <Badge variant={room.is_active ? "default" : "secondary"}>
                    {room.is_active ? "Ativo" : "Inativo"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteRoom(room.id, room.name)}
                    disabled={deleteRoom.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {(!rooms || rooms.length === 0) && (
          <div className="text-center py-8 text-muted-foreground">
            <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Nenhuma sala de chat criada ainda</p>
            <p className="text-sm">Clique em "Nova Sala" para começar</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
