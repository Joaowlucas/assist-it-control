
import { DashboardStats } from "@/components/DashboardStats"
import { DashboardCharts } from "@/components/DashboardCharts"
import { DashboardReports } from "@/components/DashboardReports"

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          Visão geral do sistema de suporte de TI
        </p>
      </div>

      {/* Estatísticas principais */}
      <DashboardStats />

      {/* Gráficos */}
      <DashboardCharts />

      {/* Relatórios detalhados */}
      <DashboardReports />
    </div>
  )
}
