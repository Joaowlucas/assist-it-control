import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'

export interface Equipment {
  id: string
  name: string
  type: string
  tombamento?: string
  status: string
  brand?: string
  model?: string
}

export interface Ticket {
  id: string
  title: string
  ticket_number: number
  status: string
  priority: string
  description: string
  requester_id: string
  profiles?: {
    name: string
  }
}

export function useAvailableEquipment() {
  return useQuery({
    queryKey: ['available-equipment'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('equipment')
        .select('id, name, type, tombamento, status, brand, model')
        .eq('status', 'disponivel')
        .order('name', { ascending: true })

      if (error) throw error
      return data as Equipment[]
    },
  })
}

export function useAllEquipment() {
  return useQuery({
    queryKey: ['all-equipment'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('equipment')
        .select('id, name, type, tombamento, status, brand, model')
        .order('name', { ascending: true })

      if (error) throw error
      return data as Equipment[]
    },
  })
}

export function useAvailableTickets() {
  return useQuery({
    queryKey: ['available-tickets'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tickets')
        .select(`
          id,
          title,
          ticket_number,
          status,
          priority,
          description,
          requester_id,
          profiles(name)
        `)
        .in('status', ['aberto', 'em_andamento'])
        .order('created_at', { ascending: false })

      if (error) throw error
      return (data as any[]) as Ticket[]
    },
  })
}

export function useAllTickets() {
  return useQuery({
    queryKey: ['all-tickets'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tickets')
        .select(`
          id,
          title,
          ticket_number,
          status,
          priority,
          description,
          requester_id,
          profiles(name)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      return (data as any[]) as Ticket[]
    },
  })
}