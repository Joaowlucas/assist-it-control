
import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useUnits, useCreateUnit, useUpdateUnit, useDeleteUnit } from "@/hooks/useUnits"
import { Building, Plus, Edit, Trash2, MapPin } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Unit {
  id: string
  name: string
  description?: string
  address?: string
  created_at: string
  updated_at: string
}

export function UnitManagementSection() {
  const { data: units, isLoading } = useUnits()
  const createUnit = useCreateUnit()
  const updateUnit = useUpdateUnit()
  const deleteUnit = useDeleteUnit()
  const { toast } = useToast()

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address: ''
  })

  const handleCreateUnit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      toast({
        title: 'Erro',
        description: 'Nome da unidade é obrigatório',
        variant: 'destructive'
      })
      return
    }

    await createUnit.mutateAsync({
      name: formData.name,
      description: formData.description || null,
      address: formData.address || null
    })

    setFormData({ name: '', description: '', address: '' })
    setIsCreateDialogOpen(false)
  }

  const handleEditUnit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingUnit || !formData.name.trim()) {
      toast({
        title: 'Erro',
        description: 'Nome da unidade é obrigatório',
        variant: 'destructive'
      })
      return
    }

    await updateUnit.mutateAsync({
      id: editingUnit.id,
      name: formData.name,
      description: formData.description || null,
      address: formData.address || null
    })

    setFormData({ name: '', description: '', address: '' })
    setEditingUnit(null)
    setIsEditDialogOpen(false)
  }

  const handleDeleteUnit = async (unitId: string, unitName: string) => {
    if (confirm(`Tem certeza que deseja excluir a unidade "${unitName}"?`)) {
      await deleteUnit.mutateAsync(unitId)
    }
  }

  const openEditDialog = (unit: Unit) => {
    setEditingUnit(unit)
    setFormData({
      name: unit.name,
      description: unit.description || '',
      address: unit.address || ''
    })
    setIsEditDialogOpen(true)
  }

  const resetForm = () => {
    setFormData({ name: '', description: '', address: '' })
    setEditingUnit(null)
  }

  if (isLoading) {
    return <div>Carregando unidades...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Unidades</h3>
          <p className="text-sm text-muted-foreground">
            Gerencie as unidades organizacionais do sistema
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nova Unidade
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Nova Unidade</DialogTitle>
              <DialogDescription>
                Adicione uma nova unidade organizacional ao sistema
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateUnit} className="space-y-4">
              <div>
                <label className="text-sm font-medium">Nome *</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Digite o nome da unidade"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium">Descrição</label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Digite uma descrição (opcional)"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Endereço</label>
                <Textarea
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="Digite o endereço (opcional)"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => {
                  resetForm()
                  setIsCreateDialogOpen(false)
                }}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={createUnit.isPending}>
                  {createUnit.isPending ? 'Criando...' : 'Criar Unidade'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {units?.map((unit) => (
          <Card key={unit.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Building className="h-5 w-5" />
                  <div>
                    <CardTitle className="text-lg">{unit.name}</CardTitle>
                    {unit.description && (
                      <CardDescription>{unit.description}</CardDescription>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">Ativa</Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEditDialog(unit)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteUnit(unit.id, unit.name)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            {unit.address && (
              <CardContent>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  {unit.address}
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      {units && units.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Building className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma unidade encontrada</h3>
            <p className="text-muted-foreground">
              Comece criando a primeira unidade organizacional.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Unidade</DialogTitle>
            <DialogDescription>
              Faça as alterações necessárias na unidade
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditUnit} className="space-y-4">
            <div>
              <label className="text-sm font-medium">Nome *</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Digite o nome da unidade"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium">Descrição</label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Digite uma descrição (opcional)"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Endereço</label>
              <Textarea
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                placeholder="Digite o endereço (opcional)"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => {
                resetForm()
                setIsEditDialogOpen(false)
              }}>
                Cancelar
              </Button>
              <Button type="submit" disabled={updateUnit.isPending}>
                {updateUnit.isPending ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
