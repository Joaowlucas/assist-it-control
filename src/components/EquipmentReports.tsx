
import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { Download, BarChart3, TrendingUp } from 'lucide-react'
import { useEquipmentStats } from '@/hooks/useEquipmentStats'

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

export function EquipmentReports() {
  const { data: stats, isLoading } = useEquipmentStats()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (!stats) {
    return null
  }

  const handleExportData = () => {
    // Implementar exportação CSV/Excel
    console.log('Exportar dados para CSV/Excel')
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">
          <BarChart3 className="h-4 w-4 mr-2" />
          Relatórios
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Relatórios de Equipamentos</DialogTitle>
          <DialogDescription>
            Análise estatística do inventário de equipamentos
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Métricas Resumidas */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col items-center">
                  <span className="text-2xl font-bold">{stats.total}</span>
                  <span className="text-sm text-muted-foreground">Total</span>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col items-center">
                  <span className="text-2xl font-bold text-green-600">{stats.available}</span>
                  <span className="text-sm text-muted-foreground">Disponíveis</span>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col items-center">
                  <span className="text-2xl font-bold text-blue-600">{stats.inUse}</span>
                  <span className="text-sm text-muted-foreground">Em Uso</span>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col items-center">
                  <span className="text-2xl font-bold text-yellow-600">{stats.maintenance}</span>
                  <span className="text-sm text-muted-foreground">Manutenção</span>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col items-center">
                  <span className="text-2xl font-bold text-red-600">{stats.disposed}</span>
                  <span className="text-sm text-muted-foreground">Descartados</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Gráfico de Status */}
            <Card>
              <CardHeader>
                <CardTitle>Distribuição por Status</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={stats.byStatus}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ status, count }) => `${status}: ${count}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                      nameKey="status"
                    >
                      {stats.byStatus.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Gráfico por Tipo */}
            <Card>
              <CardHeader>
                <CardTitle>Equipamentos por Tipo</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={stats.byType}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="type" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Gráfico por Unidade */}
          <Card>
            <CardHeader>
              <CardTitle>Equipamentos por Unidade</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stats.byUnit}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="unit" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Ações */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleExportData}>
              <Download className="h-4 w-4 mr-2" />
              Exportar Dados
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
