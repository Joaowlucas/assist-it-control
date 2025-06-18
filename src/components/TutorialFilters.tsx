
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search } from "lucide-react"

interface TutorialFiltersProps {
  searchTerm: string
  onSearchChange: (value: string) => void
  category: string
  onCategoryChange: (value: string) => void
  sortBy: string
  onSortChange: (value: string) => void
}

const categories = [
  { value: 'all', label: 'Todas as categorias' },
  { value: 'geral', label: 'Geral' },
  { value: 'equipamentos', label: 'Equipamentos' },
  { value: 'software', label: 'Software' },
  { value: 'rede', label: 'Rede' },
  { value: 'seguranca', label: 'Segurança' },
  { value: 'manutencao', label: 'Manutenção' },
]

const sortOptions = [
  { value: 'recent', label: 'Mais recentes' },
  { value: 'popular', label: 'Mais populares' },
  { value: 'title', label: 'Ordem alfabética' },
]

export function TutorialFilters({
  searchTerm,
  onSearchChange,
  category,
  onCategoryChange,
  sortBy,
  onSortChange
}: TutorialFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-6">
      <div className="flex-1 relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar tutoriais..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>
      
      <Select value={category} onValueChange={onCategoryChange}>
        <SelectTrigger className="w-full sm:w-48">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {categories.map((cat) => (
            <SelectItem key={cat.value} value={cat.value}>
              {cat.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={sortBy} onValueChange={onSortChange}>
        <SelectTrigger className="w-full sm:w-48">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {sortOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
