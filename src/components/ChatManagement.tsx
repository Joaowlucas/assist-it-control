
import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Plus, Pencil, Trash2, MessageCircle, Search, Users, Building2 } from 'lucide-react'
import { useChatRooms, useDeleteChatRoom } from '@/hooks/useChat'
import { useUnits } from '@/hooks/useUnits'
import { useAuth } from '@/hooks/useAuth'
import { EditChatRoomDialog } from '@/components/EditChatRoomDialog'
import { ConfirmDeleteDialog } from '@/components/ConfirmDeleteDialog'
import { StartChatDialog } from '@/components/StartChatDialog'

export function ChatManagement() {
  const { profile } = useAuth()
  const { data: chatRooms = [], isLoading } = useChatRooms()
  const { data: units = [] } = useUnits()
  const deleteChatRoom = useDeleteChatRoom()
  
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [selectedRoom, setSelectedRoom] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean
    roomId: string | null
    roomName: string
  }>({
    open: false,
    roomId: null,
    roomName: ''
  })

  const filteredRooms = chatRooms.filter(room =>
    room.name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleEditRoom = (room: any) => {
    setSelectedRoom(room)
    setEditDialogOpen(true)
  }

  const handleDeleteRoom = (roomId: string, roomName: string) => {
    setDeleteDialog({
      open: true,
      roomId,
      roomName
    })
  }

  const confirmDelete = async () => {
    if (deleteDialog.roomId) {
      try {
        await deleteChatRoom.mutateAsync(deleteDialog.roomId)
        setDeleteDialog({ open: false, roomId: null, roomName: '' })
      } catch (error) {
        console.error('Error deleting chat room:', error)
      }
    }
  }

  const canManageRoom = (room: any) => {
    return profile?.role === 'admin' || room.created_by === profile?.id
  }

  const getRoomType = (room: any) => {
    if (room.unit_id) {
      const unit = units.find(u => u.id === room.unit_id)
      return unit ? unit.name : 'Unidade específica'
    }
    return 'Geral'
  }

  const getRoomTypeColor = (room: any) => {
    if (room.unit_id) {
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
    }
    return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
  }

  const stats = [
    {
      title: "Total de Salas",
      value: chatRooms.length,
      icon: MessageCircle,
      color: "text-blue-500"
    },
    {
      title: "Salas Gerais",
      value: chatRooms.filter(r => !r.unit_id).length,
      icon: Users,
      color: "text-green-500"
    },
    {
      title: "Salas por Unidade",
      value: chatRooms.filter(r => r.unit_id).length,
      icon: Building2,
      color: "text-orange-500"
    },
    {
      title: "Minhas Salas",
      value: chatRooms.filter(r => r.created_by === profile?.id).length,
      icon: MessageCircle,
      color: "text-purple-500"
    }
  ]

  if (isLoading) {
    return <div className="flex justify-center p-4">Carregando salas de chat...</div>
  }

  return (
    <>
      {/* Cards de Estatísticas */}
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <Card key={index}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {stat.title}
                    </p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                  </div>
                  <Icon className={`h-8 w-8 ${stat.color}`} />
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Gerenciamento de Chat
            </CardTitle>
            <CardDescription>
              Gerencie salas de chat e conversas do sistema
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <StartChatDialog />
            {profile?.role === 'admin' && (
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nova Sala
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {/* Barra de Pesquisa */}
          <div className="flex items-center space-x-2 mb-4">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar salas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Sala</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Criador</TableHead>
                <TableHead>Participantes</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRooms.map((room) => (
                <TableRow key={room.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback>
                          <MessageCircle className="h-5 w-5" />
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{room.name}</div>
                        <div className="text-sm text-muted-foreground">
                          Criada em {new Date(room.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getRoomTypeColor(room)}>
                      {room.unit_id ? <Building2 className="h-3 w-3 mr-1" /> : <Users className="h-3 w-3 mr-1" />}
                      {getRoomType(room)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {room.profiles?.name || 'Desconhecido'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {room.participants?.length || 0} participantes
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {canManageRoom(room) && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditRoom(room)}
                            title="Editar sala"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteRoom(room.id, room.name)}
                            title="Excluir sala"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {filteredRooms.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>{searchTerm ? 'Nenhuma sala encontrada para a busca' : 'Nenhuma sala encontrada'}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <EditChatRoomDialog
        isOpen={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        room={selectedRoom}
      />

      <ConfirmDeleteDialog
        open={deleteDialog.open}
        title="Confirmar Exclusão"
        description={`Tem certeza que deseja excluir a sala "${deleteDialog.roomName}"? Esta ação não pode ser desfeita.`}
        onConfirm={confirmDelete}
        onOpenChange={(open) => setDeleteDialog({ open: false, roomId: null, roomName: '' })}
      />
    </>
  )
}
