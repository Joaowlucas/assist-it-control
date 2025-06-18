
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"

export interface PredefinedText {
  id: string
  type: 'title' | 'description'
  category: string | null
  text_content: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export const usePredefinedTexts = () => {
  return useQuery({
    queryKey: ['predefined-texts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('predefined_texts')
        .select('*')
        .eq('is_active', true)
        .order('type', { ascending: true })
        .order('category', { ascending: true })
      
      if (error) throw error
      return data as PredefinedText[]
    }
  })
}

export const useCreatePredefinedText = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  
  return useMutation({
    mutationFn: async (text: Omit<PredefinedText, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('predefined_texts')
        .insert(text)
        .select()
        .single()
      
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['predefined-texts'] })
      toast({
        title: "Texto criado",
        description: "Texto pré-definido criado com sucesso!"
      })
    }
  })
}

export const useUpdatePredefinedText = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<PredefinedText> & { id: string }) => {
      const { data, error } = await supabase
        .from('predefined_texts')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['predefined-texts'] })
      toast({
        title: "Texto atualizado",
        description: "Texto pré-definido atualizado com sucesso!"
      })
    }
  })
}

export const useDeletePredefinedText = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('predefined_texts')
        .update({ is_active: false })
        .eq('id', id)
      
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['predefined-texts'] })
      toast({
        title: "Texto removido",
        description: "Texto pré-definido removido com sucesso!"
      })
    }
  })
}
