
import React, { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Button } from '@/components/ui/button'
import { X, Upload, Paperclip, Image as ImageIcon, FileText } from 'lucide-react'

interface ChatAttachmentUploadProps {
  onFileSelect: (file: File | null) => void
  selectedFile: File | null
}

export function ChatAttachmentUpload({ onFileSelect, selectedFile }: ChatAttachmentUploadProps) {
  const [preview, setPreview] = useState<string | null>(null)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (file) {
      onFileSelect(file)
      
      // Create preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onload = () => setPreview(reader.result as string)
        reader.readAsDataURL(file)
      } else {
        setPreview(null)
      }
    }
  }, [onFileSelect])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
      'application/pdf': ['.pdf'],
      'text/*': ['.txt'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    multiple: false,
    maxSize: 10 * 1024 * 1024, // 10MB
  })

  const removeFile = () => {
    onFileSelect(null)
    setPreview(null)
  }

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return <ImageIcon className="h-4 w-4" />
    }
    return <FileText className="h-4 w-4" />
  }

  if (selectedFile) {
    return (
      <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
        {preview ? (
          <img src={preview} alt="Preview" className="h-12 w-12 rounded object-cover" />
        ) : (
          <div className="h-12 w-12 rounded bg-muted-foreground/10 flex items-center justify-center">
            {getFileIcon(selectedFile)}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{selectedFile.name}</p>
          <p className="text-xs text-muted-foreground">
            {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={removeFile}
          className="h-8 w-8 p-0"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    )
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      {...getRootProps()}
      className="h-10 w-10 p-0"
    >
      <input {...getInputProps()} />
      <Paperclip className="h-4 w-4" />
    </Button>
  )
}
