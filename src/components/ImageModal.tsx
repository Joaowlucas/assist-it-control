
import React from 'react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Download, X } from 'lucide-react'

interface ImageModalProps {
  isOpen: boolean
  onClose: () => void
  imageUrl: string
  imageTitle?: string
}

export function ImageModal({ isOpen, onClose, imageUrl, imageTitle }: ImageModalProps) {
  const handleDownload = () => {
    const link = document.createElement('a')
    link.href = imageUrl
    link.download = imageTitle || 'imagem'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-2">
        <div className="relative">
          <div className="absolute top-2 right-2 z-10 flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleDownload}
              className="bg-black/50 hover:bg-black/70 text-white"
            >
              <Download className="h-4 w-4 mr-2" />
              Baixar
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={onClose}
              className="bg-black/50 hover:bg-black/70 text-white"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <img
            src={imageUrl}
            alt={imageTitle}
            className="w-full h-auto max-h-[80vh] object-contain rounded-lg"
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
