
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, Laptop } from "lucide-react"
import { useUserAssignments } from "@/hooks/useUserAssignments"
import { useState } from "react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

export default function UserAssignments() {
  const [searchTerm, setSearchTerm] = useState("")
  
  const { data: assignments = [], isLoading } = useUserAssignments()

  const filteredAssignments = assignments.filter(assignment =>
    assignment.equipment?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    assignment.equipment?.type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    assignment.equipment?.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    assignment.equipment?.model?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ativo':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'finalizado':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
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

  const stats = [
    {
      title: "Total de Atribuições",
      value: assignments.length,
      color: "text-blue-500",
      bgColor: "bg-blue-50 dark:bg-blue-950"
    },
    {
      title: "Atribuições Ativas",
      value: assignments.filter(a => a.status === 'ativo').length,
      color: "text-green-500",
      bgColor: "bg-green-50 dark:bg-green-950"
    },
    {
      title: "Finalizadas",
      value: assignments.filter(a => a.status === 'finalizado').length,
      color: "text-gray-500",
      bgColor: "bg-gray-50 dark:bg-gray-950"
    }
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Minhas Atribuições</h1>
        <p className="text-muted-foreground">
          Equipamentos atribuídos a você
        </p>
      </div>

      {/* Cards de estatísticas */}
      <div className="grid gap-4 md:grid-cols-3">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-full ${stat.bgColor}`}>
                  <Laptop className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Lista de atribuições */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Atribuições</CardTitle>
          <CardDescription>
            Equipamentos que foram ou estão atribuídos a você
          </CardDescription>
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
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center p-8">
              <div className="text-muted-foreground">Carregando atribuições...</div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Equipamento</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Marca/Modelo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data de Início</TableHead>
                  <TableHead>Data de Fim</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAssignments.map((assignment) => (
                  <TableRow key={assignment.id}>
                    <TableCell className="font-medium">
                      {assignment.equipment?.name || 'N/A'}
                    </TableCell>
                    <TableCell>
                      {assignment.equipment?.type || 'N/A'}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div>{assignment.equipment?.brand || 'N/A'}</div>
                        <div className="text-sm text-muted-foreground">
                          {assignment.equipment?.model || 'N/A'}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(assignment.status)}>
                        {getStatusLabel(assignment.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {format(new Date(assignment.start_date), 'dd/MM/yyyy', { locale: ptBR })}
                    </TableCell>
                    <TableCell>
                      {assignment.end_date 
                        ? format(new Date(assignment.end_date), 'dd/MM/yyyy', { locale: ptBR })
                        : '-'
                      }
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          
          {filteredAssignments.length === 0 && !isLoading && (
            <div className="text-center py-8 text-muted-foreground">
              <Laptop className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Nenhuma atribuição encontrada</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
