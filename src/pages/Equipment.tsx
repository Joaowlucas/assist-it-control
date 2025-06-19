
import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useEquipment, useCreateEquipment, useUpdateEquipment, useDeleteEquipment } from "@/hooks/useEquipment"
import { useUnits } from "@/hooks/useUnits"
import { useTechnicianUnits } from "@/hooks/useTechnicianUnits"
import { useAuth } from "@/hooks/useAuth"
import { useEquipmentPhotos } from "@/hooks/useEquipmentPhotos"
import { useSystemSettings } from "@/hooks/useSystemSettings"
import { EquipmentPhotoGallery } from "@/components/EquipmentPhotoGallery"
import { EquipmentPDFPreviewDialog } from "@/components/EquipmentPDFPreviewDialog"
import { Plus, Search, Eye, Edit, Trash2, Camera, FileText, Package, MapPin, Calendar, Shield, Wrench } from "lucide-react"
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { EQUIPMENT_TYPES } from "@/constants/equipmentTypes"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"

export default function Equipment() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isPhotoGalleryOpen, setIsPhotoGalleryOpen] = useState(false)
  const [isPdfPreviewOpen, setIsPdfPreviewOpen] = useState(false)
  const [selectedEquipment, setSelectedEquipment] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState("")

  const { profile } = useAuth()
  const { data: equipment = [], isLoading } = useEquipment()
  const { data: allUnits = [] } = useUnits()
  const { data: technicianUnits = [] } = useTechnicianUnits(profile?.role === 'technician' ? profile.id : undefined)
  const { data: systemSettings } = useSystemSettings()
  const { data: equipmentPhotos = [] } = useEquipmentPhotos(selectedEquipment?.id)
  const createEquipment = useCreateEquipment()
  const updateEquipment = useUpdateEquipment()
  const deleteEquipment = useDeleteEquipment()

  // Filtrar unidades baseado no role
  const availableUnits = profile?.role === 'technician' 
    ? allUnits.filter(unit => technicianUnits.some(tu => tu.unit_id === unit.id))
    : allUnits

  const filteredEquipment = equipment.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.tombamento?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'disponivel':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'em_uso':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'manutencao':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      case 'inativo':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'disponivel':
        return 'Disponível'
      case 'em_uso':
        return 'Em Uso'
      case 'manutencao':
        return 'Manutenção'
      case 'inativo':
        return 'Inativo'
      default:
        return status
    }
  }

  const handleCreateEquipment = async (e: React.FormEvent) => {
    e.preventDefault()
    const formData = new FormData(e.target as HTMLFormElement)
    
    const equipmentData = {
      name: formData.get('name') as string,
      type: formData.get('type') as string,
      brand: formData.get('brand') as string,
      model: formData.get('model') as string,
      serial_number: formData.get('serial_number') as string,
      description: formData.get('description') as string,
      location: formData.get('location') as string,
      unit_id: formData.get('unit_id') as string,
      purchase_date: formData.get('purchase_date') as string || null,
      warranty_end_date: formData.get('warranty_end_date') as string || null,
      status: 'disponivel' as const,
    }

    await createEquipment.mutateAsync(equipmentData)
    setIsCreateDialogOpen(false)
  }

  const handleUpdateEquipment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedEquipment) return

    const formData = new FormData(e.target as HTMLFormElement)
    
    const equipmentData = {
      id: selectedEquipment.id,
      name: formData.get('name') as string,
      type: formData.get('type') as string,
      brand: formData.get('brand') as string,
      model: formData.get('model') as string,
      serial_number: formData.get('serial_number') as string,
      description: formData.get('description') as string,
      location: formData.get('location') as string,
      unit_id: formData.get('unit_id') as string,
      purchase_date: formData.get('purchase_date') as string || null,
      warranty_end_date: formData.get('warranty_end_date') as string || null,
      status: formData.get('status') as any,
    }

    await updateEquipment.mutateAsync(equipmentData)
    setIsEditDialogOpen(false)
  }

  const openPhotoGallery = (equipment: any) => {
    setSelectedEquipment(equipment)
    setIsPhotoGalleryOpen(true)
  }

  const openPdfPreview = (equipment: any) => {
    setSelectedEquipment(equipment)
    setIsPdfPreviewOpen(true)
  }

  const openEditDialog = (equipment: any) => {
    setSelectedEquipment(equipment)
    setIsEditDialogOpen(true)
  }

  const handleDeleteEquipment = async (equipmentId: string) => {
    await deleteEquipment.mutateAsync(equipmentId)
  }

  // Estatísticas dos equipamentos
  const stats = [
    {
      title: "Total",
      value: equipment.length,
      icon: Package,
      color: "text-blue-500",
      bgColor: "bg-blue-50 dark:bg-blue-950"
    },
    {
      title: "Disponíveis",
      value: equipment.filter(e => e.status === 'disponivel').length,
      icon: Shield,
      color: "text-green-500",
      bgColor: "bg-green-50 dark:bg-green-950"
    },
    {
      title: "Em Uso",
      value: equipment.filter(e => e.status === 'em_uso').length,
      icon: Wrench,
      color: "text-blue-500",
      bgColor: "bg-blue-50 dark:bg-blue-950"
    },
    {
      title: "Manutenção",
      value: equipment.filter(e => e.status === 'manutencao').length,
      icon: Wrench,
      color: "text-yellow-500",
      bgColor: "bg-yellow-50 dark:bg-yellow-950"
    }
  ]

  return (
    <div className="space-y-4 md:space-y-6 p-3 md:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Equipamentos</h2>
          <p className="text-muted-foreground">
            Gerencie todos os equipamentos
          </p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Novo Equipamento
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] mx-4 max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Criar Novo Equipamento</DialogTitle>
              <DialogDescription>
                Preencha as informações do equipamento
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateEquipment} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Nome</Label>
                  <Input id="name" name="name" required />
                </div>
                <div>
                  <Label htmlFor="type">Tipo</Label>
                  <Select name="type" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {EQUIPMENT_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="brand">Marca</Label>
                  <Input id="brand" name="brand" />
                </div>
                <div>
                  <Label htmlFor="model">Modelo</Label>
                  <Input id="model" name="model" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="serial_number">Número de Série</Label>
                  <Input id="serial_number" name="serial_number" />
                </div>
                <div>
                  <Label htmlFor="unit_id">Unidade</Label>
                  <Select name="unit_id" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a unidade" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableUnits.map((unit) => (
                        <SelectItem key={unit.id} value={unit.id}>
                          {unit.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="description">Descrição</Label>
                <Textarea id="description" name="description" />
              </div>

              <div>
                <Label htmlFor="location">Localização</Label>
                <Input id="location" name="location" placeholder="Ex: Sala 101, Andar 2" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="purchase_date">Data de Compra</Label>
                  <Input id="purchase_date" name="purchase_date" type="date" />
                </div>
                <div>
                  <Label htmlFor="warranty_end_date">Fim da Garantia</Label>
                  <Input id="warranty_end_date" name="warranty_end_date" type="date" />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={createEquipment.isPending}>
                  {createEquipment.isPending ? 'Criando...' : 'Criar Equipamento'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-3 md:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs md:text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </p>
                  <p className="text-xl md:text-2xl font-bold">{stat.value}</p>
                </div>
                <div className={`p-2 md:p-3 rounded-full ${stat.bgColor}`}>
                  <stat.icon className={`h-4 w-4 md:h-6 md:w-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar equipamentos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardHeader>
      </Card>

      {/* Lista de Equipamentos */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Equipamentos</CardTitle>
          <CardDescription>
            {filteredEquipment.length} de {equipment.length} equipamentos
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {/* Tabela para desktop */}
          <div className="hidden lg:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tombamento</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Marca/Modelo</TableHead>
                  <TableHead>Unidade</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Localização</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEquipment.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">
                      {item.tombamento}
                    </TableCell>
                    <TableCell>{item.name}</TableCell>
                    <TableCell className="capitalize">{item.type}</TableCell>
                    <TableCell>
                      {item.brand && item.model ? `${item.brand} ${item.model}` : item.brand || item.model || '-'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>{item.unit?.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(item.status)}>
                        {getStatusLabel(item.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>{item.location || '-'}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openPhotoGallery(item)}
                        >
                          <Camera className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openPdfPreview(item)}
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(item)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja excluir o equipamento "{item.name}"? 
                                Esta ação não pode ser desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => handleDeleteEquipment(item.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Excluir
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Cards para mobile */}
          <div className="lg:hidden space-y-4 p-4">
            {filteredEquipment.map((item) => (
              <Card key={item.id} className="border">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-medium text-base">{item.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {item.tombamento} • {item.type}
                        </p>
                      </div>
                      <Badge className={`${getStatusColor(item.status)} text-xs`}>
                        {getStatusLabel(item.status)}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Marca/Modelo:</span>
                        <div className="font-medium">
                          {item.brand && item.model ? `${item.brand} ${item.model}` : item.brand || item.model || '-'}
                        </div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Unidade:</span>
                        <div className="font-medium">{item.unit?.name}</div>
                      </div>
                    </div>
                    
                    {item.location && (
                      <div className="text-sm">
                        <span className="text-muted-foreground">Localização:</span>
                        <div className="font-medium">{item.location}</div>
                      </div>
                    )}
                    
                    <div className="flex justify-end gap-1 pt-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openPhotoGallery(item)}
                      >
                        <Camera className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openPdfPreview(item)}
                      >
                        <FileText className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(item)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                            <AlertDialogDescription>
                              Tem certeza que deseja excluir o equipamento "{item.name}"? 
                              Esta ação não pode ser desfeita.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => handleDeleteEquipment(item.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Excluir
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredEquipment.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum equipamento encontrado
            </div>
          )}
        </CardContent>
      </Card>

      {/* Diálogos */}
      {selectedEquipment && (
        <>
          <EquipmentPhotoGallery
            equipmentId={selectedEquipment.id}
            open={isPhotoGalleryOpen}
            onOpenChange={setIsPhotoGalleryOpen}
          />

          <EquipmentPDFPreviewDialog
            photos={equipmentPhotos}
            systemSettings={systemSettings}
            tombamento={selectedEquipment.tombamento}
            open={isPdfPreviewOpen}
            onOpenChange={setIsPdfPreviewOpen}
          />

          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="sm:max-w-[600px] mx-4 max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Editar Equipamento</DialogTitle>
                <DialogDescription>
                  Altere as informações do equipamento
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleUpdateEquipment} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-name">Nome</Label>
                    <Input id="edit-name" name="name" defaultValue={selectedEquipment.name} required />
                  </div>
                  <div>
                    <Label htmlFor="edit-type">Tipo</Label>
                    <Select name="type" defaultValue={selectedEquipment.type} required>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {EQUIPMENT_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-brand">Marca</Label>
                    <Input id="edit-brand" name="brand" defaultValue={selectedEquipment.brand || ''} />
                  </div>
                  <div>
                    <Label htmlFor="edit-model">Modelo</Label>
                    <Input id="edit-model" name="model" defaultValue={selectedEquipment.model || ''} />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-serial_number">Número de Série</Label>
                    <Input id="edit-serial_number" name="serial_number" defaultValue={selectedEquipment.serial_number || ''} />
                  </div>
                  <div>
                    <Label htmlFor="edit-unit_id">Unidade</Label>
                    <Select name="unit_id" defaultValue={selectedEquipment.unit_id} required>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {availableUnits.map((unit) => (
                          <SelectItem key={unit.id} value={unit.id}>
                            {unit.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="edit-description">Descrição</Label>
                  <Textarea id="edit-description" name="description" defaultValue={selectedEquipment.description || ''} />
                </div>

                <div>
                  <Label htmlFor="edit-location">Localização</Label>
                  <Input id="edit-location" name="location" defaultValue={selectedEquipment.location || ''} />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="edit-purchase_date">Data de Compra</Label>
                    <Input 
                      id="edit-purchase_date" 
                      name="purchase_date" 
                      type="date" 
                      defaultValue={selectedEquipment.purchase_date || ''} 
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-warranty_end_date">Fim da Garantia</Label>
                    <Input 
                      id="edit-warranty_end_date" 
                      name="warranty_end_date" 
                      type="date" 
                      defaultValue={selectedEquipment.warranty_end_date || ''} 
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-status">Status</Label>
                    <Select name="status" defaultValue={selectedEquipment.status} required>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="disponivel">Disponível</SelectItem>
                        <SelectItem value="em_uso">Em Uso</SelectItem>
                        <SelectItem value="manutencao">Manutenção</SelectItem>
                        <SelectItem value="inativo">Inativo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={updateEquipment.isPending}>
                    {updateEquipment.isPending ? 'Salvando...' : 'Salvar Alterações'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  )
}
