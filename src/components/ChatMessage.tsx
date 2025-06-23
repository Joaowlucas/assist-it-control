
import React, { useState } from 'react'
import { format } from 'date-fns'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { MoreHorizontal, Edit, Trash2, Download, Check, X } from 'lucide-react'
import { useEditMessage, useDeleteMessage } from '@/hooks/useConversations'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/use-toast'

interface Message {
  id: string
  room_id: string
  sender_id: string
  content: string
  created_at: string
  updated_at: string
  edited_at?: string
  is_deleted: boolean
  attachment_url?: string
  attachment_name?: string
  attachment_type?: string
  attachment_size?: number
  profiles: {
    id: string
    name: string
    avatar_url?: string
    role: string
  }
}

interface ChatMessageProps {
  message: Message
  isOwn: boolean
}

export function ChatMessage({ message, isOwn }: ChatMessageProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(message.content)
  const { profile } = useAuth()
  const { toast } = useToast()
  const editMessage = useEditMessage()
  const deleteMessage = useDeleteMessage()

  const handleEdit = async () => {
    if (editContent.trim() === message.content) {
      setIsEditing(false)
      return
    }

    try {
      await editMessage.mutateAsync({
        messageId: message.id,
        content: editContent.trim()
      })
      setIsEditing(false)
      toast({
        title: "Sucesso",
        description: "Mensagem editada com sucesso."
      })
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível editar a mensagem.",
        variant: "destructive"
      })
    }
  }

  const handleDelete = async () => {
    try {
      await deleteMessage.mutateAsync(message.id)
      toast({
        title: "Sucesso",
        description: "Mensagem excluída com sucesso."
      })
    } catch (error) {
      toast({
        title: "Erro", 
        description: "Não foi possível excluir a mensagem.",
        variant: "destructive"
      })
    }
  }

  const handleDownload = () => {
    if (message.attachment_url) {
      window.open(message.attachment_url, '_blank')
    }
  }

  if (message.is_deleted) {
    return (
      <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-4`}>
        <div className={`max-w-[70%] rounded-lg p-3 ${
          isOwn ? 'bg-muted text-muted-foreground' : 'bg-muted text-muted-foreground'
        }`}>
          <p className="text-sm italic">Esta mensagem foi excluída</p>
          <div className="flex items-center justify-between mt-1">
            <span className="text-xs opacity-70">
              {format(new Date(message.created_at), 'HH:mm')}
            </span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-4 group`}>
      <div className={`max-w-[70%] ${isOwn ? 'order-2' : 'order-1'}`}>
        {!isOwn && (
          <div className="flex items-center gap-2 mb-1">
            <Avatar className="h-6 w-6">
              <AvatarImage src={message.profiles?.avatar_url || undefined} />
              <AvatarFallback className="text-xs">
                {message.profiles?.name?.charAt(0).toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs font-medium text-muted-foreground">
              {message.profiles?.name || 'Usuário'}
            </span>
            {message.profiles?.role === 'admin' && (
              <Badge variant="destructive" className="text-xs px-1 py-0">
                Admin
              </Badge>
            )}
            {message.profiles?.role === 'technician' && (
              <Badge variant="secondary" className="text-xs px-1 py-0">
                Técnico
              </Badge>
            )}
          </div>
        )}
        
        <div className={`rounded-lg p-3 ${
          isOwn 
            ? 'bg-primary text-primary-foreground' 
            : 'bg-muted'
        }`}>
          {isEditing ? (
            <div className="space-y-2">
              <Input
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="text-sm"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleEdit()
                  }
                  if (e.key === 'Escape') {
                    setIsEditing(false)
                    setEditContent(message.content)
                  }
                }}
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleEdit}>
                  <Check className="h-3 w-3" />
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => {
                    setIsEditing(false)
                    setEditContent(message.content)
                  }}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ) : (
            <>
              {message.content && (
                <p className="text-sm whitespace-pre-wrap break-words">
                  {message.content}
                </p>
              )}
              
              {message.attachment_url && (
                <div className="mt-2 p-2 rounded border bg-background/10">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">
                        {message.attachment_name}
                      </p>
                      {message.attachment_size && (
                        <p className="text-xs opacity-70">
                          {(message.attachment_size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleDownload}
                      className="h-8 w-8 p-0"
                    >
                      <Download className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
          
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-2">
              <span className="text-xs opacity-70">
                {format(new Date(message.created_at), 'HH:mm')}
              </span>
              {message.edited_at && (
                <span className="text-xs opacity-50">(editada)</span>
              )}
            </div>
            
            {!isEditing && isOwn && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <MoreHorizontal className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setIsEditing(true)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Editar
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Excluir
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
