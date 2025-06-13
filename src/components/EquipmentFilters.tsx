
import React from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Search, Filter, X } from 'lucide-react'
import { useEquipmentFilters, useEquipmentTypes, useAssignedUsers, EquipmentFilters as FilterType } from '@/hooks/useEquipmentFilters'
import { useUnits } from '@/hooks/useUnits'

interface EquipmentFiltersProps {
  filters: FilterType
  onFilterChange: (key: keyof FilterType, value: string) => void
  onClearFilters: () => void
  hasActiveFilters: boolean
}

export function EquipmentFilters({ 
  filters, 
  onFilterChange, 
  onClearFilters, 
  hasActiveFilters 
}: EquipmentFiltersProps) {
  const { data: types } = useEquipmentTypes()
  const { data: units } = useUnits()
  const { data: assignedUsers } = useAssignedUsers()

  const statusOptions = [
    { value: 'disponivel', label: 'Disponível' },
    { value: 'em_uso', label: 'Em Uso' },
    { value: 'manutencao', label: 'Manutenção' },
    { value: 'descartado', label: 'Descartado' }
  ]

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            <CardTitle className="text-lg">Filtros</CardTitle>
          </div>
          {hasActiveFilters && (
            <Button variant="outline" size="sm" onClick={onClearFilters}>
              <X className="h-4 w-4 mr-1" />
              Limpar
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <Label htmlFor="search">Buscar</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="search"
                placeholder="Nome, marca, modelo..."
                value={filters.searchTerm}
                onChange={(e) => onFilterChange('searchTerm', e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <div>
            <Label>Tipo</Label>
            <Select value={filters.type} onValueChange={(value) => onFilterChange('type', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Todos os tipos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos os tipos</SelectItem>
                {types?.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Unidade</Label>
            <Select value={filters.unitId} onValueChange={(value) => onFilterChange('unitId', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Todas as unidades" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todas as unidades</SelectItem>
                {units?.map((unit) => (
                  <SelectItem key={unit.id} value={unit.id}>
                    {unit.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Status</Label>
            <Select value={filters.status} onValueChange={(value) => onFilterChange('status', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Todos os status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos os status</SelectItem>
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Usuário</Label>
            <Select value={filters.assignedUserId} onValueChange={(value) => onFilterChange('assignedUserId', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Todos os usuários" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos os usuários</SelectItem>
                {assignedUsers?.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2">
            {filters.searchTerm && (
              <Badge variant="secondary">
                Busca: {filters.searchTerm}
                <button
                  onClick={() => onFilterChange('searchTerm', '')}
                  className="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {filters.type && (
              <Badge variant="secondary">
                Tipo: {filters.type}
                <button
                  onClick={() => onFilterChange('type', '')}
                  className="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {filters.status && (
              <Badge variant="secondary">
                Status: {statusOptions.find(s => s.value === filters.status)?.label}
                <button
                  onClick={() => onFilterChange('status', '')}
                  className="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
