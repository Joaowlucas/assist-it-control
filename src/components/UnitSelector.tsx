
import React from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useUnits } from '@/hooks/useUnits'
import { useTechnicianUnits } from '@/hooks/useTechnicianUnits'
import { useAuth } from '@/hooks/useAuth'

interface UnitSelectorProps {
  selectedUnits: string[]
  onUnitsChange: (units: string[]) => void
  required?: boolean
}

export function UnitSelector({ selectedUnits, onUnitsChange, required = false }: UnitSelectorProps) {
  const { profile } = useAuth()
  const { data: allUnits = [] } = useUnits()
  const { data: technicianUnits = [] } = useTechnicianUnits(
    profile?.role === 'technician' ? profile.id : undefined
  )

  // Determinar quais unidades o usuário pode selecionar
  const availableUnits = React.useMemo(() => {
    if (profile?.role === 'admin') {
      return allUnits
    } else if (profile?.role === 'technician') {
      return technicianUnits
        .map(tu => allUnits.find(u => u.id === tu.unit_id))
        .filter(Boolean)
    } else if (profile?.role === 'user' && profile.unit_id) {
      return allUnits.filter(u => u.id === profile.unit_id)
    }
    return []
  }, [profile, allUnits, technicianUnits])

  const handleUnitToggle = (unitId: string, checked: boolean) => {
    if (checked) {
      onUnitsChange([...selectedUnits, unitId])
    } else {
      onUnitsChange(selectedUnits.filter(id => id !== unitId))
    }
  }

  const handleAllUnitsToggle = (checked: boolean) => {
    if (checked) {
      onUnitsChange(['all'])
    } else {
      onUnitsChange([])
    }
  }

  // Para usuários comuns, pré-selecionar sua unidade
  React.useEffect(() => {
    if (profile?.role === 'user' && profile.unit_id && selectedUnits.length === 0) {
      onUnitsChange([profile.unit_id])
    }
  }, [profile, selectedUnits.length, onUnitsChange])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">
          Unidades que verão este comunicado {required && '*'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {profile?.role === 'admin' && (
          <div className="flex items-center space-x-2">
            <Checkbox
              id="all-units"
              checked={selectedUnits.includes('all')}
              onCheckedChange={handleAllUnitsToggle}
            />
            <Label htmlFor="all-units" className="font-medium text-blue-600">
              Todas as unidades
            </Label>
          </div>
        )}

        {!selectedUnits.includes('all') && (
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {availableUnits.map((unit) => (
              <div key={unit.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`unit-${unit.id}`}
                  checked={selectedUnits.includes(unit.id)}
                  onCheckedChange={(checked) => handleUnitToggle(unit.id, !!checked)}
                  disabled={profile?.role === 'user'}
                />
                <Label htmlFor={`unit-${unit.id}`}>
                  {unit.name}
                </Label>
              </div>
            ))}
          </div>
        )}

        {availableUnits.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Nenhuma unidade disponível
          </p>
        )}
      </CardContent>
    </Card>
  )
}
