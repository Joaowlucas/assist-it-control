
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
import { ImageIcon, Plus, MapPin, Package } from "lucide-react"
import { useEquipment, useCreateEquipment } from "@/hooks/useEquipment"
import { useUnits } from "@/hooks/useUnits"
import { useUploadEquipmentPhoto } from "@/hooks/useEquipmentPhotos"
import { useAuth } from "@/hooks/useAuth"
import { useEquipmentFilters } from "@/hooks/useEquipmentFilters"
import { ImageUpload } from "@/components/ImageUpload"
import { EquipmentPhotoGallery } from "@/components/EquipmentPhotoGallery"
import { EquipmentFilters } from "@/components/EquipmentFilters"
import { EquipmentReports } from "@/components/EquipmentReports"

export default function Equipment() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedEquipment, setSelectedEquipment] = useState<string | null>(null)
  const [images, setImages] = useState<File[]>([])
  
  const { filters, updateFilter, clearFilters, hasActiveFilters } = useEquipmentFilters()
  const { data: equipment, isLoading: loadingEquipment, error: equipmentError } = useEquipment(filters)
  const { data: units, isLoading: loadingUnits } = useUnits()
  const { profile } = useAuth()
  const createEquipment = useCreateEquipment()
  const uploadPhoto = useUploadEquipmentPhoto()

  const canEdit = profile?.role === 'admin' || profile?.role === 'technician'

  const getStatusColor = (status: string) => {
    switch (status) {
      case "disponivel": return "outline"
      case "em_uso": return "default"
      case "manutencao": return "secondary"
      case "descartado": return "destructive"
      default: return "default"
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "disponivel": return "Disponível"
      case "em_uso": return "Em Uso"
      case "manutencao": return "Manutenção"
      case "descartado": return "Descartado"
      default: return status
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const formData = new FormData(e.target as HTMLFormElement)
    
    console.log('Form submission started')
    
    // Helper function to get form field value or null
    const getFieldValue = (name: string): string | null => {
      const value = formData.get(name) as string
      return value && value.trim() !== '' ? value.trim() : null
    }

    const equipmentData = {
      name: formData.get('name') as string, // Required field
      type: formData.get('type') as string, // Required field
      brand: getFieldValue('brand'),
      model: getFieldValue('model'),
      serial_number: getFieldValue('serialNumber'),
      location: getFieldValue('location'),
      purchase_date: getFieldValue('purchaseDate'),
      warranty_end_date: getFieldValue('warrantyExpiry'),
      description: getFieldValue('notes'),
      unit_id: getFieldValue('unitId'),
      tombamento: getFieldValue('tombamento'),
      status: 'disponivel' as const
    }

    console.log('Equipment data to be submitted:', equipmentData)

    // Validate required fields
    if (!equipmentData.name || !equipmentData.type) {
      console.error('Name and type are required fields')
      return
    }

    try {
      console.log('Creating equipment...')
      const newEquipment = await createEquipment.mutateAsync(equipmentData)
      console.log('Equipment created successfully:', newEquipment)
      
      // Upload photos if any
      if (images.length > 0) {
        console.log('Uploading photos:', images.length)
        for (let i = 0; i < images.length; i++) {
          try {
            await uploadPhoto.mutateAsync({
              equipmentId: newEquipment.id,
              file: images[i],
              isPrimary: i === 0 // First image is primary
            })
            console.log(`Photo ${i + 1} uploaded successfully`)
          } catch (photoError) {
            console.error(`Error uploading photo ${i + 1}:`, photoError)
          }
        }
      }
      
      setIsDialogOpen(false)
      setImages([])
      
      // Reset form
      const form = e.target as HTMLFormElement
      form.reset()
      console.log('Form reset completed')
    } catch (error) {
      console.error('Error creating equipment:', error)
    }
  }

  if (loadingEquipment || loadingUnits) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (equipmentError) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-red-600">Erro ao carregar equipamentos</h3>
          <p className="text-muted-foreground mt-2">
            {equipmentError.message || 'Ocorreu um erro inesperado'}
          </p>
        </div>
      </div>
    )
  }

  const hasEquipment = equipment && equipment.length > 0

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Equipamentos</h2>
          <p className="text-muted-foreground">
            Gerencie o inventário de equipamentos da empresa
          </p>
        </div>
        
        <div className="flex gap-2">
          <EquipmentReports />
          
          {canEdit && (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Equipamento
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Adicionar Novo Equipamento</DialogTitle>
                  <DialogDescription>
                    Cadastre um novo equipamento no inventário
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid gap-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="name">Nome do Equipamento *</Label>
                        <Input 
                          id="name" 
                          name="name" 
                          placeholder="Ex: Desktop Marketing 01"
                          required 
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="tombamento">Tombamento</Label>
                        <Input 
                          id="tombamento" 
                          name="tombamento" 
                          placeholder="Deixe vazio para gerar automaticamente"
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="type">Tipo *</Label>
                        <Select name="type" required>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o tipo" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Computador">Computador</SelectItem>
                            <SelectItem value="Monitor">Monitor</SelectItem>
                            <SelectItem value="Impressora">Impressora</SelectItem>
                            <SelectItem value="Notebook">Notebook</SelectItem>
                            <SelectItem value="Tablet">Tablet</SelectItem>
                            <SelectItem value="Telefone">Telefone</SelectItem>
                            <SelectItem value="Outros">Outros</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label htmlFor="unitId">Unidade</Label>
                        <Select name="unitId">
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a unidade" />
                          </SelectTrigger>
                          <SelectContent>
                            {units?.map((unit) => (
                              <SelectItem key={unit.id} value={unit.id}>
                                {unit.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="brand">Marca</Label>
                        <Input 
                          id="brand" 
                          name="brand" 
                          placeholder="Ex: Dell, HP, Lenovo"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="model">Modelo</Label>
                        <Input 
                          id="model" 
                          name="model" 
                          placeholder="Ex: OptiPlex 7090"
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="serialNumber">Número de Série</Label>
                        <Input 
                          id="serialNumber" 
                          name="serialNumber" 
                          placeholder="Número de série do equipamento"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="location">Localização</Label>
                        <Input 
                          id="location" 
                          name="location" 
                          placeholder="Ex: Marketing - Mesa 15"
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="purchaseDate">Data de Compra</Label>
                        <Input 
                          id="purchaseDate" 
                          name="purchaseDate" 
                          type="date"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="warrantyExpiry">Vencimento da Garantia</Label>
                        <Input 
                          id="warrantyExpiry" 
                          name="warrantyExpiry" 
                          type="date"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="notes">Descrição/Observações</Label>
                      <Textarea 
                        id="notes" 
                        name="notes" 
                        placeholder="Descrição e observações sobre o equipamento"
                      />
                    </div>

                    <ImageUpload
                      images={images}
                      onImagesChange={setImages}
                      maxImages={5}
                    />
                  </div>
                  
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={createEquipment.isPending}>
                      {createEquipment.isPending ? 'Criando...' : 'Adicionar Equipamento'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      <EquipmentFilters
        filters={filters}
        onFilterChange={updateFilter}
        onClearFilters={clearFilters}
        hasActiveFilters={hasActiveFilters}
      />

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Inventário de Equipamentos</CardTitle>
              <CardDescription>
                {equipment?.length || 0} equipamentos encontrados
                {hasActiveFilters && ' (filtrados)'}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {!hasEquipment ? (
            <div className="text-center py-12">
              <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold text-muted-foreground mb-2">
                {hasActiveFilters ? 'Nenhum equipamento encontrado' : 'Nenhum equipamento cadastrado'}
              </h3>
              <p className="text-muted-foreground mb-4">
                {hasActiveFilters 
                  ? 'Tente ajustar os filtros para encontrar equipamentos.'
                  : 'Comece adicionando equipamentos ao inventário.'
                }
              </p>
              {hasActiveFilters ? (
                <Button variant="outline" onClick={clearFilters}>
                  Limpar Filtros
                </Button>
              ) : canEdit ? (
                <Button onClick={() => setIsDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Primeiro Equipamento
                </Button>
              ) : null}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tombamento</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Marca/Modelo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Localização</TableHead>
                  <TableHead>Unidade</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {equipment?.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.tombamento || '-'}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{item.name}</div>
                        {item.serial_number && (
                          <div className="text-sm text-muted-foreground">
                            S/N: {item.serial_number}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{item.type}</TableCell>
                    <TableCell>
                      <div>
                        {item.brand && <div>{item.brand}</div>}
                        {item.model && (
                          <div className="text-sm text-muted-foreground">{item.model}</div>
                        )}
                        {!item.brand && !item.model && '-'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusColor(item.status) as any}>
                        {getStatusLabel(item.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {item.location ? (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {item.location}
                        </div>
                      ) : '-'}
                    </TableCell>
                    <TableCell>
                      {item.unit?.name || '-'}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedEquipment(item.id)}
                      >
                        <ImageIcon className="h-4 w-4 mr-1" />
                        Ver Fotos
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialog para visualizar fotos do equipamento */}
      <Dialog open={!!selectedEquipment} onOpenChange={() => setSelectedEquipment(null)}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Fotos do Equipamento</DialogTitle>
            <DialogDescription>
              Visualize e gerencie as fotos do equipamento
            </DialogDescription>
          </DialogHeader>
          {selectedEquipment && (
            <EquipmentPhotoGallery 
              equipmentId={selectedEquipment} 
              canEdit={canEdit}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
