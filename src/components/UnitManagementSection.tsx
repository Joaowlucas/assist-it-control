
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useUnits } from "@/hooks/useUnits"
import { Plus, Pencil, Trash2 } from "lucide-react"

export function UnitManagementSection() {
  const { data: units = [], isLoading } = useUnits()
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [editingUnit, setEditingUnit] = useState<any>(null)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    address: ""
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Implementar criação/edição de unidade
    console.log('Salvando unidade:', formData)
    setShowCreateDialog(false)
    setEditingUnit(null)
    setFormData({ name: "", description: "", address: "" })
  }

  const handleEdit = (unit: any) => {
    setEditingUnit(unit)
    setFormData({
      name: unit.name,
      description: unit.description || "",
      address: unit.address || ""
    })
  }

  if (isLoading) {
    return <div>Carregando unidades...</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Unidades Organizacionais</h3>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Unidade
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Descrição</TableHead>
            <TableHead>Endereço</TableHead>
            <TableHead>Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {units.map((unit) => (
            <TableRow key={unit.id}>
              <TableCell className="font-medium">{unit.name}</TableCell>
              <TableCell>{unit.description || '-'}</TableCell>
              <TableCell>{unit.address || '-'}</TableCell>
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
                    onClick={() => console.log('Deletar unidade:', unit.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={showCreateDialog || !!editingUnit} onOpenChange={(open) => {
        if (!open) {
          setShowCreateDialog(false)
          setEditingUnit(null)
          setFormData({ name: "", description: "", address: "" })
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingUnit ? 'Editar Unidade' : 'Nova Unidade'}
            </DialogTitle>
            <DialogDescription>
              {editingUnit ? 'Edite as informações da unidade.' : 'Crie uma nova unidade organizacional.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="address">Endereço</Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
              />
            </div>
            <DialogFooter>
              <Button type="submit">
                {editingUnit ? 'Salvar' : 'Criar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
