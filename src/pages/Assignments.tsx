
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
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Atribuições de Equipamentos</h2>
        <p className="text-muted-foreground">
          Gerencie atribuições de equipamentos e solicitações dos usuários
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card 
          className="cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => setActiveEquipmentModalOpen(true)}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Equipamentos em Uso</CardTitle>
            <Computer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeAssignments.length}</div>
            <p className="text-xs text-muted-foreground">Atualmente atribuídos • Clique para detalhes</p>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => setMonthlyReturnsModalOpen(true)}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Devoluções este Mês</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{thisMonthReturns.length}</div>
            <p className="text-xs text-muted-foreground">Equipamentos devolvidos • Clique para histórico</p>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => setPendingRequestsModalOpen(true)}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Solicitações Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingRequests.length}</div>
            <p className="text-xs text-muted-foreground">Aguardando aprovação • Clique para gerenciar</p>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => setAllAssignmentsModalOpen(true)}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Atribuições</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{assignments.length}</div>
            <p className="text-xs text-muted-foreground">Histórico completo • Clique para relatório</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="assignments" className="space-y-4">
        <TabsList>
          <TabsTrigger value="assignments">Atribuições Ativas</TabsTrigger>
          <TabsTrigger value="requests">
            Solicitações Pendentes
            {pendingRequests.length > 0 && (
              <span className="ml-2 bg-primary text-primary-foreground rounded-full px-2 py-1 text-xs">
                {pendingRequests.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="assignments" className="space-y-4">
          <AssignmentManagementSection />
        </TabsContent>
        
        <TabsContent value="requests" className="space-y-4">
          <EquipmentRequestsManagement />
        </TabsContent>
      </Tabs>

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
