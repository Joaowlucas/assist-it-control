import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/components/ui/use-toast'
import { Paperclip, X, FileText, Image, Music } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AttachmentUploadProps {
  onAttachmentReady: (attachment: {
    file_name: string
    file_url: string
    file_size: number
    mime_type: string
    attachment_type: 'image' | 'audio' | 'video' | 'document'
  }) => void
  disabled?: boolean
}

export function AttachmentUpload({ onAttachmentReady, disabled }: AttachmentUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { user } = useAuth()
  const { toast } = useToast()

  const getAttachmentType = (mimeType: string): 'image' | 'audio' | 'video' | 'document' => {
    if (mimeType.startsWith('image/')) return 'image'
    if (mimeType.startsWith('audio/')) return 'audio'
    if (mimeType.startsWith('video/')) return 'video'
    return 'document'
  }

  const getFileIcon = (file: File) => {
    const type = getAttachmentType(file.type)
    switch (type) {
      case 'image':
        return <Image className="h-4 w-4" />
      case 'audio':
        return <Music className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validar tamanho do arquivo (máximo 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "Erro",
        description: "Arquivo muito grande. O tamanho máximo é 10MB.",
        variant: "destructive",
      })
      return
    }

    setSelectedFile(file)
  }

  const uploadFile = async () => {
    if (!selectedFile || !user) return

    setUploading(true)
    setUploadProgress(0)

    try {
      // Gerar nome único para o arquivo
      const fileExt = selectedFile.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `${user.id}/${fileName}`

      // Upload do arquivo
      const { data, error } = await supabase.storage
        .from('chat-attachments')
        .upload(filePath, selectedFile, {
          cacheControl: '3600',
          upsert: false
        })

      if (error) throw error

      // Obter URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('chat-attachments')
        .getPublicUrl(filePath)

      // Preparar dados do anexo
      const attachment = {
        file_name: selectedFile.name,
        file_url: publicUrl,
        file_size: selectedFile.size,
        mime_type: selectedFile.type,
        attachment_type: getAttachmentType(selectedFile.type)
      }

      onAttachmentReady(attachment)
      
      // Limpar estado
      setSelectedFile(null)
      setUploadProgress(0)
      
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }

      toast({
        title: "Sucesso",
        description: "Arquivo enviado com sucesso!",
      })
    } catch (error) {
      console.error('Error uploading file:', error)
      toast({
        title: "Erro",
        description: "Não foi possível enviar o arquivo. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
    }
  }

  const cancelUpload = () => {
    setSelectedFile(null)
    setUploadProgress(0)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {!selectedFile ? (
        <>
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileSelect}
            className="hidden"
            accept="image/*,audio/*,video/*,.pdf,.doc,.docx,.txt,.zip,.rar"
            disabled={disabled || uploading}
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || uploading}
            className="w-fit"
          >
            <Paperclip className="h-4 w-4" />
          </Button>
        </>
      ) : (
        <div className="bg-muted/50 rounded-lg p-3 space-y-3">
          <div className="flex items-center gap-2">
            {getFileIcon(selectedFile)}
            <span className="text-sm font-medium truncate flex-1">
              {selectedFile.name}
            </span>
            <span className="text-xs text-muted-foreground">
              {(selectedFile.size / 1024 / 1024).toFixed(1)}MB
            </span>
            <Button
              size="sm"
              variant="ghost"
              onClick={cancelUpload}
              disabled={uploading}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
          
          {uploading && (
            <div className="space-y-2">
              <Progress value={uploadProgress} className="h-2" />
              <p className="text-xs text-muted-foreground text-center">
                Enviando arquivo...
              </p>
            </div>
          )}
          
          {!uploading && (
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={uploadFile}
                disabled={uploading}
                className="flex-1"
              >
                Enviar
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={cancelUpload}
                disabled={uploading}
              >
                Cancelar
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}