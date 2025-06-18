
import { useState } from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"

interface VideoPlayerProps {
  videoUrl: string
  title: string
  isOpen: boolean
  onClose: () => void
}

export function VideoPlayer({ videoUrl, title, isOpen, onClose }: VideoPlayerProps) {
  const getEmbedUrl = (url: string) => {
    // YouTube
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      const videoId = url.includes('youtu.be') 
        ? url.split('youtu.be/')[1]?.split('?')[0]
        : url.split('v=')[1]?.split('&')[0]
      
      if (videoId) {
        return `https://www.youtube.com/embed/${videoId}?autoplay=1`
      }
    }

    // Vimeo
    if (url.includes('vimeo.com')) {
      const videoId = url.split('vimeo.com/')[1]?.split('?')[0]
      if (videoId) {
        return `https://player.vimeo.com/video/${videoId}?autoplay=1`
      }
    }

    // Direct video file
    return url
  }

  const embedUrl = getEmbedUrl(videoUrl)
  const isDirectVideo = !videoUrl.includes('youtube.com') && !videoUrl.includes('youtu.be') && !videoUrl.includes('vimeo.com')

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-full p-0 bg-black">
        <div className="relative">
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-2 right-2 z-10 text-white hover:bg-white/20"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
          
          <div className="aspect-video">
            {isDirectVideo ? (
              <video
                src={embedUrl}
                controls
                autoPlay
                className="w-full h-full"
                title={title}
              >
                Seu navegador não suporta o elemento de vídeo.
              </video>
            ) : (
              <iframe
                src={embedUrl}
                title={title}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
