
import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Pencil, Trash2, Plus } from "lucide-react"
import { useUnits } from "@/hooks/useUnits"
import { useCreateUnit, useUpdateUnit, useDeleteUnit } from "@/hooks/useUnitManagement"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

export function UnitManagement() {
  const { data: units = [] } = useUnits()
  const createUnitMutation = useCreateUnit()
  const updateUnitMutation = useUpdateUnit()
  const deleteUnitMutation = useDeleteUnit()
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingUnit, setEditingUnit] = useState<any>(null)
  const [newUnit, setNewUnit] = useState({ name: "", description: "" })

  const handleCreateUnit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await createUnitMutation.mutateAsync(newUnit)
      setIsCreateDialogOpen(false)
      setNewUnit({ name: "", description: "" })
    } catch (error) {
      console.error('Erro ao criar unidade:', error)
    }
  }

  const handleUpdateUnit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingUnit) return

    try {
      await updateUnitMutation.mutateAsync({
        id: editingUnit.id,
        name: editingUnit.name,
        description: editingUnit.description
      })
      setIsEditDialogOpen(false)
      setEditingUnit(null)
    } catch (error) {
      console.error('Erro ao atualizar unidade:', error)
    }
  }

  const handleDeleteUnit = async (unitId: string) => {
    if (confirm('Tem certeza que deseja excluir esta unidade?')) {
      try {
        await deleteUnitMutation.mutateAsync(unitId)
      } catch (error) {
        console.error('Erro ao excluir unidade:', error)
      }
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gerenciamento de Unidades</CardTitle>
        <CardDescription>
          Gerencie as unidades da empresa.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Unidades Cadastradas</h3>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Unidade
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Criar Nova Unidade</DialogTitle>
                  <DialogDescription>
                    Adicione uma nova unidade ao sistema.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateUnit} className="space-y-4">
                  <div>
                    <Label htmlFor="unitName">Nome da Unidade</Label>
                    <Input
                      id="unitName"
                      value={newUnit.name}
                      onChange={(e) => setNewUnit({...newUnit, name: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="unitDescription">Descrição</Label>
                    <Textarea
                      id="unitDescription"
                      value={newUnit.description}
                      onChange={(e) => setNewUnit({...newUnit, description: e.target.value})}
                    />
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={createUnitMutation.isPending}>
                      {createUnitMutation.isPending ? "Criando..." : "Criar"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
          
          <div className="space-y-2">
            {units.map((unit) => (
              <div key={unit.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <div className="font-medium">{unit.name}</div>
                  {unit.description && (
                    <div className="text-sm text-muted-foreground">{unit.description}</div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Dialog open={isEditDialogOpen && editingUnit?.id === unit.id} onOpenChange={setIsEditDialogOpen}>
                    <DialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setEditingUnit(unit)
                          setIsEditDialogOpen(true)
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Editar Unidade</DialogTitle>
                        <DialogDescription>
                          Atualize as informações da unidade.
                        </DialogDescription>
                      </DialogHeader>
                      {editingUnit && (
                        <form onSubmit={handleUpdateUnit} className="space-y-4">
                          <div>
                            <Label htmlFor="editUnitName">Nome da Unidade</Label>
                            <Input
                              id="editUnitName"
                              value={editingUnit.name}
                              onChange={(e) => setEditingUnit({...editingUnit, name: e.target.value})}
                              required
                            />
                          </div>
                          <div>
                            <Label htmlFor="editUnitDescription">Descrição</Label>
                            <Textarea
                              id="editUnitDescription"
                              value={editingUnit.description || ""}
                              onChange={(e) => setEditingUnit({...editingUnit, description: e.target.value})}
                            />
                          </div>
                          <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                              Cancelar
                            </Button>
                            <Button type="submit" disabled={updateUnitMutation.isPending}>
                              {updateUnitMutation.isPending ? "Salvando..." : "Salvar"}
                            </Button>
                          </DialogFooter>
                        </form>
                      )}
                    </DialogContent>
                  </Dialog>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleDeleteUnit(unit.id)}
                    disabled={deleteUnitMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
