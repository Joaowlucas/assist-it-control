
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Computer, Users, FileText, Calendar, TrendingUp, TrendingDown } from "lucide-react"
import { useDashboardStats } from "@/hooks/useDashboardStats"

export function DashboardStats() {
  const { data: stats, isLoading, error } = useDashboardStats()

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                <div className="h-4 bg-gray-200 rounded w-24"></div>
              </CardTitle>
              <div className="h-4 w-4 bg-gray-200 rounded"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-12 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-32"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center text-red-600 p-4">
        Erro ao carregar estatísticas: {error.message}
      </div>
    )
  }

  if (!stats) return null

  const getTrendIcon = (trend: number) => {
    if (trend > 0) return <TrendingUp className="h-4 w-4 text-green-600" />
    if (trend < 0) return <TrendingDown className="h-4 w-4 text-red-600" />
    return null
  }

  const getTrendColor = (trend: number) => {
    if (trend > 0) return "text-green-600"
    if (trend < 0) return "text-red-600"
    return "text-gray-600"
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Chamados Abertos
          </CardTitle>
          <FileText className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">{stats.openTickets}</div>
          <p className={`text-xs flex items-center gap-1 ${getTrendColor(stats.ticketsTrend)}`}>
            {getTrendIcon(stats.ticketsTrend)}
            {stats.ticketsTrend > 0 ? '+' : ''}{stats.ticketsTrend}% em relação ao mês passado
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Equipamentos Disponíveis
          </CardTitle>
          <Computer className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{stats.availableEquipment}</div>
          <p className={`text-xs flex items-center gap-1 ${getTrendColor(stats.equipmentTrend)}`}>
            {getTrendIcon(stats.equipmentTrend)}
            {stats.equipmentTrend > 0 ? '+' : ''}{stats.equipmentTrend} equipamentos este mês
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Usuários Ativos
          </CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-purple-600">{stats.totalUsers}</div>
          <p className={`text-xs flex items-center gap-1 ${getTrendColor(stats.usersTrend)}`}>
            {getTrendIcon(stats.usersTrend)}
            {stats.usersTrend > 0 ? '+' : ''}{stats.usersTrend} novos usuários este mês
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Tempo Médio de Resolução
          </CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-600">{stats.avgResolutionTime}h</div>
          <p className={`text-xs flex items-center gap-1 ${getTrendColor(stats.resolutionTimeTrend)}`}>
            {getTrendIcon(stats.resolutionTimeTrend)}
            {stats.resolutionTimeTrend}% melhoria no tempo
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
