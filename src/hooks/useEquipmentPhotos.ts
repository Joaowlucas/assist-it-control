
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'

export interface EquipmentPhoto {
  id: string
  equipment_id: string
  photo_url: string
  caption?: string
  is_primary: boolean
  uploaded_by: string
  created_at: string
  updated_at: string
}

export function useEquipmentPhotos(equipmentId: string) {
  return useQuery({
    queryKey: ['equipment-photos', equipmentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('equipment_photos')
        .select('*')
        .eq('equipment_id', equipmentId)
        .order('is_primary', { ascending: false })
        .order('created_at', { ascending: true })

      if (error) throw error
      return data as EquipmentPhoto[]
    },
    enabled: !!equipmentId,
  })
}

export function useUploadEquipmentPhoto() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({ 
      equipmentId, 
      file, 
      caption, 
      isPrimary = false 
    }: { 
      equipmentId: string
      file: File
      caption?: string
      isPrimary?: boolean
    }) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      const fileExt = file.name.split('.').pop()
      const fileName = `${equipmentId}/${Date.now()}.${fileExt}`

      // Upload file to storage
      const { error: uploadError } = await supabase.storage
        .from('equipment-photos')
        .upload(fileName, file)

      if (uploadError) throw uploadError

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('equipment-photos')
        .getPublicUrl(fileName)

      // Save photo record to database
      const { data, error } = await supabase
        .from('equipment_photos')
        .insert({
          equipment_id: equipmentId,
          photo_url: publicUrl,
          caption,
          is_primary: isPrimary,
          uploaded_by: user.id
        })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['equipment-photos', variables.equipmentId] })
      queryClient.invalidateQueries({ queryKey: ['equipment'] })
      toast({
        title: 'Sucesso',
        description: 'Foto adicionada com sucesso',
      })
    },
    onError: (error) => {
      toast({
        title: 'Erro',
        description: 'Erro ao fazer upload da foto: ' + error.message,
        variant: 'destructive',
      })
    },
  })
}

export function useDeleteEquipmentPhoto() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({ photoId, photoUrl }: { photoId: string, photoUrl: string }) => {
      // Extract file path from URL
      const urlParts = photoUrl.split('/equipment-photos/')
      const filePath = urlParts[1]

      // Delete from storage
      if (filePath) {
        await supabase.storage
          .from('equipment-photos')
          .remove([filePath])
      }

      // Delete from database
      const { error } = await supabase
        .from('equipment_photos')
        .delete()
        .eq('id', photoId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment-photos'] })
      queryClient.invalidateQueries({ queryKey: ['equipment'] })
      toast({
        title: 'Sucesso',
        description: 'Foto removida com sucesso',
      })
    },
    onError: (error) => {
      toast({
        title: 'Erro',
        description: 'Erro ao remover foto: ' + error.message,
        variant: 'destructive',
      })
    },
  })
}
