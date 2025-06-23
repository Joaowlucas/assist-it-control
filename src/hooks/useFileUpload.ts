
import { useState } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { v4 as uuidv4 } from 'uuid'

export function useFileUpload() {
  const [uploading, setUploading] = useState(false)

  const uploadFile = async (file: File, bucket: string) => {
    try {
      setUploading(true)
      
      const fileExt = file.name.split('.').pop()
      const fileName = `${uuidv4()}.${fileExt}`
      const filePath = `${fileName}`

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath)

      return {
        path: filePath,
        url: urlData.publicUrl
      }
    } catch (error) {
      console.error('Error uploading file:', error)
      throw error
    } finally {
      setUploading(false)
    }
  }

  return { uploadFile, uploading }
}
