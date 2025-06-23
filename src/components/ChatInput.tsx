
import React, { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Send, Paperclip, X } from 'lucide-react'
import { useSendMessage } from '@/hooks/useConversations'
import { useToast } from '@/hooks/use-toast'

interface ChatInputProps {
  conversationId: string
}

export function ChatInput({ conversationId }: ChatInputProps) {
  const [message, setMessage] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const sendMessage = useSendMessage()
  const { toast } = useToast()

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!message.trim() && !selectedFile) return

    try {
      console.log('Sending message to conversation:', conversationId)
      
      await sendMessage.mutateAsync({
        conversationId,
        content: message.trim() || '',
        attachmentFile: selectedFile || undefined,
      })
      
      setMessage('')
      setSelectedFile(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      
      console.log('Message sent successfully')
    } catch (error) {
      console.error('Error sending message:', error)
      toast({
        title: "Erro",
        description: "Erro ao enviar mensagem. Tente novamente.",
        variant: "destructive",
      })
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Verificar tamanho do arquivo (máximo 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "Erro",
          description: "Arquivo muito grande. Máximo 10MB.",
          variant: "destructive",
        })
        return
      }
      setSelectedFile(file)
    }
  }

  const removeFile = () => {
    setSelectedFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend(e as any)
    }
  }

  return (
    <div className="p-4 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      {selectedFile && (
        <div className="mb-3 p-2 bg-muted rounded-lg flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{selectedFile.name}</p>
            <p className="text-xs text-muted-foreground">
              {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
            </p>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={removeFile}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
      
      <form onSubmit={handleSend} className="flex items-end gap-2">
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileSelect}
          className="hidden"
          accept="*/*"
        />
        
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          className="h-12 px-3"
        >
          <Paperclip className="h-4 w-4" />
        </Button>
        
        <div className="flex-1">
          <Textarea
            placeholder="Digite sua mensagem..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            className="min-h-[48px] max-h-32 resize-none"
            disabled={sendMessage.isPending}
          />
        </div>
        
        <Button 
          type="submit" 
          disabled={(!message.trim() && !selectedFile) || sendMessage.isPending}
          className="h-12 px-4"
        >
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  )
}
