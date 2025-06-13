
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
    console.log('🔧 Updating filter:', key, '=', value)
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const clearFilters = () => {
    console.log('🧹 Clearing all filters')
    setFilters({
      type: '',
      unitId: '',
      status: '',
      searchTerm: '',
      assignedUserId: ''
    })
  }

  const hasActiveFilters = useMemo(() => {
    const active = Object.values(filters).some(value => value !== '')
    console.log('🎯 Has active filters:', active)
    return active
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
      console.log('📋 Fetching equipment types...')
      
      try {
        const { data, error } = await supabase
          .from('equipment')
          .select('type')
          .order('type')

        if (error) {
          console.error('❌ Error fetching equipment types:', error)
          throw error
        }
        
        console.log('📋 Equipment types raw data:', data)
        const uniqueTypes = [...new Set(data?.map(item => item.type) || [])].filter(Boolean)
        console.log('✅ Unique equipment types:', uniqueTypes)
        return uniqueTypes
      } catch (error) {
        console.error('❌ Equipment types fetch error:', error)
        return []
      }
    },
    retry: 2,
    retryDelay: 1000,
    staleTime: 60000,
  })
}

export function useAssignedUsers() {
  return useQuery({
    queryKey: ['assigned-users'],
    queryFn: async () => {
      console.log('👥 Fetching assigned users...')
      
      try {
        const { data, error } = await supabase
          .from('assignments')
          .select(`
            user_id,
            profiles!assignments_user_id_fkey(name)
          `)
          .eq('status', 'ativo')

        if (error) {
          console.error('❌ Error fetching assigned users:', error)
          // Return empty array instead of throwing to prevent UI breakage
          return []
        }
        
        console.log('👥 Assigned users raw data:', data)
        
        const uniqueUsers = (data || []).reduce((acc, assignment) => {
          const userId = assignment.user_id
          const userName = assignment.profiles?.name
          if (userId && userName && !acc.some(u => u.id === userId)) {
            acc.push({ id: userId, name: userName })
          }
          return acc
        }, [] as Array<{ id: string; name: string }>)
        
        console.log('✅ Unique assigned users:', uniqueUsers)
        return uniqueUsers
      } catch (error) {
        console.error('❌ Assigned users fetch error:', error)
        return []
      }
    },
    retry: 2,
    retryDelay: 1000,
    staleTime: 60000,
  })
}
