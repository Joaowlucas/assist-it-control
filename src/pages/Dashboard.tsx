
import { useState } from "react"
import { DashboardStats } from "@/components/DashboardStats"
import { DashboardCharts } from "@/components/DashboardCharts"
import { DashboardReports } from "@/components/DashboardReports"
import { DashboardOpenTicketsModal, DashboardEquipmentModal, DashboardUsersModal } from "@/components/DashboardModals"

export default function Dashboard() {
  const [openTicketsModalOpen, setOpenTicketsModalOpen] = useState(false)
  const [equipmentModalOpen, setEquipmentModalOpen] = useState(false)
  const [usersModalOpen, setUsersModalOpen] = useState(false)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          Visão geral do sistema de suporte de TI
        </p>
      </div>

      {/* Estatísticas principais */}
      <DashboardStats 
        onOpenTicketsClick={() => setOpenTicketsModalOpen(true)}
        onEquipmentClick={() => setEquipmentModalOpen(true)}
        onUsersClick={() => setUsersModalOpen(true)}
      />

      {/* Gráficos */}
      <DashboardCharts />

      {/* Relatórios detalhados */}
      <DashboardReports />

      {/* Modais */}
      <DashboardOpenTicketsModal
        open={openTicketsModalOpen}
        onOpenChange={setOpenTicketsModalOpen}
      />

      <DashboardEquipmentModal
        open={equipmentModalOpen}
        onOpenChange={setEquipmentModalOpen}
      />

      <DashboardUsersModal
        open={usersModalOpen}
        onOpenChange={setUsersModalOpen}
      />
    </div>
  )
}
