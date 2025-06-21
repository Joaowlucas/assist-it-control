
import React, { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { ChatRoom } from '@/hooks/useChat'
import { useAuth } from '@/hooks/useAuth'
import { 
  Search, 
  UserPlus, 
  MessageSquare, 
  Building2, 
  Users,
  LogOut,
  Crown
} from 'lucide-react'

interface ChatSidebarProps {
  rooms: ChatRoom[]
  selectedRoom: ChatRoom | null
  onRoomSelect: (room: ChatRoom) => void
  onDirectChat: () => void
  onSignOut: () => void
}

export function ChatSidebar({ 
  rooms, 
  selectedRoom, 
  onRoomSelect, 
  onDirectChat,
  onSignOut 
}: ChatSidebarProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedFilter, setSelectedFilter] = useState('all')
  const { profile } = useAuth()

  const filteredRooms = rooms.filter(room => {
    const matchesSearch = room.name.toLowerCase().includes(searchTerm.toLowerCase())
    
    if (selectedFilter === 'all') return matchesSearch
    if (selectedFilter === 'private') return matchesSearch && room.type === 'private'
    if (selectedFilter === 'unit') return matchesSearch && room.type === 'unit'
    if (selectedFilter === 'group') return matchesSearch && room.type === 'group'
    
    return matchesSearch
  })

  const getRoomIcon = (room: ChatRoom) => {
    switch (room.type) {
      case 'private':
        return <MessageSquare className="h-4 w-4" />
      case 'unit':
        return <Building2 className="h-4 w-4" />
      case 'group':
        return <Users className="h-4 w-4" />
      default:
        return <MessageSquare className="h-4 w-4" />
    }
  }

  const getRoomTypeBadge = (room: ChatRoom) => {
    const colors = {
      private: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
      unit: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
      group: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
    }
    
    return colors[room.type] || 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
  }

  return (
    <div className="w-80 border-r border-border flex flex-col bg-background">
      {/* User Profile Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={profile?.avatar_url || undefined} />
              <AvatarFallback>
                {profile?.name?.charAt(0).toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium">{profile?.name}</span>
                {profile?.role === 'admin' && (
                  <Crown className="h-4 w-4 text-yellow-500" />
                )}
              </div>
              <span className="text-sm text-muted-foreground">
                {profile?.role === 'admin' ? 'Administrador' : 
                 profile?.role === 'technician' ? 'Técnico' : 'Usuário'}
              </span>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onSignOut}>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            type="search"
            placeholder="Buscar conversas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Filters */}
      <div className="p-4 space-y-3">
        <div className="text-sm font-medium">Filtros</div>
        <div className="flex flex-wrap gap-2">
          <Badge
            variant={selectedFilter === "all" ? "default" : "secondary"}
            onClick={() => setSelectedFilter("all")}
            className="cursor-pointer"
          >
            Todas
          </Badge>
          <Badge
            variant={selectedFilter === "private" ? "default" : "secondary"}
            onClick={() => setSelectedFilter("private")}
            className="cursor-pointer"
          >
            Privadas
          </Badge>
          <Badge
            variant={selectedFilter === "unit" ? "default" : "secondary"}
            onClick={() => setSelectedFilter("unit")}
            className="cursor-pointer"
          >
            Unidades
          </Badge>
          <Badge
            variant={selectedFilter === "group" ? "default" : "secondary"}
            onClick={() => setSelectedFilter("group")}
            className="cursor-pointer"
          >
            Grupos
          </Badge>
        </div>
      </div>

      <Separator />

      {/* Room List */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-2">
          <div className="text-sm font-medium mb-3">
            Conversas ({filteredRooms.length})
          </div>
          
          {filteredRooms.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-sm">
                {searchTerm ? 'Nenhuma conversa encontrada' : 'Nenhuma conversa disponível'}
              </p>
              <p className="text-xs mt-2">
                Use o botão "Chat Direto" para iniciar uma conversa
              </p>
            </div>
          ) : (
            filteredRooms.map((room) => (
              <div
                key={room.id}
                className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors hover:bg-muted/50 ${
                  selectedRoom?.id === room.id ? 'bg-muted' : ''
                }`}
                onClick={() => onRoomSelect(room)}
              >
                <Avatar className="h-12 w-12">
                  <AvatarImage src={room.image_url || undefined} />
                  <AvatarFallback className="bg-muted">
                    {getRoomIcon(room)}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium truncate">{room.name}</h4>
                    {room.created_by === profile?.id && (
                      <Crown className="h-3 w-3 text-yellow-500" />
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge className={`${getRoomTypeBadge(room)} text-xs`}>
                      {getRoomIcon(room)}
                    </Badge>
                    
                    {room.last_message && (
                      <span className="text-xs text-muted-foreground truncate">
                        {room.last_message.content || 'Anexo'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      <Separator />

      {/* Action Button - Only Chat Direto */}
      <div className="p-4">
        <Button 
          variant="outline" 
          className="w-full justify-start" 
          onClick={onDirectChat}
        >
          <UserPlus className="h-4 w-4 mr-2" />
          Chat Direto
        </Button>
      </div>
    </div>
  )
}
