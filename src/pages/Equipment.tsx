
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
import { useToast } from "@/hooks/use-toast"

interface Equipment {
  id: string
  name: string
  type: "Computador" | "Monitor" | "Impressora" | "Notebook" | "Tablet" | "Telefone" | "Outros"
  brand: string
  model: string
  serialNumber: string
  status: "Disponível" | "Em Uso" | "Manutenção" | "Descartado"
  location: string
  purchaseDate: string
  warrantyExpiry: string
  notes?: string
}

const mockEquipment: Equipment[] = [
  {
    id: "EQ-001",
    name: "Desktop Marketing 01",
    type: "Computador",
    brand: "Dell",
    model: "OptiPlex 7090",
    serialNumber: "DL123456789",
    status: "Em Uso",
    location: "Marketing - Mesa 15",
    purchaseDate: "2023-01-15",
    warrantyExpiry: "2026-01-15"
  },
  {
    id: "EQ-002",
    name: "Monitor Financeiro",
    type: "Monitor",
    brand: "LG",
    model: "24MK430H",
    serialNumber: "LG987654321",
    status: "Disponível",
    location: "Almoxarifado TI",
    purchaseDate: "2023-03-20",
    warrantyExpiry: "2026-03-20"
  },
  {
    id: "EQ-003",
    name: "Impressora Recepção",
    type: "Impressora",
    brand: "HP",
    model: "LaserJet Pro M404n",
    serialNumber: "HP456789123",
    status: "Manutenção",
    location: "Oficina TI",
    purchaseDate: "2022-08-10",
    warrantyExpiry: "2025-08-10",
    notes: "Problema no toner - aguardando peça"
  }
]

export default function Equipment() {
  const [equipment, setEquipment] = useState<Equipment[]>(mockEquipment)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const { toast } = useToast()

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Disponível": return "outline"
      case "Em Uso": return "default"
      case "Manutenção": return "secondary"
      case "Descartado": return "destructive"
      default: return "default"
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const formData = new FormData(e.target as HTMLFormElement)
    
    const newEquipment: Equipment = {
      id: `EQ-${String(equipment.length + 1).padStart(3, '0')}`,
      name: formData.get('name') as string,
      type: formData.get('type') as any,
      brand: formData.get('brand') as string,
      model: formData.get('model') as string,
      serialNumber: formData.get('serialNumber') as string,
      status: "Disponível",
      location: formData.get('location') as string,
      purchaseDate: formData.get('purchaseDate') as string,
      warrantyExpiry: formData.get('warrantyExpiry') as string,
      notes: formData.get('notes') as string || undefined
    }

    setEquipment([newEquipment, ...equipment])
    setIsDialogOpen(false)
    toast({
      title: "Equipamento adicionado com sucesso!",
      description: `Equipamento ${newEquipment.id} foi adicionado ao inventário.`,
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Equipamentos</h2>
          <p className="text-muted-foreground">
            Gerencie o inventário de equipamentos da empresa
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>Adicionar Equipamento</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Adicionar Novo Equipamento</DialogTitle>
              <DialogDescription>
                Cadastre um novo equipamento no inventário
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4">
                <div>
                  <Label htmlFor="name">Nome do Equipamento</Label>
                  <Input 
                    id="name" 
                    name="name" 
                    placeholder="Ex: Desktop Marketing 01"
                    required 
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="type">Tipo</Label>
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
                    <Label htmlFor="brand">Marca</Label>
                    <Input 
                      id="brand" 
                      name="brand" 
                      placeholder="Ex: Dell, HP, Lenovo"
                      required 
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="model">Modelo</Label>
                    <Input 
                      id="model" 
                      name="model" 
                      placeholder="Ex: OptiPlex 7090"
                      required 
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="serialNumber">Número de Série</Label>
                    <Input 
                      id="serialNumber" 
                      name="serialNumber" 
                      placeholder="Número de série do equipamento"
                      required 
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="location">Localização</Label>
                  <Input 
                    id="location" 
                    name="location" 
                    placeholder="Ex: Marketing - Mesa 15"
                    required 
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="purchaseDate">Data de Compra</Label>
                    <Input 
                      id="purchaseDate" 
                      name="purchaseDate" 
                      type="date"
                      required 
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="warrantyExpiry">Vencimento da Garantia</Label>
                    <Input 
                      id="warrantyExpiry" 
                      name="warrantyExpiry" 
                      type="date"
                      required 
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="notes">Observações</Label>
                  <Textarea 
                    id="notes" 
                    name="notes" 
                    placeholder="Observações adicionais (opcional)"
                  />
                </div>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">Adicionar Equipamento</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Inventário de Equipamentos</CardTitle>
          <CardDescription>
            Lista completa de todos os equipamentos da empresa
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Marca/Modelo</TableHead>
                <TableHead>Número de Série</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Localização</TableHead>
                <TableHead>Garantia</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {equipment.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.id}</TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{item.name}</div>
                      {item.notes && (
                        <div className="text-sm text-muted-foreground">
                          {item.notes}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{item.type}</TableCell>
                  <TableCell>
                    <div>
                      <div>{item.brand}</div>
                      <div className="text-sm text-muted-foreground">{item.model}</div>
                    </div>
                  </TableCell>
                  <TableCell>{item.serialNumber}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusColor(item.status) as any}>
                      {item.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{item.location}</TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {new Date(item.warrantyExpiry) > new Date() ? (
                        <span className="text-green-600">Válida até {item.warrantyExpiry}</span>
                      ) : (
                        <span className="text-red-600">Expirada</span>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
