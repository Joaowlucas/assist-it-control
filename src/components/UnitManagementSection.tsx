
import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { useUnits } from '@/hooks/useUnits'
import { useCreateUnit, useUpdateUnit, useDeleteUnit } from '@/hooks/useUnitManagement'
import { useForm } from 'react-hook-form'
import { Building2, Plus, Edit, Trash2, Users } from 'lucide-react'

interface UnitFormData {
  name: string
  description: string
}

export function UnitManagementSection() {
  const { data: units, isLoading } = useUnits()
  const createUnit = useCreateUnit()
  const updateUnit = useUpdateUnit()
  const deleteUnit = useDeleteUnit()

  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingUnit, setEditingUnit] = useState<any>(null)

  const createForm = useForm<UnitFormData>({
    defaultValues: { name: '', description: '' }
  })

  const editForm = useForm<UnitFormData>({
    defaultValues: { name: '', description: '' }
  })

  const onCreateSubmit = (data: UnitFormData) => {
    createUnit.mutate(data, {
      onSuccess: () => {
        setIsCreateOpen(false)
        createForm.reset()
      }
    })
  }

  const onEditSubmit = (data: UnitFormData) => {
    if (editingUnit) {
      updateUnit.mutate({ id: editingUnit.id, ...data }, {
        onSuccess: () => {
          setEditingUnit(null)
          editForm.reset()
        }
      })
    }
  }

  const handleEdit = (unit: any) => {
    setEditingUnit(unit)
    editForm.setValue('name', unit.name)
    editForm.setValue('description', unit.description || '')
  }

  const handleDelete = (unitId: string) => {
    deleteUnit.mutate(unitId)
  }

  if (isLoading) {
    return <div>Carregando unidades...</div>
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Gerenciamento de Unidades
            </CardTitle>
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Unidade
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Criar Nova Unidade</DialogTitle>
                </DialogHeader>
                <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="create-name">Nome</Label>
                    <Input
                      id="create-name"
                      {...createForm.register('name', { required: true })}
                      placeholder="Nome da unidade"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="create-description">Descrição</Label>
                    <Textarea
                      id="create-description"
                      {...createForm.register('description')}
                      placeholder="Descrição da unidade"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={createUnit.isPending}>
                      {createUnit.isPending ? 'Criando...' : 'Criar'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {!units || units.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma unidade cadastrada</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {units.map((unit) => (
                <Card key={unit.id} className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium">{unit.name}</h3>
                      <div className="flex items-center gap-1">
                        <Dialog open={editingUnit?.id === unit.id} onOpenChange={(open) => !open && setEditingUnit(null)}>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm" onClick={() => handleEdit(unit)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Editar Unidade</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
                              <div className="space-y-2">
                                <Label htmlFor="edit-name">Nome</Label>
                                <Input
                                  id="edit-name"
                                  {...editForm.register('name', { required: true })}
                                  placeholder="Nome da unidade"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="edit-description">Descrição</Label>
                                <Textarea
                                  id="edit-description"
                                  {...editForm.register('description')}
                                  placeholder="Descrição da unidade"
                                />
                              </div>
                              <div className="flex justify-end gap-2">
                                <Button type="button" variant="outline" onClick={() => setEditingUnit(null)}>
                                  Cancelar
                                </Button>
                                <Button type="submit" disabled={updateUnit.isPending}>
                                  {updateUnit.isPending ? 'Salvando...' : 'Salvar'}
                                </Button>
                              </div>
                            </form>
                          </DialogContent>
                        </Dialog>

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Remover Unidade</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja remover a unidade "{unit.name}"? Esta ação não pode ser desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(unit.id)}>
                                Remover
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                    
                    {unit.description && (
                      <p className="text-sm text-muted-foreground">{unit.description}</p>
                    )}
                    
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <Badge variant="secondary">
                        {unit.profiles?.length || 0} usuários
                      </Badge>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
