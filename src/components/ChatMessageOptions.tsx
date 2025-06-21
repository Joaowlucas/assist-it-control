
import React, { useState } from 'react'
import { MoreVertical, Edit, Trash2, Copy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAuth } from '@/hooks/useAuth'
import { ChatMessage } from '@/hooks/useChat'

interface ChatMessageOptionsProps {
  message: ChatMessage
  onEdit: () => void
  onDelete: () => void
}

export function ChatMessageOptions({ message, onEdit, onDelete }: ChatMessageOptionsProps) {
  const { profile } = useAuth()
  const [open, setOpen] = useState(false)

  const canEdit = message.sender_id === profile?.id && !message.is_deleted
  const canDelete = message.sender_id === profile?.id || profile?.role === 'admin'

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content)
    setOpen(false)
  }

  if (!canEdit && !canDelete) {
    return null
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <MoreVertical className="h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-32">
        <DropdownMenuItem onClick={handleCopy}>
          <Copy className="h-4 w-4 mr-2" />
          Copiar
        </DropdownMenuItem>
        {canEdit && (
          <DropdownMenuItem onClick={() => { onEdit(); setOpen(false) }}>
            <Edit className="h-4 w-4 mr-2" />
            Editar
          </DropdownMenuItem>
        )}
        {canDelete && (
          <DropdownMenuItem 
            onClick={() => { onDelete(); setOpen(false) }}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Excluir
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
