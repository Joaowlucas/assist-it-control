
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "./useAuth"
import { toast } from "@/hooks/use-toast"

export interface EquipmentRequest {
  id: string
  requester_id: string
  equipment_type: string
  specifications: Record<string, any>
  justification: string
  priority: 'baixa' | 'media' | 'alta' | 'critica'
  status: 'pendente' | 'aprovado' | 'rejeitado' | 'entregue' | 'cancelado'
  requested_at: string
  reviewed_by?: string
  reviewed_at?: string
  admin_comments?: string
  created_at: string
  updated_at: string
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
  specifications: Record<string, any>
  justification: string
  priority: 'baixa' | 'media' | 'alta' | 'critica'
}

export function useUserEquipmentRequests() {
  const { profile } = useAuth()
  
  return useQuery({
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
}

export function useCreateEquipmentRequest() {
  const queryClient = useQueryClient()
  const { profile } = useAuth()

  return useMutation({
    mutationFn: async (data: CreateEquipmentRequestData) => {
      if (!profile?.id) throw new Error('User not authenticated')

      const { data: result, error } = await supabase
        .from('equipment_requests')
        .insert({
          requester_id: profile.id,
          equipment_type: data.equipment_type,
          specifications: data.specifications,
          justification: data.justification,
          priority: data.priority,
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
}

export function useUpdateEquipmentRequest() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<EquipmentRequest> }) => {
      const { data: result, error } = await supabase
        .from('equipment_requests')
        .update(data)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-equipment-requests'] })
      toast({
        title: "Solicitação atualizada!",
        description: "Sua solicitação foi atualizada com sucesso.",
      })
    },
    onError: (error) => {
      console.error('Error updating equipment request:', error)
      toast({
        title: "Erro ao atualizar",
        description: "Não foi possível atualizar a solicitação.",
        variant: "destructive",
      })
    },
  })
}

export function useDeleteEquipmentRequest() {
  const queryClient = useQueryClient()
  const { profile } = useAuth()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('equipment_requests')
        .delete()
        .eq('id', id)

      if (error) throw error
    },
    onMutate: async (deletedId) => {
      // Cancel any outgoing refetches so they don't overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey: ['user-equipment-requests'] })

      // Snapshot the previous value
      const previousRequests = queryClient.getQueryData(['user-equipment-requests', profile?.id])

      // Optimistically update by removing the deleted item
      queryClient.setQueryData(['user-equipment-requests', profile?.id], (old: EquipmentRequest[] | undefined) => {
        return old ? old.filter(request => request.id !== deletedId) : []
      })

      // Return a context object with the snapshotted value
      return { previousRequests }
    },
    onError: (err, deletedId, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousRequests) {
        queryClient.setQueryData(['user-equipment-requests', profile?.id], context.previousRequests)
      }
      console.error('Error deleting equipment request:', err)
      toast({
        title: "Erro ao cancelar",
        description: "Não foi possível cancelar a solicitação.",
        variant: "destructive",
      })
    },
    onSuccess: () => {
      // Always refetch after error or success to ensure we have the latest data
      queryClient.invalidateQueries({ queryKey: ['user-equipment-requests'] })
      toast({
        title: "Solicitação cancelada!",
        description: "Sua solicitação foi cancelada com sucesso.",
      })
    },
  })
}
