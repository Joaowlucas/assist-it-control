
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Computer, Users, FileText, Calendar, TrendingUp, TrendingDown, Eye } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { useDashboardStats } from "@/hooks/useDashboardStats"

interface DashboardStatsProps {
  onOpenTicketsClick?: () => void
  onEquipmentClick?: () => void
  onUsersClick?: () => void
}

export function DashboardStats({ onOpenTicketsClick, onEquipmentClick, onUsersClick }: DashboardStatsProps) {
  const { data: stats, isLoading, error } = useDashboardStats()

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4 rounded" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-12 mb-2" />
              <Skeleton className="h-3 w-32" />
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
      <Card 
        className={onOpenTicketsClick ? "cursor-pointer hover:bg-muted/50 transition-colors" : ""}
        onClick={onOpenTicketsClick}
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Chamados Abertos
          </CardTitle>
          <div className="flex gap-1">
            <FileText className="h-4 w-4 text-muted-foreground" />
            {onOpenTicketsClick && <Eye className="h-4 w-4 text-muted-foreground" />}
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">{stats.openTickets}</div>
          <p className={`text-xs flex items-center gap-1 ${getTrendColor(stats.ticketsTrend)}`}>
            {getTrendIcon(stats.ticketsTrend)}
            {stats.ticketsTrend > 0 ? '+' : ''}{stats.ticketsTrend}% em relação ao mês passado
          </p>
          {onOpenTicketsClick && (
            <p className="text-xs text-muted-foreground mt-1">Clique para ver detalhes</p>
          )}
        </CardContent>
      </Card>

      <Card 
        className={onEquipmentClick ? "cursor-pointer hover:bg-muted/50 transition-colors" : ""}
        onClick={onEquipmentClick}
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Equipamentos Disponíveis
          </CardTitle>
          <div className="flex gap-1">
            <Computer className="h-4 w-4 text-muted-foreground" />
            {onEquipmentClick && <Eye className="h-4 w-4 text-muted-foreground" />}
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{stats.availableEquipment}</div>
          <p className={`text-xs flex items-center gap-1 ${getTrendColor(stats.equipmentTrend)}`}>
            {getTrendIcon(stats.equipmentTrend)}
            {stats.equipmentTrend > 0 ? '+' : ''}{stats.equipmentTrend} equipamentos este mês
          </p>
          {onEquipmentClick && (
            <p className="text-xs text-muted-foreground mt-1">Clique para ver detalhes</p>
          )}
        </CardContent>
      </Card>

      <Card 
        className={onUsersClick ? "cursor-pointer hover:bg-muted/50 transition-colors" : ""}
        onClick={onUsersClick}
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Usuários Ativos
          </CardTitle>
          <div className="flex gap-1">
            <Users className="h-4 w-4 text-muted-foreground" />
            {onUsersClick && <Eye className="h-4 w-4 text-muted-foreground" />}
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-purple-600">{stats.totalUsers}</div>
          <p className={`text-xs flex items-center gap-1 ${getTrendColor(stats.usersTrend)}`}>
            {getTrendIcon(stats.usersTrend)}
            {stats.usersTrend > 0 ? '+' : ''}{stats.usersTrend} novos usuários este mês
          </p>
          {onUsersClick && (
            <p className="text-xs text-muted-foreground mt-1">Clique para ver detalhes</p>
          )}
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
