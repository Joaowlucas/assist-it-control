import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "./useAuth"
import { toast } from "@/hooks/use-toast"

export interface EquipmentRequest {
  id: string
  requester_id: string
  equipment_type: string
  justification: string
  priority: 'baixa' | 'media' | 'alta'
  status: 'pendente' | 'aprovado' | 'rejeitado' | 'entregue' | 'cancelado'
  requested_at: string
  reviewed_by?: string
  reviewed_at?: string
  admin_comments?: string
  created_at: string
  updated_at: string
  specifications: Record<string, any>
  requester?: {
    name: string
    email: string
    unit?: {
      name: string
    }
  }
  reviewer?: {
    name: string
  }
}

export interface CreateEquipmentRequestData {
  equipment_type: string
  justification: string
  priority: 'baixa' | 'media' | 'alta'
  specifications?: Record<string, any>
}

export function useEquipmentRequests() {
  const { profile } = useAuth()
  
  const query = useQuery({
    queryKey: ['user-equipment-requests', profile?.id],
    queryFn: async () => {
      if (!profile?.id) throw new Error('User not authenticated')

      const { data, error } = await supabase
        .from('equipment_requests')
        .select(`
          *,
          requester:profiles!equipment_requests_requester_id_fkey(
            name,
            email,
            unit:units(name)
          ),
          reviewer:profiles!equipment_requests_reviewed_by_fkey(
            name
          )
        `)
        .eq('requester_id', profile.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as EquipmentRequest[]
    },
    enabled: !!profile?.id,
  })

  const queryClient = useQueryClient()

  const createRequest = useMutation({
    mutationFn: async (data: CreateEquipmentRequestData) => {
      if (!profile?.id) throw new Error('User not authenticated')

      const { data: result, error } = await supabase
        .from('equipment_requests')
        .insert({
          requester_id: profile.id,
          equipment_type: data.equipment_type,
          justification: data.justification,
          priority: data.priority,
          specifications: data.specifications || {},
        })
        .select()
        .single()

      if (error) throw error
      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-equipment-requests'] })
      toast({
        title: "Solicitação enviada!",
        description: "Sua solicitação de equipamento foi enviada para análise.",
      })
    },
    onError: (error) => {
      console.error('Error creating equipment request:', error)
      toast({
        title: "Erro ao enviar solicitação",
        description: "Não foi possível enviar sua solicitação. Tente novamente.",
        variant: "destructive",
      })
    },
  })

  const deleteRequest = useMutation({
    mutationFn: async (requestId: string) => {
      const { error } = await supabase
        .from('equipment_requests')
        .delete()
        .eq('id', requestId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-equipment-requests'] })
      toast({
        title: "Solicitação cancelada",
        description: "Sua solicitação foi cancelada com sucesso.",
      })
    },
    onError: (error) => {
      console.error('Error deleting equipment request:', error)
      toast({
        title: "Erro ao cancelar",
        description: "Não foi possível cancelar a solicitação.",
        variant: "destructive",
      })
    },
  })

  return {
    ...query,
    createRequest,
    deleteRequest
  }
}

// Alias para compatibilidade
export const useUserEquipmentRequests = useEquipmentRequests
export const useDeleteEquipmentRequest = () => {
  const { deleteRequest } = useEquipmentRequests()
  return deleteRequest
}
