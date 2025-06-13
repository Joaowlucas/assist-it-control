
import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'

export interface EquipmentFilters {
  type: string
  unitId: string
  status: string
  searchTerm: string
  assignedUserId: string
}

export function useEquipmentFilters() {
  const [filters, setFilters] = useState<EquipmentFilters>({
    type: '',
    unitId: '',
    status: '',
    searchTerm: '',
    assignedUserId: ''
  })

  const updateFilter = (key: keyof EquipmentFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const clearFilters = () => {
    setFilters({
      type: '',
      unitId: '',
      status: '',
      searchTerm: '',
      assignedUserId: ''
    })
  }

  const hasActiveFilters = useMemo(() => {
    return Object.values(filters).some(value => value !== '')
  }, [filters])

  return {
    filters,
    updateFilter,
    clearFilters,
    hasActiveFilters
  }
}

export function useEquipmentTypes() {
  return useQuery({
    queryKey: ['equipment-types'],
    queryFn: async () => {
      console.log('Fetching equipment types...')
      const { data, error } = await supabase
        .from('equipment')
        .select('type')
        .order('type')

      if (error) {
        console.error('Error fetching equipment types:', error)
        throw error
      }
      
      console.log('Equipment types raw data:', data)
      const uniqueTypes = [...new Set(data.map(item => item.type))].filter(Boolean)
      console.log('Unique equipment types:', uniqueTypes)
      return uniqueTypes
    }
  })
}

export function useAssignedUsers() {
  return useQuery({
    queryKey: ['assigned-users'],
    queryFn: async () => {
      console.log('Fetching assigned users...')
      const { data, error } = await supabase
        .from('assignments')
        .select(`
          user_id,
          profiles!assignments_user_id_fkey(name)
        `)
        .eq('status', 'ativo')

      if (error) {
        console.error('Error fetching assigned users:', error)
        throw error
      }
      
      console.log('Assigned users raw data:', data)
      
      const uniqueUsers = data.reduce((acc, assignment) => {
        const userId = assignment.user_id
        const userName = assignment.profiles?.name
        if (userId && userName && !acc.some(u => u.id === userId)) {
          acc.push({ id: userId, name: userName })
        }
        return acc
      }, [] as Array<{ id: string; name: string }>)
      
      console.log('Unique assigned users:', uniqueUsers)
      return uniqueUsers
    }
  })
}
