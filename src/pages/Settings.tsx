
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"

export default function Settings() {
  const { toast } = useToast()

  const handleSave = () => {
    toast({
      title: "Configurações salvas!",
      description: "As configurações foram atualizadas com sucesso.",
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
