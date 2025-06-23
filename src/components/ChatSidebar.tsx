
import React, { useState } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { 
  MessageCircle, 
  Search, 
  Settings, 
  LogOut, 
  Users, 
  Building2, 
  Shield,
  Filter,
  Plus
} from 'lucide-react'
import { NewChatModal } from '@/components/NewChatModal'
import { useAuth } from '@/hooks/useAuth'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface ChatRoom {
  id: string
  name: string
  type: string
  created_at: string
  participants?: Array<{
    user_id: string
    profiles: {
      name: string
      avatar_url?: string
    }
  }>
}

interface ChatSidebarProps {
  rooms: ChatRoom[]
  selectedRoom: ChatRoom | null
  onRoomSelect: (room: ChatRoom) => void
  onCreateRoom: () => void
  onDirectChat: () => void
  onSignOut: () => void
}

type FilterType = 'all' | 'private' | 'unit' | 'group'

export function ChatSidebar({ 
  rooms, 
  selectedRoom, 
  onRoomSelect, 
  onCreateRoom,
  onDirectChat,
  onSignOut 
}: ChatSidebarProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [activeFilter, setActiveFilter] = useState<FilterType>('all')
  const { profile } = useAuth()

  const filteredRooms = rooms.filter(room => {
    const matchesSearch = room.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = activeFilter === 'all' || room.type === activeFilter
    return matchesSearch && matchesFilter
  })

  const getRoomIcon = (room: ChatRoom) => {
    switch (room.type) {
      case 'private':
        return <MessageCircle className="h-4 w-4" />
      case 'unit':
        return <Building2 className="h-4 w-4" />
      case 'group':
        return <Users className="h-4 w-4" />
      default:
        return <MessageCircle className="h-4 w-4" />
    }
  }

  const getRoomTypeLabel = (type: string) => {
    switch (type) {
      case 'private':
        return 'Privada'
      case 'unit':
        return 'Unidade'
      case 'group':
        return 'Grupo'
      default:
        return 'Chat'
    }
  }

  const getRoomTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'private':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
      case 'unit':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
      case 'group':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
    }
  }

  const getFilterCount = (filter: FilterType) => {
    if (filter === 'all') return rooms.length
    return rooms.filter(room => room.type === filter).length
  }

  return (
    <div className="w-80 bg-background border-r border-border flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={profile?.avatar_url || undefined} />
              <AvatarFallback>
                {profile?.name?.charAt(0).toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h2 className="font-semibold truncate">{profile?.name || 'Usuário'}</h2>
              <div className="flex items-center gap-1">
                {profile?.role === 'admin' && <Shield className="h-3 w-3 text-red-500" />}
                {profile?.role === 'technician' && <Settings className="h-3 w-3 text-blue-500" />}
                <span className="text-xs text-muted-foreground capitalize">
                  {profile?.role === 'admin' ? 'Admin' : 
                   profile?.role === 'technician' ? 'Técnico' : 'Usuário'}
                </span>
              </div>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onSignOut}>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar conversas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Action Button */}
        <NewChatModal onConversationCreated={(roomId) => {
          const room = rooms.find(r => r.id === roomId)
          if (room) onRoomSelect(room)
        }} />
      </div>

      {/* Chat List */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {filteredRooms.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="mb-2">
                {searchTerm ? 'Nenhuma conversa encontrada' : 'Nenhuma conversa disponível'}
              </p>
              <p className="text-sm">
                {searchTerm ? 'Tente pesquisar por outro termo' : 'Inicie uma nova conversa!'}
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {filteredRooms.map((room) => (
                <div
                  key={room.id}
                  className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedRoom?.id === room.id 
                      ? 'bg-primary/10 border border-primary/20' 
                      : 'hover:bg-muted/50'
                  }`}
                  onClick={() => onRoomSelect(room)}
                >
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-muted">
                      {getRoomIcon(room)}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-medium truncate">{room.name}</h3>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <Badge 
                          className={`${getRoomTypeBadgeColor(room.type)} text-xs px-1 py-0`}
                        >
                          {getRoomIcon(room)}
                          <span className="ml-1">{getRoomTypeLabel(room.type)}</span>
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
