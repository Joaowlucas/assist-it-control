
import React, { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { ImageIcon, Trash2, Star } from 'lucide-react'
import { useEquipmentPhotos, useDeleteEquipmentPhoto } from '@/hooks/useEquipmentPhotos'

interface EquipmentPhotoGalleryProps {
  equipmentId: string
  canEdit?: boolean
}

export function EquipmentPhotoGallery({ equipmentId, canEdit = false }: EquipmentPhotoGalleryProps) {
  const { data: photos, isLoading } = useEquipmentPhotos(equipmentId)
  const deletePhoto = useDeleteEquipmentPhoto()
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (!photos || photos.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center h-32 text-gray-500">
          <ImageIcon className="h-8 w-8 mb-2" />
          <p>Nenhuma foto disponível</p>
        </CardContent>
      </Card>
    )
  }

  const handleDelete = (photoId: string, photoUrl: string) => {
    if (window.confirm('Tem certeza que deseja remover esta foto?')) {
      deletePhoto.mutate({ photoId, photoUrl })
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {photos.map((photo) => (
          <Card key={photo.id} className="relative group overflow-hidden">
            <CardContent className="p-0">
              <div className="aspect-square relative">
                <img
                  src={photo.photo_url}
                  alt={photo.caption || 'Foto do equipamento'}
                  className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform"
                  onClick={() => setSelectedPhoto(photo.photo_url)}
                />
                
                {photo.is_primary && (
                  <Badge className="absolute top-2 left-2 bg-yellow-500">
                    <Star className="h-3 w-3 mr-1" />
                    Principal
                  </Badge>
                )}
                
                {canEdit && (
                  <Button
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0"
                    onClick={() => handleDelete(photo.id, photo.photo_url)}
                    disabled={deletePhoto.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
              
              {photo.caption && (
                <div className="p-2">
                  <p className="text-xs text-gray-600 truncate">{photo.caption}</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Modal para visualizar foto em tamanho completo */}
      <Dialog open={!!selectedPhoto} onOpenChange={() => setSelectedPhoto(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Visualizar Foto</DialogTitle>
          </DialogHeader>
          {selectedPhoto && (
            <div className="flex justify-center">
              <img
                src={selectedPhoto}
                alt="Foto do equipamento"
                className="max-w-full max-h-[70vh] object-contain"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
