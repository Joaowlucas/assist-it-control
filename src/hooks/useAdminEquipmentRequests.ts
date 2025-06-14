
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "./useAuth"
import { useTechnicianUnits } from "./useTechnicianUnits"
import { toast } from "@/hooks/use-toast"
import { EquipmentRequest } from "./useEquipmentRequests"

export function useAdminEquipmentRequests() {
  const { profile } = useAuth()
  const { data: technicianUnits } = useTechnicianUnits(profile?.role === 'technician' ? profile.id : undefined)
  
  return useQuery({
    queryKey: ['admin-equipment-requests', profile?.id, profile?.role, technicianUnits],
    queryFn: async () => {
      console.log('Fetching admin equipment requests data...')
      
      // Get unit filter for technicians
      const shouldFilterByUnits = profile?.role === 'technician' && technicianUnits
      const allowedUnitIds = shouldFilterByUnits ? technicianUnits.map(tu => tu.unit_id) : []

      let query = supabase
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

      // Apply unit filter for technicians - filter by requester's unit
      if (shouldFilterByUnits && allowedUnitIds.length > 0) {
        // We need to filter equipment requests where the requester belongs to the technician's units
        // This requires a subquery approach since we're joining with profiles
        const { data: allowedRequesterIds } = await supabase
          .from('profiles')
          .select('id')
          .in('unit_id', allowedUnitIds)
        
        if (allowedRequesterIds && allowedRequesterIds.length > 0) {
          const requesterIds = allowedRequesterIds.map(profile => profile.id)
          query = query.in('requester_id', requesterIds)
        } else {
          // If no requesters found in technician's units, return empty result
          return []
        }
      }

      const { data, error } = await query.order('created_at', { ascending: false })

      if (error) throw error
      return data as EquipmentRequest[]
    },
    enabled: !!profile?.id && (profile.role === 'admin' || profile.role === 'technician'),
  })
}

export function useApproveEquipmentRequest() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ 
      requestId, 
      equipmentId, 
      adminComments 
    }: { 
      requestId: string
      equipmentId: string
      adminComments?: string 
    }) => {
      const { error } = await supabase.rpc('approve_equipment_request_and_assign', {
        request_id: requestId,
        equipment_id: equipmentId,
        admin_comments: adminComments
      })

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-equipment-requests'] })
      queryClient.invalidateQueries({ queryKey: ['user-equipment-requests'] })
      queryClient.invalidateQueries({ queryKey: ['assignments'] })
      queryClient.invalidateQueries({ queryKey: ['equipment'] })
      toast({
        title: "Solicitação aprovada!",
        description: "A solicitação foi aprovada e o equipamento foi atribuído ao usuário.",
      })
    },
    onError: (error) => {
      console.error('Error approving equipment request:', error)
      toast({
        title: "Erro ao aprovar",
        description: "Não foi possível aprovar a solicitação. Verifique se o equipamento está disponível.",
        variant: "destructive",
      })
    },
  })
}

export function useRejectEquipmentRequest() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ 
      requestId, 
      adminComments 
    }: { 
      requestId: string
      adminComments?: string 
    }) => {
      const { error } = await supabase.rpc('reject_equipment_request', {
        request_id: requestId,
        admin_comments: adminComments
      })

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-equipment-requests'] })
      queryClient.invalidateQueries({ queryKey: ['user-equipment-requests'] })
      toast({
        title: "Solicitação rejeitada",
        description: "A solicitação foi rejeitada com sucesso.",
      })
    },
    onError: (error) => {
      console.error('Error rejecting equipment request:', error)
      toast({
        title: "Erro ao rejeitar",
        description: "Não foi possível rejeitar a solicitação.",
        variant: "destructive",
      })
    },
  })
}
