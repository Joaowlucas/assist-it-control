
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Download, User, Building, Computer, TrendingUp } from "lucide-react"
import { useDashboardReports } from "@/hooks/useDashboardReports"

export function DashboardReports() {
  const { data: reports, isLoading, error } = useDashboardReports()

  if (isLoading) {
    return (
      <div className="grid gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-5 bg-gray-200 rounded w-32 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-48"></div>
            </CardHeader>
            <CardContent>
              <div className="h-32 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center text-red-600 p-4">
        Erro ao carregar relatórios: {error.message}
      </div>
    )
  }

  if (!reports) return null

  const getStatusBadge = (status: string) => {
    const statusMap = {
      'disponivel': { label: 'Disponível', variant: 'default' as const },
      'em_uso': { label: 'Em Uso', variant: 'secondary' as const },
      'manutencao': { label: 'Manutenção', variant: 'destructive' as const },
      'descartado': { label: 'Descartado', variant: 'outline' as const },
      'ativo': { label: 'Ativo', variant: 'default' as const }
    }
    
    const config = statusMap[status as keyof typeof statusMap] || { label: status, variant: 'outline' as const }
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const exportToCSV = (data: any[], filename: string) => {
    if (!data.length) return
    
    const headers = Object.keys(data[0]).join(',')
    const rows = data.map(row => Object.values(row).join(',')).join('\n')
    const csv = `${headers}\n${rows}`
    
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${filename}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className="grid gap-6">
      {/* Performance dos Técnicos */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Performance dos Técnicos
            </CardTitle>
            <CardDescription>
              Estatísticas de desempenho da equipe técnica
            </CardDescription>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => exportToCSV(reports.technicianPerformance, 'performance-tecnicos')}
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Técnico</TableHead>
                <TableHead>Atribuídos</TableHead>
                <TableHead>Resolvidos</TableHead>
                <TableHead>Taxa de Resolução</TableHead>
                <TableHead>Tempo Médio</TableHead>
                <TableHead>Ativos</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports.technicianPerformance.map((tech) => (
                <TableRow key={tech.id}>
                  <TableCell className="font-medium">{tech.name}</TableCell>
                  <TableCell>{tech.totalAssigned}</TableCell>
                  <TableCell>{tech.totalResolved}</TableCell>
                  <TableCell>
                    {tech.totalAssigned > 0 
                      ? `${Math.round((tech.totalResolved / tech.totalAssigned) * 100)}%`
                      : '0%'
                    }
                  </TableCell>
                  <TableCell>{tech.avgResolutionTime}h</TableCell>
                  <TableCell>
                    <Badge variant={tech.activeTickets > 5 ? 'destructive' : 'default'}>
                      {tech.activeTickets}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Relatório por Unidades */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Relatório por Unidades
            </CardTitle>
            <CardDescription>
              Visão geral das atividades por unidade
            </CardDescription>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => exportToCSV(reports.unitReports, 'relatorio-unidades')}
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Unidade</TableHead>
                <TableHead>Total Chamados</TableHead>
                <TableHead>Chamados Abertos</TableHead>
                <TableHead>Equipamentos</TableHead>
                <TableHead>Atribuições Ativas</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports.unitReports.map((unit) => (
                <TableRow key={unit.id}>
                  <TableCell className="font-medium">{unit.name}</TableCell>
                  <TableCell>{unit.totalTickets}</TableCell>
                  <TableCell>
                    <Badge variant={unit.openTickets > 5 ? 'destructive' : 'default'}>
                      {unit.openTickets}
                    </Badge>
                  </TableCell>
                  <TableCell>{unit.totalEquipment}</TableCell>
                  <TableCell>{unit.activeAssignments}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Relatório de Equipamentos */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Computer className="h-5 w-5" />
              Relatório de Equipamentos
            </CardTitle>
            <CardDescription>
              Status e utilização dos equipamentos
            </CardDescription>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => exportToCSV(reports.equipmentReports, 'relatorio-equipamentos')}
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Equipamento</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Usuário Atual</TableHead>
                <TableHead>Dias de Uso</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports.equipmentReports.slice(0, 10).map((equipment) => (
                <TableRow key={equipment.id}>
                  <TableCell className="font-medium">{equipment.name}</TableCell>
                  <TableCell className="capitalize">{equipment.type}</TableCell>
                  <TableCell>{getStatusBadge(equipment.status)}</TableCell>
                  <TableCell>{equipment.currentUser || '-'}</TableCell>
                  <TableCell>
                    {equipment.usageDays !== undefined ? `${equipment.usageDays} dias` : '-'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Principais Problemas */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Principais Problemas
            </CardTitle>
            <CardDescription>
              Categorias com mais chamados e tempo de resolução
            </CardDescription>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => exportToCSV(reports.topIssues, 'principais-problemas')}
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Categoria</TableHead>
                <TableHead>Quantidade</TableHead>
                <TableHead>Tempo Médio de Resolução</TableHead>
                <TableHead>Prioridade</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports.topIssues.map((issue, index) => (
                <TableRow key={issue.category}>
                  <TableCell className="font-medium">{issue.category}</TableCell>
                  <TableCell>
                    <Badge variant={issue.count > 10 ? 'destructive' : 'default'}>
                      {issue.count}
                    </Badge>
                  </TableCell>
                  <TableCell>{issue.avgResolutionTime}h</TableCell>
                  <TableCell>
                    <Badge 
                      variant={
                        index === 0 ? 'destructive' : 
                        index === 1 ? 'secondary' : 'outline'
                      }
                    >
                      {index === 0 ? 'Alta' : index === 1 ? 'Média' : 'Baixa'}
                    </Badge>
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
