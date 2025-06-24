import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useTechnicianUnits } from '@/hooks/useTechnicianUnits';
import { toast } from 'sonner';

export function useTickets() {
  const { profile } = useAuth();
  const { data: technicianUnits } = useTechnicianUnits(profile?.role === 'technician' ? profile.id : undefined);

  return useQuery({
    queryKey: ['tickets', profile?.id, profile?.role, technicianUnits],
    queryFn: async () => {
      console.log('Fetching tickets...');
      
      if (!profile) {
        throw new Error('User profile not loaded');
      }

      let query = supabase
        .from('tickets')
        .select(`
          *,
          requester:profiles!tickets_requester_id_fkey(id, name, email, phone),
          assignee:profiles!tickets_assignee_id_fkey(id, name, email),
          unit:units(id, name)
        `);

      // Apply filters based on user role
      if (profile.role === 'user') {
        // Users can only see their own tickets
        query = query.eq('requester_id', profile.id);
      } else if (profile.role === 'technician' && technicianUnits && technicianUnits.length > 0) {
        // Technicians can see tickets from their assigned units
        const allowedUnitIds = technicianUnits.map(tu => tu.unit_id);
        query = query.in('unit_id', allowedUnitIds);
      }
      // Admins can see all tickets (no additional filter)

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching tickets:', error);
        throw error;
      }

      console.log(`Loaded ${data?.length || 0} tickets`);
      return data || [];
    },
    enabled: !!profile,
    staleTime: 30000, // 30 seconds
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

export function useCreateTicket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newTicket) => {
      const { data, error } = await supabase
        .from('tickets')
        .insert([newTicket])
        .select()
        .single();

      if (error) {
        console.error('Error creating ticket:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      toast.success('Ticket criado com sucesso!');
    },
    onError: (error) => {
      toast.error(`Erro ao criar ticket: ${error.message}`);
    },
  });
}

export function useUpdateTicket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }) => {
      const { data, error } = await supabase
        .from('tickets')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating ticket:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      toast.success('Ticket atualizado com sucesso!');
    },
    onError: (error) => {
      toast.error(`Erro ao atualizar ticket: ${error.message}`);
    },
  });
}

export function useDeleteTicket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      const { data, error } = await supabase
        .from('tickets')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting ticket:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      toast.success('Ticket excluído com sucesso!');
    },
    onError: (error) => {
      toast.error(`Erro ao excluir ticket: ${error.message}`);
    },
  });
}
