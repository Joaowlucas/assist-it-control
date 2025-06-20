
import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useUserAssignments } from "@/hooks/useUserAssignments"
import { useAuth } from "@/hooks/useAuth"
import { EquipmentRequestDialog } from "@/components/EquipmentRequestDialog"
import { EquipmentRequestsSection } from "@/components/EquipmentRequestsSection"
import { Package, Calendar, AlertCircle, Plus, FileText } from "lucide-react"
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default function UserAssignments() {
  const [isRequestDialogOpen, setIsRequestDialogOpen] = useState(false)
  const { data: assignments = [], isLoading } = useUserAssignments()
  const { profile } = useAuth()

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ativo':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'finalizado':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
      default:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'ativo':
        return 'Ativo'
      case 'finalizado':
        return 'Finalizado'
      default:
        return status
    }
  }

  const activeAssignments = assignments.filter(a => a.status === 'ativo')
  const completedAssignments = assignments.filter(a => a.status === 'finalizado')

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Meus Equipamentos</h2>
          <p className="text-muted-foreground">
            Gerencie os equipamentos atribuídos a você e suas solicitações
          </p>
        </div>
        
        <Button 
          onClick={() => setIsRequestDialogOpen(true)}
          className="w-full sm:w-auto"
        >
          <Plus className="mr-2 h-4 w-4" />
          Solicitar Novo Equipamento
        </Button>
      </div>

      <Tabs defaultValue="equipments" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="equipments" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Meus Equipamentos
          </TabsTrigger>
          <TabsTrigger value="requests" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Minhas Solicitações
          </TabsTrigger>
        </TabsList>

        <TabsContent value="equipments" className="space-y-6">
          {/* Estatísticas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Total de Equipamentos
                    </p>
                    <p className="text-2xl font-bold">{assignments.length}</p>
                  </div>
                  <Package className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Equipamentos Ativos
                    </p>
                    <p className="text-2xl font-bold">{activeAssignments.length}</p>
                  </div>
                  <AlertCircle className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Equipamentos Finalizados
                    </p>
                    <p className="text-2xl font-bold">{completedAssignments.length}</p>
                  </div>
                  <Calendar className="h-8 w-8 text-gray-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Equipamentos Ativos */}
          {activeAssignments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Equipamentos Ativos</CardTitle>
                <CardDescription>
                  Equipamentos atualmente sob sua responsabilidade
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Equipamento</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Marca/Modelo</TableHead>
                        <TableHead>Número de Série</TableHead>
                        <TableHead>Data de Início</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {activeAssignments.map((assignment) => (
                        <TableRow key={assignment.id}>
                          <TableCell className="font-medium">
                            {assignment.equipment.name}
                          </TableCell>
                          <TableCell className="capitalize">
                            {assignment.equipment.type}
                          </TableCell>
                          <TableCell>
                            {assignment.equipment.brand && assignment.equipment.model
                              ? `${assignment.equipment.brand} ${assignment.equipment.model}`
                              : assignment.equipment.brand || assignment.equipment.model || '-'}
                          </TableCell>
                          <TableCell>
                            {assignment.equipment.serial_number || '-'}
                          </TableCell>
                          <TableCell>
                            {format(new Date(assignment.start_date), 'dd/MM/yyyy', { locale: ptBR })}
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(assignment.status)}>
                              {getStatusLabel(assignment.status)}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Histórico de Equipamentos */}
          {completedAssignments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Histórico de Equipamentos</CardTitle>
                <CardDescription>
                  Equipamentos anteriormente sob sua responsabilidade
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Equipamento</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Marca/Modelo</TableHead>
                        <TableHead>Data de Início</TableHead>
                        <TableHead>Data de Fim</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {completedAssignments.map((assignment) => (
                        <TableRow key={assignment.id}>
                          <TableCell className="font-medium">
                            {assignment.equipment.name}
                          </TableCell>
                          <TableCell className="capitalize">
                            {assignment.equipment.type}
                          </TableCell>
                          <TableCell>
                            {assignment.equipment.brand && assignment.equipment.model
                              ? `${assignment.equipment.brand} ${assignment.equipment.model}`
                              : assignment.equipment.brand || assignment.equipment.model || '-'}
                          </TableCell>
                          <TableCell>
                            {format(new Date(assignment.start_date), 'dd/MM/yyyy', { locale: ptBR })}
                          </TableCell>
                          <TableCell>
                            {assignment.end_date 
                              ? format(new Date(assignment.end_date), 'dd/MM/yyyy', { locale: ptBR })
                              : '-'}
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(assignment.status)}>
                              {getStatusLabel(assignment.status)}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}

          {assignments.length === 0 && (
            <Card>
              <CardContent className="text-center py-8">
                <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">Nenhum equipamento encontrado</h3>
                <p className="text-muted-foreground mb-4">
                  Você ainda não possui equipamentos atribuídos
                </p>
                <Button onClick={() => setIsRequestDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Solicitar Equipamento
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="requests">
          <EquipmentRequestsSection />
        </TabsContent>
      </Tabs>

      <EquipmentRequestDialog
        open={isRequestDialogOpen}
        onOpenChange={setIsRequestDialogOpen}
      />
    </div>
  )
}
