
import React, { useState } from 'react'
import { format } from 'date-fns'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { ChatMessage as ChatMessageType } from '@/hooks/useChat'
import { ChatMessageOptions } from './ChatMessageOptions'
import { ChatMessageEditor } from './ChatMessageEditor'
import { ChatMessageAttachment } from './ChatMessageAttachment'
import { useEditMessage, useDeleteMessage } from '@/hooks/useChat'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/use-toast'
import { ConfirmDeleteDialog } from './ConfirmDeleteDialog'

interface ChatMessageProps {
  message: ChatMessageType
  isOwn: boolean
}

export function ChatMessage({ message, isOwn }: ChatMessageProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const { toast } = useToast()
  const editMessage = useEditMessage()
  const deleteMessage = useDeleteMessage()

  const handleEdit = async (content: string) => {
    try {
      await editMessage.mutateAsync({
        messageId: message.id,
        content
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
      setShowDeleteDialog(false)
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

  if (message.is_deleted) {
    return (
      <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-4`}>
        <div className={`max-w-[70%] rounded-lg p-3 ${
          isOwn ? 'bg-muted text-muted-foreground' : 'bg-muted text-muted-foreground'
        }`}>
          <p className="text-sm italic">Esta mensagem foi excluída</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs opacity-70">
              {format(new Date(message.created_at), 'HH:mm')}
            </span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
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
              <ChatMessageEditor
                initialContent={message.content}
                onSave={handleEdit}
                onCancel={() => setIsEditing(false)}
              />
            ) : (
              <>
                {message.content && (
                  <p className="text-sm whitespace-pre-wrap break-words">
                    {message.content}
                  </p>
                )}
                {message.attachment_url && (
                  <div className="mt-2">
                    <ChatMessageAttachment message={message} />
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
              
              {!isEditing && (
                <ChatMessageOptions
                  message={message}
                  onEdit={() => setIsEditing(true)}
                  onDelete={() => setShowDeleteDialog(true)}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      <ConfirmDeleteDialog
        open={showDeleteDialog}
        title="Excluir Mensagem"
        description="Tem certeza que deseja excluir esta mensagem? Esta ação não pode ser desfeita."
        onConfirm={handleDelete}
        onOpenChange={setShowDeleteDialog}
      />
    </>
  )
}
