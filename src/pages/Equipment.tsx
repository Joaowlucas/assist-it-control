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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ImageIcon, Plus, Calendar, MapPin, Edit, FileText, Printer } from "lucide-react"
import { useEquipment, useCreateEquipment, useUpdateEquipment } from "@/hooks/useEquipment"
import { useUnits } from "@/hooks/useUnits"
import { useUploadEquipmentPhoto } from "@/hooks/useEquipmentPhotos"
import { useAuth } from "@/hooks/useAuth"
import { useEquipmentPDF } from "@/hooks/useEquipmentPDF"
import { ImageUpload } from "@/components/ImageUpload"
import { EquipmentPhotoGallery } from "@/components/EquipmentPhotoGallery"
import { EquipmentPDFPreviewDialog } from "@/components/EquipmentPDFPreviewDialog"
import { Tables } from "@/integrations/supabase/types"
import { useIsMobile } from "@/hooks/use-mobile"

type Equipment = Tables<'equipment'> & {
  unit?: { name: string } | null
}

export default function Equipment() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedEquipment, setSelectedEquipment] = useState<string | null>(null)
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null)
  const [images, setImages] = useState<File[]>([])
  const [isPDFPreviewOpen, setIsPDFPreviewOpen] = useState(false)
  const [previewData, setPreviewData] = useState<{
    equipment: any
    photos: any[]
    systemSettings: any
    tombamento: string
  } | null>(null)
  
  const { data: equipment, isLoading: loadingEquipment } = useEquipment()
  const { data: units } = useUnits()
  const { profile } = useAuth()
  const isMobile = useIsMobile()
  const createEquipment = useCreateEquipment()
  const updateEquipment = useUpdateEquipment()
  const uploadPhoto = useUploadEquipmentPhoto()
  const { previewEquipmentPDF, isLoadingPreview } = useEquipmentPDF()

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

  const handleEdit = (item: Equipment) => {
    setEditingEquipment(item)
    setIsEditDialogOpen(true)
  }

  const handlePreviewPDF = async (item: Equipment) => {
    try {
      const data = await previewEquipmentPDF(item.id, item.tombamento || item.id)
      setPreviewData({
        equipment: data.equipment,
        photos: data.photos,
        systemSettings: data.systemSettings,
        tombamento: item.tombamento || item.id
      })
      setIsPDFPreviewOpen(true)
    } catch (error) {
      console.error('Erro ao carregar pré-visualização:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const formData = new FormData(e.target as HTMLFormElement)
    
    const equipmentData = {
      name: formData.get('name') as string,
      type: formData.get('type') as string,
      brand: formData.get('brand') as string || null,
      model: formData.get('model') as string || null,
      serial_number: formData.get('serialNumber') as string || null,
      location: formData.get('location') as string || null,
      purchase_date: formData.get('purchaseDate') as string || null,
      warranty_end_date: formData.get('warrantyExpiry') as string || null,
      description: formData.get('notes') as string || null,
      unit_id: formData.get('unitId') as string || null,
      tombamento: formData.get('tombamento') as string || null,
    }

    try {
      const newEquipment = await createEquipment.mutateAsync(equipmentData)
      
      // Upload photos if any
      if (images.length > 0) {
        for (let i = 0; i < images.length; i++) {
          await uploadPhoto.mutateAsync({
            equipmentId: newEquipment.id,
            file: images[i],
            isPrimary: i === 0 // First image is primary
          })
        }
      }
      
      setIsDialogOpen(false)
      setImages([])
      
      // Reset form
      const form = e.target as HTMLFormElement
      form.reset()
    } catch (error) {
      console.error('Error creating equipment:', error)
    }
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingEquipment) return

    const formData = new FormData(e.target as HTMLFormElement)
    
    const equipmentData = {
      id: editingEquipment.id,
      name: formData.get('name') as string,
      type: formData.get('type') as string,
      brand: formData.get('brand') as string || null,
      model: formData.get('model') as string || null,
      serial_number: formData.get('serialNumber') as string || null,
      location: formData.get('location') as string || null,
      purchase_date: formData.get('purchaseDate') as string || null,
      warranty_end_date: formData.get('warrantyExpiry') as string || null,
      description: formData.get('notes') as string || null,
      unit_id: formData.get('unitId') as string || null,
      tombamento: formData.get('tombamento') as string || null,
      status: formData.get('status') as any,
    }

    try {
      await updateEquipment.mutateAsync(equipmentData)
      setIsEditDialogOpen(false)
      setEditingEquipment(null)
    } catch (error) {
      console.error('Error updating equipment:', error)
    }
  }

  if (loadingEquipment) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-4 md:space-y-6 p-4 md:p-0">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div className="space-y-1">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">Equipamentos</h2>
          <p className="text-sm md:text-base text-muted-foreground">
            Gerencie o inventário de equipamentos da empresa
          </p>
        </div>
        
        {canEdit && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto">
                <Plus className="h-4 w-4 mr-2" />
                {isMobile ? "Adicionar" : "Adicionar Equipamento"}
              </Button>
            </DialogTrigger>
            <DialogContent className={`${isMobile ? 'w-[95vw] max-w-[95vw] h-[90vh]' : 'sm:max-w-[700px]'} max-h-[90vh] overflow-y-auto`}>
              <DialogHeader>
                <DialogTitle>Adicionar Novo Equipamento</DialogTitle>
                <DialogDescription>
                  Cadastre um novo equipamento no inventário
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-4">
                  <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-2'}`}>
                    <div>
                      <Label htmlFor="name">Nome do Equipamento</Label>
                      <Input 
                        id="name" 
                        name="name" 
                        placeholder="Ex: Desktop Marketing 01"
                        required 
                        className="mt-1"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="tombamento">Tombamento</Label>
                      <Input 
                        id="tombamento" 
                        name="tombamento" 
                        placeholder="Deixe vazio para gerar automaticamente"
                        className="mt-1"
                      />
                    </div>
                  </div>
                  
                  <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-2'}`}>
                    <div>
                      <Label htmlFor="type">Tipo</Label>
                      <Select name="type" required>
                        <SelectTrigger className="mt-1">
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
                        <SelectTrigger className="mt-1">
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
                  
                  <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-2'}`}>
                    <div>
                      <Label htmlFor="brand">Marca</Label>
                      <Input 
                        id="brand" 
                        name="brand" 
                        placeholder="Ex: Dell, HP, Lenovo"
                        className="mt-1"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="model">Modelo</Label>
                      <Input 
                        id="model" 
                        name="model" 
                        placeholder="Ex: OptiPlex 7090"
                        className="mt-1"
                      />
                    </div>
                  </div>
                  
                  <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-2'}`}>
                    <div>
                      <Label htmlFor="serialNumber">Número de Série</Label>
                      <Input 
                        id="serialNumber" 
                        name="serialNumber" 
                        placeholder="Número de série do equipamento"
                        className="mt-1"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="location">Localização</Label>
                      <Input 
                        id="location" 
                        name="location" 
                        placeholder="Ex: Marketing - Mesa 15"
                        className="mt-1"
                      />
                    </div>
                  </div>
                  
                  <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-2'}`}>
                    <div>
                      <Label htmlFor="purchaseDate">Data de Compra</Label>
                      <Input 
                        id="purchaseDate" 
                        name="purchaseDate" 
                        type="date"
                        className="mt-1"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="warrantyExpiry">Vencimento da Garantia</Label>
                      <Input 
                        id="warrantyExpiry" 
                        name="warrantyExpiry" 
                        type="date"
                        className="mt-1"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="notes">Descrição/Observações</Label>
                    <Textarea 
                      id="notes" 
                      name="notes" 
                      placeholder="Descrição e observações sobre o equipamento"
                      className="mt-1"
                    />
                  </div>

                  <ImageUpload
                    images={images}
                    onImagesChange={setImages}
                    maxImages={5}
                  />
                </div>
                
                <div className={`flex gap-2 ${isMobile ? 'flex-col' : 'justify-end'}`}>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className={isMobile ? 'w-full' : ''}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={createEquipment.isPending} className={isMobile ? 'w-full' : ''}>
                    {createEquipment.isPending ? 'Criando...' : 'Adicionar Equipamento'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-card-foreground">Inventário de Equipamentos</CardTitle>
          <CardDescription>
            Lista completa de todos os equipamentos da empresa
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {/* Desktop Table */}
          <div className="hidden lg:block">
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
                    <TableCell className="font-medium">{item.tombamento}</TableCell>
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
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusColor(item.status) as any}>
                        {getStatusLabel(item.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {item.location && (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {item.location}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {item.unit?.name || '-'}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {canEdit && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(item)}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Editar
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedEquipment(item.id)}
                        >
                          <ImageIcon className="h-4 w-4 mr-1" />
                          Ver Fotos
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePreviewPDF(item)}
                          disabled={isLoadingPreview}
                        >
                          <FileText className="h-4 w-4 mr-1" />
                          {isLoadingPreview ? 'Carregando...' : 'Visualizar PDF'}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Cards */}
          <div className="lg:hidden space-y-4 p-4">
            {equipment?.map((item) => (
              <Card key={item.id} className="border-border bg-muted/50">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-base">{item.name}</CardTitle>
                      <CardDescription className="text-sm">
                        {item.tombamento && `Tomb: ${item.tombamento}`}
                      </CardDescription>
                    </div>
                    <Badge variant={getStatusColor(item.status) as any} className="text-xs">
                      {getStatusLabel(item.status)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="font-medium">Tipo:</span> {item.type}
                    </div>
                    <div>
                      <span className="font-medium">Unidade:</span> {item.unit?.name || '-'}
                    </div>
                    {item.brand && (
                      <div>
                        <span className="font-medium">Marca:</span> {item.brand}
                      </div>
                    )}
                    {item.model && (
                      <div>
                        <span className="font-medium">Modelo:</span> {item.model}
                      </div>
                    )}
                  </div>
                  
                  {item.location && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      {item.location}
                    </div>
                  )}
                  
                  {item.serial_number && (
                    <div className="text-sm text-muted-foreground">
                      S/N: {item.serial_number}
                    </div>
                  )}
                  
                  <div className="flex flex-col gap-2 pt-2">
                    {canEdit && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(item)}
                        className="w-full justify-start"
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Editar
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedEquipment(item.id)}
                      className="w-full justify-start"
                    >
                      <ImageIcon className="h-4 w-4 mr-2" />
                      Ver Fotos
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePreviewPDF(item)}
                      disabled={isLoadingPreview}
                      className="w-full justify-start"
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      {isLoadingPreview ? 'Carregando...' : 'Visualizar PDF'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog - keeping existing content but with mobile optimization */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className={`${isMobile ? 'w-[95vw] max-w-[95vw] h-[90vh]' : 'sm:max-w-[700px]'} max-h-[90vh] overflow-y-auto`}>
          <DialogHeader>
            <DialogTitle>Editar Equipamento</DialogTitle>
            <DialogDescription>
              Altere as informações do equipamento
            </DialogDescription>
          </DialogHeader>
          {editingEquipment && (
            <form onSubmit={handleEditSubmit} className="space-y-4">
              {/* Similar form structure as above but with edit values */}
              <div className="grid gap-4">
                <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-2'}`}>
                  <div>
                    <Label htmlFor="edit-name">Nome do Equipamento</Label>
                    <Input 
                      id="edit-name" 
                      name="name" 
                      defaultValue={editingEquipment.name}
                      required 
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="edit-tombamento">Tombamento</Label>
                    <Input 
                      id="edit-tombamento" 
                      name="tombamento" 
                      defaultValue={editingEquipment.tombamento || ''}
                      className="mt-1"
                    />
                  </div>
                </div>
                
                <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-2'}`}>
                  <div>
                    <Label htmlFor="edit-type">Tipo</Label>
                    <Select name="type" defaultValue={editingEquipment.type} required>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
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
                    <Label htmlFor="edit-unitId">Unidade</Label>
                    <Select name="unitId" defaultValue={editingEquipment.unit_id || ''}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
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
                
                <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-2'}`}>
                  <div>
                    <Label htmlFor="edit-brand">Marca</Label>
                    <Input 
                      id="edit-brand" 
                      name="brand" 
                      defaultValue={editingEquipment.brand || ''}
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="edit-model">Modelo</Label>
                    <Input 
                      id="edit-model" 
                      name="model" 
                      defaultValue={editingEquipment.model || ''}
                      className="mt-1"
                    />
                  </div>
                </div>
                
                <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-2'}`}>
                  <div>
                    <Label htmlFor="edit-serialNumber">Número de Série</Label>
                    <Input 
                      id="edit-serialNumber" 
                      name="serialNumber" 
                      defaultValue={editingEquipment.serial_number || ''}
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="edit-location">Localização</Label>
                    <Input 
                      id="edit-location" 
                      name="location" 
                      defaultValue={editingEquipment.location || ''}
                      className="mt-1"
                    />
                  </div>
                </div>
                
                <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-3'}`}>
                  <div>
                    <Label htmlFor="edit-status">Status</Label>
                    <Select name="status" defaultValue={editingEquipment.status} required>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="disponivel">Disponível</SelectItem>
                        <SelectItem value="em_uso">Em Uso</SelectItem>
                        <SelectItem value="manutencao">Manutenção</SelectItem>
                        <SelectItem value="descartado">Descartado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="edit-purchaseDate">Data de Compra</Label>
                    <Input 
                      id="edit-purchaseDate" 
                      name="purchaseDate" 
                      type="date"
                      defaultValue={editingEquipment.purchase_date || ''}
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="edit-warrantyExpiry">Vencimento da Garantia</Label>
                    <Input 
                      id="edit-warrantyExpiry" 
                      name="warrantyExpiry" 
                      type="date"
                      defaultValue={editingEquipment.warranty_end_date || ''}
                      className="mt-1"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="edit-notes">Descrição/Observações</Label>
                  <Textarea 
                    id="edit-notes" 
                    name="notes" 
                    defaultValue={editingEquipment.description || ''}
                    className="mt-1"
                  />
                </div>
              </div>
              
              <div className={`flex gap-2 ${isMobile ? 'flex-col' : 'justify-end'}`}>
                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)} className={isMobile ? 'w-full' : ''}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={updateEquipment.isPending} className={isMobile ? 'w-full' : ''}>
                  {updateEquipment.isPending ? 'Salvando...' : 'Salvar Alterações'}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Photo Gallery Dialog */}
      <Dialog open={!!selectedEquipment} onOpenChange={() => setSelectedEquipment(null)}>
        <DialogContent className={`${isMobile ? 'w-[95vw] max-w-[95vw] h-[90vh]' : 'sm:max-w-[800px]'} max-h-[90vh] overflow-y-auto`}>
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

      {/* PDF Preview Dialog */}
      {previewData && (
        <EquipmentPDFPreviewDialog
          open={isPDFPreviewOpen}
          onOpenChange={setIsPDFPreviewOpen}
          equipment={previewData.equipment}
          photos={previewData.photos}
          systemSettings={previewData.systemSettings}
          tombamento={previewData.tombamento}
        />
      )}
    </div>
  )
}
