
import { useState } from 'react'
import { supabase } from '@/integrations/supabase/client'

export function useImageUpload() {
  const [uploading, setUploading] = useState(false)

  const uploadImage = async (file: File, folder: string = 'announcements'): Promise<string> => {
    setUploading(true)
    
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${folder}/${Date.now()}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('announcements')
        .upload(fileName, file)

      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage
        .from('announcements')
        .getPublicUrl(fileName)

      return urlData.publicUrl
    } finally {
      setUploading(false)
    }
  }

  return { uploadImage, uploading }
}
