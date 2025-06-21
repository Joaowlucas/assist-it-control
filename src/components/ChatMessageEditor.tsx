
import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { X, Check } from 'lucide-react'

interface ChatMessageEditorProps {
  initialContent: string
  onSave: (content: string) => void
  onCancel: () => void
}

export function ChatMessageEditor({ initialContent, onSave, onCancel }: ChatMessageEditorProps) {
  const [content, setContent] = useState(initialContent)

  useEffect(() => {
    setContent(initialContent)
  }, [initialContent])

  const handleSave = () => {
    const trimmedContent = content.trim()
    if (trimmedContent && trimmedContent !== initialContent) {
      onSave(trimmedContent)
    } else {
      onCancel()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSave()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      onCancel()
    }
  }

  return (
    <div className="space-y-2">
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={handleKeyDown}
        className="min-h-[60px] resize-none"
        placeholder="Digite sua mensagem..."
        autoFocus
      />
      <div className="flex justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={onCancel}>
          <X className="h-4 w-4 mr-1" />
          Cancelar
        </Button>
        <Button size="sm" onClick={handleSave} disabled={!content.trim()}>
          <Check className="h-4 w-4 mr-1" />
          Salvar
        </Button>
      </div>
    </div>
  )
}
