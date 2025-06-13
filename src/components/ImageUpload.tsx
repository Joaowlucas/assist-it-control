
import React, { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { X, Upload, Image as ImageIcon } from 'lucide-react'

interface ImageUploadProps {
  images: File[]
  onImagesChange: (images: File[]) => void
  maxImages?: number
  maxSize?: number
}

export function ImageUpload({ 
  images, 
  onImagesChange, 
  maxImages = 5, 
  maxSize = 5 * 1024 * 1024 // 5MB
}: ImageUploadProps) {
  const [previews, setPreviews] = useState<string[]>([])

  const onDrop = useCallback((acceptedFiles: File[]) => {
    // Filtrar apenas imagens e verificar tamanho
    const validFiles = acceptedFiles.filter(file => {
      if (!file.type.startsWith('image/')) {
        return false
      }
      if (file.size > maxSize) {
        return false
      }
      return true
    })

    const newImages = [...images, ...validFiles].slice(0, maxImages)
    onImagesChange(newImages)

    // Criar previews
    const newPreviews = validFiles.map(file => URL.createObjectURL(file))
    setPreviews(prev => [...prev, ...newPreviews].slice(0, maxImages))
  }, [images, onImagesChange, maxImages, maxSize])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp']
    },
    multiple: true,
    maxFiles: maxImages
  })

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index)
    const newPreviews = previews.filter((_, i) => i !== index)
    
    // Revogar URL do preview removido
    if (previews[index]) {
      URL.revokeObjectURL(previews[index])
    }
    
    onImagesChange(newImages)
    setPreviews(newPreviews)
  }

  // Cleanup previews quando componente desmonta
  React.useEffect(() => {
    return () => {
      previews.forEach(preview => URL.revokeObjectURL(preview))
    }
  }, [])

  return (
    <div className="space-y-4">
      <Label className="text-slate-700">Anexar Imagens (Opcional)</Label>
      
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
          ${isDragActive 
            ? 'border-slate-400 bg-slate-50' 
            : 'border-slate-300 hover:border-slate-400 hover:bg-slate-50'
          }
        `}
      >
        <input {...getInputProps()} />
        <Upload className="h-8 w-8 mx-auto mb-2 text-slate-400" />
        {isDragActive ? (
          <p className="text-slate-600">Solte as imagens aqui...</p>
        ) : (
          <div>
            <p className="text-slate-600 mb-1">
              Clique ou arraste imagens aqui
            </p>
            <p className="text-sm text-slate-500">
              Máximo {maxImages} imagens, até {Math.round(maxSize / 1024 / 1024)}MB cada
            </p>
          </div>
        )}
      </div>

      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {images.map((file, index) => (
            <div key={index} className="relative group">
              <div className="aspect-square rounded-lg border border-slate-200 overflow-hidden bg-slate-50">
                {previews[index] ? (
                  <img
                    src={previews[index]}
                    alt={file.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon className="h-8 w-8 text-slate-400" />
                  </div>
                )}
              </div>
              
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => removeImage(index)}
              >
                <X className="h-3 w-3" />
              </Button>
              
              <p className="text-xs text-slate-500 mt-1 truncate">
                {file.name}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
