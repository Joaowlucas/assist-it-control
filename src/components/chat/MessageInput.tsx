
import { useState, useRef, useCallback } from 'react'
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Send, Paperclip, Smile } from "lucide-react"
import { useDropzone } from 'react-dropzone'
import { AttachmentPreview } from "./AttachmentPreview"
import { EmojiPicker } from "./EmojiPicker"
import { useMessageSend } from "@/hooks/useMessageSend"
import { useFileUpload } from "@/hooks/useFileUpload"
import { toast } from "@/hooks/use-toast"

interface MessageInputProps {
  conversationId: string
  onStartTyping: () => void
  onStopTyping: () => void
}

export function MessageInput({ conversationId, onStartTyping, onStopTyping }: MessageInputProps) {
  const [message, setMessage] = useState('')
  const [attachments, setAttachments] = useState<File[]>([])
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout>()
  
  const { sendMessage, loading } = useMessageSend()
  const { uploadFile, uploading } = useFileUpload()

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const validFiles = acceptedFiles.filter(file => {
      const maxSize = 10 * 1024 * 1024 // 10MB
      if (file.size > maxSize) {
        toast({
          title: "Arquivo muito grande",
          description: `${file.name} é maior que 10MB`,
          variant: "destructive"
        })
        return false
      }
      return true
    })
    
    setAttachments(prev => [...prev, ...validFiles])
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif'],
      'video/*': ['.mp4', '.webm', '.mov'],
      'audio/*': ['.mp3', '.wav', '.m4a'],
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    multiple: true,
    noClick: true
  })

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const handleInputChange = (value: string) => {
    setMessage(value)
    
    // Typing indicator
    onStartTyping()
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }
    
    typingTimeoutRef.current = setTimeout(() => {
      onStopTyping()
    }, 2000)
  }

  const handleSubmit = async () => {
    if ((!message.trim() && attachments.length === 0) || loading) return

    try {
      let uploadedAttachments: Array<{
        file_name: string
        file_url: string
        attachment_type: 'image' | 'video' | 'document' | 'audio'
        file_size: number
      }> = []

      // Upload attachments first
      if (attachments.length > 0) {
        for (const file of attachments) {
          const result = await uploadFile(file, 'chat-attachments')
          if (result) {
            uploadedAttachments.push({
              file_name: file.name,
              file_url: result.url,
              attachment_type: getAttachmentType(file.type),
              file_size: file.size
            })
          }
        }
      }

      await sendMessage({
        conversationId,
        content: message.trim(),
        attachments: uploadedAttachments
      })

      setMessage('')
      setAttachments([])
      onStopTyping()
      
      if (textareaRef.current) {
        textareaRef.current.focus()
      }
    } catch (error) {
      toast({
        title: "Erro ao enviar mensagem",
        description: "Tente novamente.",
        variant: "destructive"
      })
    }
  }

  const getAttachmentType = (mimeType: string): 'image' | 'video' | 'document' | 'audio' => {
    if (mimeType.startsWith('image/')) return 'image'
    if (mimeType.startsWith('video/')) return 'video'
    if (mimeType.startsWith('audio/')) return 'audio'
    return 'document'
  }

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index))
  }

  const insertEmoji = (emoji: string) => {
    const textarea = textareaRef.current
    if (textarea) {
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const newMessage = message.slice(0, start) + emoji + message.slice(end)
      setMessage(newMessage)
      
      setTimeout(() => {
        textarea.focus()
        textarea.setSelectionRange(start + emoji.length, start + emoji.length)
      }, 0)
    }
    setShowEmojiPicker(false)
  }

  const handleFileButtonClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <div {...getRootProps()} className="p-4 space-y-3">
      <input {...getInputProps()} ref={fileInputRef} />
      
      {isDragActive && (
        <div className="absolute inset-0 bg-primary/20 border-2 border-dashed border-primary rounded-lg flex items-center justify-center z-10">
          <div className="text-center">
            <Paperclip className="h-8 w-8 mx-auto mb-2" />
            <p>Solte os arquivos aqui</p>
          </div>
        </div>
      )}

      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {attachments.map((file, index) => (
            <AttachmentPreview
              key={index}
              file={file}
              onRemove={() => removeAttachment(index)}
            />
          ))}
        </div>
      )}

      <div className="flex items-end gap-2">
        <div className="flex-1 relative">
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Digite uma mensagem..."
            className="min-h-[40px] max-h-32 resize-none pr-20"
            disabled={loading || uploading}
          />
          
          <div className="absolute right-2 bottom-2 flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="h-6 w-6 p-0"
            >
              <Smile className="h-4 w-4" />
            </Button>
            
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleFileButtonClick}
              className="h-6 w-6 p-0"
            >
              <Paperclip className="h-4 w-4" />
            </Button>
          </div>

          {showEmojiPicker && (
            <div className="absolute bottom-full right-0 mb-2">
              <EmojiPicker onEmojiSelect={insertEmoji} />
            </div>
          )}
        </div>

        <Button
          onClick={handleSubmit}
          disabled={(!message.trim() && attachments.length === 0) || loading || uploading}
          size="sm"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
