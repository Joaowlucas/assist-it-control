
import React, { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Building, MapPin, Plus, Pencil, Trash2 } from "lucide-react"
import { useUnits } from "@/hooks/useUnits"
import { useCreateUnit, useUpdateUnit, useDeleteUnit } from "@/hooks/useUnitManagement"
import { ConfirmDeleteDialog } from "@/components/ConfirmDeleteDialog"

export function UnitManagementSection() {
  const { data: units = [], isLoading } = useUnits()
  const createUnit = useCreateUnit()
  const updateUnit = useUpdateUnit()
  const deleteUnit = useDeleteUnit()
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingUnit, setEditingUnit] = useState<any>(null)
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean
    unitId: string | null
    unitName: string
  }>({
    open: false,
    unitId: null,
    unitName: ""
  })
  
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    description: ""
  })

  const resetForm = () => {
    setFormData({
      name: "",
      address: "",
      description: ""
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      if (editingUnit) {
        await updateUnit.mutateAsync({
          id: editingUnit.id,
          ...formData
        })
        setEditingUnit(null)
      } else {
        await createUnit.mutateAsync(formData)
        setIsCreateDialogOpen(false)
      }
      resetForm()
    } catch (error) {
      console.error('Error saving unit:', error)
    }
  }

  const handleEdit = (unit: any) => {
    setEditingUnit(unit)
    setFormData({
      name: unit.name || "",
      address: unit.address || "",
      description: unit.description || ""
    })
  }

  const handleDelete = (unitId: string, unitName: string) => {
    setDeleteDialog({
      open: true,
      unitId,
      unitName
    })
  }

  const confirmDelete = async () => {
    if (deleteDialog.unitId) {
      try {
        await deleteUnit.mutateAsync(deleteDialog.unitId)
        setDeleteDialog({ open: false, unitId: null, unitName: "" })
      } catch (error) {
        console.error('Error deleting unit:', error)
      }
    }
  }

  if (isLoading) {
    return <div className="flex justify-center p-4">Carregando...</div>
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Unidades Organizacionais</CardTitle>
            <CardDescription>
              Gerencie as unidades da organização
            </CardDescription>
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
                <DialogTitle>Nova Unidade</DialogTitle>
                <DialogDescription>
                  Crie uma nova unidade organizacional
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Nome da Unidade</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Ex: Matriz São Paulo"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="address">Endereço</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="Endereço completo da unidade"
                  />
                </div>
                
                <div>
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Descrição da unidade..."
                    rows={3}
                  />
                </div>
                
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => {
                    setIsCreateDialogOpen(false)
                    resetForm()
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
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Endereço</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {units.map((unit) => (
                <TableRow key={unit.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4" />
                      <div className="font-medium">{unit.name}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      <div className="text-sm">{unit.address || 'Não informado'}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-xs truncate">
                      {unit.description || 'Sem descrição'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(unit)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(unit.id, unit.name)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {units.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Building className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma unidade encontrada</p>
              <p className="text-sm">Crie uma nova unidade para começar</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!editingUnit} onOpenChange={(open) => {
        if (!open) {
          setEditingUnit(null)
          resetForm()
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Unidade</DialogTitle>
            <DialogDescription>
              Modifique as informações da unidade
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="edit_name">Nome da Unidade</Label>
              <Input
                id="edit_name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Ex: Matriz São Paulo"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="edit_address">Endereço</Label>
              <Input
                id="edit_address"
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                placeholder="Endereço completo da unidade"
              />
            </div>
            
            <div>
              <Label htmlFor="edit_description">Descrição</Label>
              <Textarea
                id="edit_description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Descrição da unidade..."
                rows={3}
              />
            </div>
            
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => {
                setEditingUnit(null)
                resetForm()
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

      <ConfirmDeleteDialog
        open={deleteDialog.open}
        title="Confirmar Exclusão"
        description={`Tem certeza que deseja excluir a unidade "${deleteDialog.unitName}"? Esta ação não pode ser desfeita.`}
        onConfirm={confirmDelete}
        onOpenChange={(open) => setDeleteDialog({ open: false, unitId: null, unitName: "" })}
      />
    </div>
  )
}
