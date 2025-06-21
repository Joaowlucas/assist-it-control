
import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { 
  MessageCircle, 
  Search, 
  LogOut, 
  Hash,
  Lock,
  Users,
  Building2,
  Settings,
  Shield,
  User as UserIcon,
  Plus,
  UserPlus
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { ChatRoom } from '@/hooks/useChat'
import { format } from 'date-fns'

interface ChatSidebarUnifiedProps {
  rooms: ChatRoom[]
  selectedRoom: ChatRoom | null
  onRoomSelect: (room: ChatRoom) => void
  onDirectChat: () => void
  onCreateGroup?: () => void
  onCreateUnitRoom?: () => void
  onSignOut: () => void
}

export function ChatSidebarUnified({ 
  rooms, 
  selectedRoom, 
  onRoomSelect, 
  onDirectChat,
  onCreateGroup,
  onCreateUnitRoom,
  onSignOut 
}: ChatSidebarUnifiedProps) {
  const { profile } = useAuth()
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState<'all' | 'direct' | 'groups' | 'units'>('all')

  const filteredRooms = rooms.filter(room => {
    const matchesSearch = room.name?.toLowerCase().includes(searchTerm.toLowerCase())
    
    if (activeTab === 'all') return matchesSearch
    if (activeTab === 'direct') return matchesSearch && room.type === 'private'
    if (activeTab === 'groups') return matchesSearch && room.type === 'group'
    if (activeTab === 'units') return matchesSearch && room.type === 'unit'
    
    return matchesSearch
  })

  const getRoomIcon = (room: ChatRoom) => {
    switch (room.type) {
      case 'private':
        return <Lock className="h-4 w-4" />
      case 'unit':
        return <Building2 className="h-4 w-4" />
      case 'group':
        return <Users className="h-4 w-4" />
      default:
        return <Hash className="h-4 w-4" />
    }
  }

  const getRoomTypeColor = (room: ChatRoom) => {
    switch (room.type) {
      case 'private':
        return 'text-blue-500'
      case 'unit':
        return 'text-green-500'
      case 'group':
        return 'text-purple-500'
      default:
        return 'text-gray-500'
    }
  }

  const getUserRoleIcon = (role?: string) => {
    switch (role) {
      case 'admin':
        return <Shield className="h-3 w-3" />
      case 'technician':
        return <Settings className="h-3 w-3" />
      default:
        return <UserIcon className="h-3 w-3" />
    }
  }

  const getUserRoleColor = (role?: string) => {
    switch (role) {
      case 'admin':
        return 'text-red-500'
      case 'technician':
        return 'text-blue-500'
      default:
        return 'text-green-500'
    }
  }

  const directRooms = rooms.filter(r => r.type === 'private')
  const groupRooms = rooms.filter(r => r.type === 'group')
  const unitRooms = rooms.filter(r => r.type === 'unit')

  // Verificar se o usuário pode ver as abas baseado no que tem acesso
  const canSeeGroups = profile?.role === 'admin' || groupRooms.length > 0
  const canSeeUnits = profile?.role === 'admin' || unitRooms.length > 0
  const canCreateGroup = profile?.role === 'admin'
  const canCreateUnitRoom = profile?.role === 'admin'

  return (
    <div className="w-80 bg-background border-r border-border flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-6 w-6 text-primary" />
            <h2 className="font-semibold text-lg">Chat</h2>
          </div>
        </div>
        
        {/* User Info */}
        <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
          <Avatar className="h-10 w-10">
            <AvatarImage src={profile?.avatar_url || undefined} />
            <AvatarFallback>
              {profile?.name?.charAt(0).toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-medium truncate">{profile?.name || 'Usuário'}</p>
              <div className={`${getUserRoleColor(profile?.role)}`}>
                {getUserRoleIcon(profile?.role)}
              </div>
            </div>
            <p className="text-xs text-muted-foreground capitalize">
              {profile?.role === 'admin' ? 'Administrador' : 
               profile?.role === 'technician' ? 'Técnico' : 'Usuário'}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onSignOut}
            className="h-8 w-8 p-0"
            title="Sair"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Actions */}
      <div className="p-4 border-b border-border space-y-2">
        <Button
          onClick={onDirectChat}
          className="w-full flex items-center gap-2"
          variant="default"
        >
          <UserPlus className="h-4 w-4" />
          Chat Direto
        </Button>
        
        {canCreateGroup && onCreateGroup && (
          <Button
            onClick={onCreateGroup}
            className="w-full flex items-center gap-2"
            variant="outline"
          >
            <Users className="h-4 w-4" />
            Criar Grupo
          </Button>
        )}
        
        {canCreateUnitRoom && onCreateUnitRoom && (
          <Button
            onClick={onCreateUnitRoom}
            className="w-full flex items-center gap-2"
            variant="outline"
          >
            <Building2 className="h-4 w-4" />
            Sala de Unidade
          </Button>
        )}
      </div>

      {/* Search */}
      <div className="p-4">
        <div className="relative mb-3">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar conversas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Tabs */}
        <div className="grid grid-cols-2 gap-1 mb-3">
          <Button
            variant={activeTab === 'all' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('all')}
            className="text-xs"
          >
            Todas ({rooms.length})
          </Button>
          <Button
            variant={activeTab === 'direct' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('direct')}
            className="text-xs"
          >
            <Lock className="h-3 w-3 mr-1" />
            Diretas ({directRooms.length})
          </Button>
          {canSeeUnits && (
            <Button
              variant={activeTab === 'units' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('units')}
              className="text-xs"
            >
              <Building2 className="h-3 w-3 mr-1" />
              Unidades ({unitRooms.length})
            </Button>
          )}
          {canSeeGroups && (
            <Button
              variant={activeTab === 'groups' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('groups')}
              className="text-xs"
            >
              <Users className="h-3 w-3 mr-1" />
              Grupos ({groupRooms.length})
            </Button>
          )}
        </div>
      </div>

      {/* Rooms List */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {filteredRooms.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-sm">
                {searchTerm ? 'Nenhuma conversa encontrada' : 'Nenhuma conversa disponível'}
              </p>
              <p className="text-xs mt-2">
                Clique em "Chat Direto" para iniciar uma nova conversa
              </p>
            </div>
          ) : (
            filteredRooms.map((room) => (
              <div
                key={room.id}
                className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors mb-1 ${
                  selectedRoom?.id === room.id
                    ? 'bg-primary/10 border border-primary/20'
                    : 'hover:bg-muted/50'
                }`}
                onClick={() => onRoomSelect(room)}
              >
                <div className={`${getRoomTypeColor(room)}`}>
                  {getRoomIcon(room)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-medium truncate text-sm">{room.name}</p>
                    {room.participants && room.participants.length > 0 && (
                      <span className="text-xs text-muted-foreground ml-2">
                        {room.participants.length}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-1 mt-1">
                    <Badge 
                      variant="secondary" 
                      className="text-xs px-1 py-0"
                    >
                      {room.type === 'private' ? 'Direto' : 
                       room.type === 'unit' ? 'Unidade' : 'Grupo'}
                    </Badge>
                    {room.units?.name && (
                      <span className="text-xs text-muted-foreground">
                        • {room.units.name}
                      </span>
                    )}
                  </div>
                  
                  {room.last_message ? (
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-xs text-muted-foreground truncate">
                        {room.last_message.profiles?.name}: {room.last_message.content}
                      </p>
                      <span className="text-xs text-muted-foreground ml-2">
                        {format(new Date(room.last_message.created_at), 'HH:mm')}
                      </span>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground mt-1">
                      Sem mensagens
                    </p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
