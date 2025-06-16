
import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AssignmentManagementSection } from "@/components/AssignmentManagementSection"
import { EquipmentRequestsManagement } from "@/components/EquipmentRequestsManagement"
import { ActiveEquipmentModal } from "@/components/ActiveEquipmentModal"
import { MonthlyReturnsModal } from "@/components/MonthlyReturnsModal"
import { PendingRequestsModal } from "@/components/PendingRequestsModal"
import { AllAssignmentsModal } from "@/components/AllAssignmentsModal"
import { useAssignments } from "@/hooks/useAssignments"
import { useAdminEquipmentRequests } from "@/hooks/useAdminEquipmentRequests"
import { Computer, Users, Clock, CheckCircle } from "lucide-react"

export default function Assignments() {
  const { data: assignments = [] } = useAssignments()
  const { data: equipmentRequests = [] } = useAdminEquipmentRequests()
  
  const [activeEquipmentModalOpen, setActiveEquipmentModalOpen] = useState(false)
  const [monthlyReturnsModalOpen, setMonthlyReturnsModalOpen] = useState(false)
  const [pendingRequestsModalOpen, setPendingRequestsModalOpen] = useState(false)
  const [allAssignmentsModalOpen, setAllAssignmentsModalOpen] = useState(false)

  const activeAssignments = assignments.filter(a => a.status === 'ativo')
  const finishedAssignments = assignments.filter(a => a.status === 'finalizado')
  const pendingRequests = equipmentRequests.filter(r => r.status === 'pendente')
  const thisMonthReturns = finishedAssignments.filter(a => 
    a.end_date && new Date(a.end_date).getMonth() === new Date().getMonth()
  )

  return (
    <div className="space-y-4 md:space-y-6 p-4 md:p-0">
      <div className="space-y-2">
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">Atribuições de Equipamentos</h2>
        <p className="text-sm md:text-base text-muted-foreground">
          Gerencie atribuições de equipamentos e solicitações dos usuários
        </p>
      </div>

      <div className="grid gap-3 md:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card 
          className="cursor-pointer hover:bg-muted/50 transition-all duration-200 hover:scale-[1.02] border-border bg-card"
          onClick={() => setActiveEquipmentModalOpen(true)}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-card-foreground">Equipamentos em Uso</CardTitle>
            <Computer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-card-foreground">{activeAssignments.length}</div>
            <p className="text-xs text-muted-foreground">Atualmente atribuídos • Toque para detalhes</p>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:bg-muted/50 transition-all duration-200 hover:scale-[1.02] border-border bg-card"
          onClick={() => setMonthlyReturnsModalOpen(true)}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-card-foreground">Devoluções este Mês</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-card-foreground">{thisMonthReturns.length}</div>
            <p className="text-xs text-muted-foreground">Equipamentos devolvidos • Toque para histórico</p>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:bg-muted/50 transition-all duration-200 hover:scale-[1.02] border-border bg-card"
          onClick={() => setPendingRequestsModalOpen(true)}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-card-foreground">Solicitações Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-card-foreground">{pendingRequests.length}</div>
            <p className="text-xs text-muted-foreground">Aguardando aprovação • Toque para gerenciar</p>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:bg-muted/50 transition-all duration-200 hover:scale-[1.02] border-border bg-card"
          onClick={() => setAllAssignmentsModalOpen(true)}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-card-foreground">Total de Atribuições</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-card-foreground">{assignments.length}</div>
            <p className="text-xs text-muted-foreground">Histórico completo • Toque para relatório</p>
          </CardContent>
        </Card>
      </div>

      <div className="bg-card border border-border rounded-lg">
        <Tabs defaultValue="assignments" className="space-y-4">
          <div className="px-4 pt-4">
            <TabsList className="grid w-full grid-cols-2 bg-muted">
              <TabsTrigger value="assignments" className="text-sm">Atribuições Ativas</TabsTrigger>
              <TabsTrigger value="requests" className="text-sm">
                <span className="hidden sm:inline">Solicitações Pendentes</span>
                <span className="sm:hidden">Pendentes</span>
                {pendingRequests.length > 0 && (
                  <span className="ml-1 sm:ml-2 bg-primary text-primary-foreground rounded-full px-1.5 py-0.5 text-xs">
                    {pendingRequests.length}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="assignments" className="space-y-4 px-4 pb-4">
            <AssignmentManagementSection />
          </TabsContent>
          
          <TabsContent value="requests" className="space-y-4 px-4 pb-4">
            <EquipmentRequestsManagement />
          </TabsContent>
        </Tabs>
      </div>

      {/* Modais */}
      <ActiveEquipmentModal 
        open={activeEquipmentModalOpen} 
        onOpenChange={setActiveEquipmentModalOpen} 
      />
      <MonthlyReturnsModal 
        open={monthlyReturnsModalOpen} 
        onOpenChange={setMonthlyReturnsModalOpen} 
      />
      <PendingRequestsModal 
        open={pendingRequestsModalOpen} 
        onOpenChange={setPendingRequestsModalOpen} 
      />
      <AllAssignmentsModal 
        open={allAssignmentsModalOpen} 
        onOpenChange={setAllAssignmentsModalOpen} 
      />
    </div>
  )
}
