
import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Pencil, Trash2, MessageCircle, Search, Users, Building2 } from 'lucide-react'
import { useConversations, useDeleteConversation } from '@/hooks/useConversations'
import { useAuth } from '@/hooks/useAuth'
import { NewChatModal } from '@/components/NewChatModal'

export function ChatManagement() {
  const { profile } = useAuth()
  const { data: chatRooms = [], isLoading } = useConversations()
  const deleteConversation = useDeleteConversation()
  
  const [searchTerm, setSearchTerm] = useState('')

  const filteredRooms = chatRooms.filter(room =>
    room.name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleDeleteRoom = async (roomId: string) => {
    try {
      await deleteConversation.mutateAsync(roomId)
    } catch (error) {
      console.error('Error deleting chat room:', error)
    }
  }

  const canManageRoom = (room: any) => {
    return profile?.role === 'admin' || room.created_by === profile?.id
  }

  const stats = [
    {
      title: "Total de Conversas",
      value: chatRooms.length,
      icon: MessageCircle,
      color: "text-blue-500"
    },
    {
      title: "Conversas Privadas",
      value: chatRooms.filter(r => r.type === 'private').length,
      icon: Users,
      color: "text-green-500"
    },
    {
      title: "Minhas Conversas",
      value: chatRooms.filter(r => r.created_by === profile?.id).length,
      icon: MessageCircle,
      color: "text-purple-500"
    }
  ]

  if (isLoading) {
    return <div className="flex justify-center p-4">Carregando conversas...</div>
  }

  return (
    <>
      {/* Cards de Estatísticas */}
      <div className="grid gap-4 md:grid-cols-3 mb-6">
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
              Gerencie conversas do sistema
            </CardDescription>
          </div>
          <div className="flex gap-2">
            {profile?.role === 'admin' && (
              <NewChatModal />
            )}
          </div>
        </CardHeader>
        <CardContent>
          {/* Barra de Pesquisa */}
          <div className="flex items-center space-x-2 mb-4">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar conversas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Conversa</TableHead>
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
                    <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                      <MessageCircle className="h-3 w-3 mr-1" />
                      Privada
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      Usuário
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
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteRoom(room.id)}
                          title="Excluir conversa"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
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
              <p>{searchTerm ? 'Nenhuma conversa encontrada para a busca' : 'Nenhuma conversa encontrada'}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  )
}
