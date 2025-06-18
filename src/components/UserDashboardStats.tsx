
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, CheckCircle, Clock, Laptop } from "lucide-react"
import { useUserDashboardStats } from "@/hooks/useUserDashboardStats"

export function UserDashboardStats() {
  const { data: stats, isLoading } = useUserDashboardStats()

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-muted rounded w-24 mb-2"></div>
                <div className="h-8 bg-muted rounded w-16"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const dashboardStats = [
    {
      title: "Chamados Abertos",
      value: stats?.tickets.open || 0,
      description: "Chamados pendentes",
      icon: AlertCircle,
      iconColor: "text-orange-500",
      bgColor: "bg-orange-50 dark:bg-orange-950"
    },
    {
      title: "Em Andamento",
      value: stats?.tickets.inProgress || 0,
      description: "Sendo atendidos",
      icon: Clock,
      iconColor: "text-blue-500",
      bgColor: "bg-blue-50 dark:bg-blue-950"
    },
    {
      title: "Chamados Fechados",
      value: stats?.tickets.closed || 0,
      description: "Resolvidos",
      icon: CheckCircle,
      iconColor: "text-green-500",
      bgColor: "bg-green-50 dark:bg-green-950"
    },
    {
      title: "Equipamentos Ativos",
      value: stats?.assignments.active || 0,
      description: "Em uso",
      icon: Laptop,
      iconColor: "text-purple-500",
      bgColor: "bg-purple-50 dark:bg-purple-950"
    }
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {dashboardStats.map((stat, index) => {
        const Icon = stat.icon
        return (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-full ${stat.bgColor}`}>
                <Icon className={`h-4 w-4 ${stat.iconColor}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
