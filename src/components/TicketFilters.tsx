
import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Search, X } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { cn } from "@/lib/utils"

interface TicketFiltersProps {
  searchTerm: string
  onSearchChange: (value: string) => void
  statusFilter: string
  onStatusFilterChange: (value: string) => void
  priorityFilter: string
  onPriorityFilterChange: (value: string) => void
  categoryFilter: string
  onCategoryFilterChange: (value: string) => void
  assigneeFilter: string
  onAssigneeFilterChange: (value: string) => void
  unitFilter: string
  onUnitFilterChange: (value: string) => void
  dateRange: { from?: Date; to?: Date }
  onDateRangeChange: (range: { from?: Date; to?: Date }) => void
  onClearFilters: () => void
  technicians: Array<{ id: string; name: string }>
  units: Array<{ id: string; name: string }>
}

export function TicketFilters({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  priorityFilter,
  onPriorityFilterChange,
  categoryFilter,
  onCategoryFilterChange,
  assigneeFilter,
  onAssigneeFilterChange,
  unitFilter,
  onUnitFilterChange,
  dateRange,
  onDateRangeChange,
  onClearFilters,
  technicians,
  units
}: TicketFiltersProps) {
  const [showDatePicker, setShowDatePicker] = useState(false)

  return (
    <Card className="bg-card border-border">
      <CardContent className="p-4 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <h3 className="font-medium text-foreground">Filtros</h3>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onClearFilters}
            className="border-input hover:bg-muted"
          >
            <X className="h-4 w-4 mr-2" />
            Limpar Filtros
          </Button>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar chamados..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-9 border-input focus:border-ring"
            />
          </div>
          
          <Select value={statusFilter} onValueChange={onStatusFilterChange}>
            <SelectTrigger className="border-input">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Status</SelectItem>
              <SelectItem value="aberto">Aberto</SelectItem>
              <SelectItem value="em_andamento">Em Andamento</SelectItem>
              <SelectItem value="aguardando">Aguardando</SelectItem>
              <SelectItem value="fechado">Fechado</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={priorityFilter} onValueChange={onPriorityFilterChange}>
            <SelectTrigger className="border-input">
              <SelectValue placeholder="Prioridade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as Prioridades</SelectItem>
              <SelectItem value="baixa">Baixa</SelectItem>
              <SelectItem value="media">Média</SelectItem>
              <SelectItem value="alta">Alta</SelectItem>
              <SelectItem value="critica">Crítica</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={categoryFilter} onValueChange={onCategoryFilterChange}>
            <SelectTrigger className="border-input">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as Categorias</SelectItem>
              <SelectItem value="hardware">Hardware</SelectItem>
              <SelectItem value="software">Software</SelectItem>
              <SelectItem value="rede">Rede</SelectItem>
              <SelectItem value="acesso">Acesso</SelectItem>
              <SelectItem value="outros">Outros</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={assigneeFilter} onValueChange={onAssigneeFilterChange}>
            <SelectTrigger className="border-input">
              <SelectValue placeholder="Técnico" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Técnicos</SelectItem>
              <SelectItem value="unassigned">Não Atribuídos</SelectItem>
              {technicians.map((tech) => (
                <SelectItem key={tech.id} value={tech.id}>
                  {tech.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={unitFilter} onValueChange={onUnitFilterChange}>
            <SelectTrigger className="border-input">
              <SelectValue placeholder="Unidade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as Unidades</SelectItem>
              {units.map((unit) => (
                <SelectItem key={unit.id} value={unit.id}>
                  {unit.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-4">
          <Popover open={showDatePicker} onOpenChange={setShowDatePicker}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "justify-start text-left font-normal",
                  !dateRange.from && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, "dd/MM/yyyy", { locale: ptBR })} -{" "}
                      {format(dateRange.to, "dd/MM/yyyy", { locale: ptBR })}
                    </>
                  ) : (
                    format(dateRange.from, "dd/MM/yyyy", { locale: ptBR })
                  )
                ) : (
                  <span>Período</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange.from}
                selected={{ from: dateRange.from, to: dateRange.to }}
                onSelect={(range) => {
                  onDateRangeChange({
                    from: range?.from,
                    to: range?.to
                  })
                }}
                numberOfMonths={2}
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>
      </CardContent>
    </Card>
  )
}
