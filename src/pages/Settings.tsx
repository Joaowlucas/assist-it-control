
import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"

interface Unit {
  id: string
  name: string
  description: string
  createdAt: string
}

const mockUnits: Unit[] = [
  {
    id: "1",
    name: "Matriz São Paulo",
    description: "Unidade principal da empresa",
    createdAt: "2024-06-01"
  },
  {
    id: "2", 
    name: "Filial Rio de Janeiro",
    description: "Filial do Rio de Janeiro",
    createdAt: "2024-06-02"
  }
]

export default function Settings() {
  const { toast } = useToast()
  const [units, setUnits] = useState<Unit[]>(mockUnits)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const handleSave = () => {
    toast({
      title: "Configurações salvas!",
      description: "As configurações foram atualizadas com sucesso.",
    })
  }

  const handleSubmitUnit = (e: React.FormEvent) => {
    e.preventDefault()
    const formData = new FormData(e.target as HTMLFormElement)
    
    const newUnit: Unit = {
      id: String(units.length + 1),
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      createdAt: new Date().toISOString().split('T')[0]
    }

    setUnits([...units, newUnit])
    setIsDialogOpen(false)
    toast({
      title: "Unidade criada com sucesso!",
      description: `A unidade ${newUnit.name} foi adicionada.`,
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Configurações</h2>
        <p className="text-muted-foreground">
          Gerencie as configurações do sistema de suporte
        </p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Unidades de Atendimento</CardTitle>
              <CardDescription>
                Gerencie as unidades da empresa para organizar chamados
              </CardDescription>
            </div>
            
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>Nova Unidade</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Criar Nova Unidade</DialogTitle>
                  <DialogDescription>
                    Adicione uma nova unidade de atendimento
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmitUnit} className="space-y-4">
                  <div>
                    <Label htmlFor="name">Nome da Unidade</Label>
                    <Input 
                      id="name" 
                      name="name" 
                      placeholder="Ex: Matriz São Paulo"
                      required 
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="description">Descrição</Label>
                    <Input 
                      id="description" 
                      name="description" 
                      placeholder="Descrição da unidade"
                      required 
                    />
                  </div>
                  
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit">Criar Unidade</Button>
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
                  <TableHead>Descrição</TableHead>
                  <TableHead>Data de Criação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {units.map((unit) => (
                  <TableRow key={unit.id}>
                    <TableCell className="font-medium">{unit.name}</TableCell>
                    <TableCell>{unit.description}</TableCell>
                    <TableCell>{unit.createdAt}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Configurações Gerais</CardTitle>
            <CardDescription>
              Configurações básicas do sistema
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="company">Nome da Empresa</Label>
              <Input id="company" defaultValue="Empresa XYZ Ltda" />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="department">Departamento de TI</Label>
              <Input id="department" defaultValue="Tecnologia da Informação" />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="email">E-mail de Suporte</Label>
              <Input id="email" type="email" defaultValue="suporte@empresa.com" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Configurações de Notificação</CardTitle>
            <CardDescription>
              Configure como e quando receber notificações
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="ticketEmail">E-mail para novos chamados</Label>
              <Input id="ticketEmail" type="email" defaultValue="chamados@empresa.com" />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="equipmentEmail">E-mail para equipamentos</Label>
              <Input id="equipmentEmail" type="email" defaultValue="equipamentos@empresa.com" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Configurações de Sistema</CardTitle>
            <CardDescription>
              Configurações técnicas do sistema
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="autoAssign">Auto-atribuição de chamados</Label>
              <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                <option value="enabled">Habilitado</option>
                <option value="disabled">Desabilitado</option>
              </select>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="priority">Prioridade padrão para novos chamados</Label>
              <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                <option value="baixa">Baixa</option>
                <option value="media">Média</option>
                <option value="alta">Alta</option>
                <option value="critica">Crítica</option>
              </select>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button onClick={handleSave}>Salvar Configurações</Button>
        </div>
      </div>
    </div>
  )
}
