
import { useState, useMemo } from "react"
import { TutorialCard } from "@/components/TutorialCard"
import { TutorialFilters } from "@/components/TutorialFilters"
import { VideoPlayer } from "@/components/VideoPlayer"
import { useTutorials, useIncrementTutorialViews, Tutorial } from "@/hooks/useTutorials"
import { Loader2, BookOpen } from "lucide-react"

export default function Tutorials() {
  const { data: tutorials, isLoading } = useTutorials()
  const incrementViews = useIncrementTutorialViews()
  
  const [searchTerm, setSearchTerm] = useState("")
  const [category, setCategory] = useState("all")
  const [sortBy, setSortBy] = useState("recent")
  const [selectedTutorial, setSelectedTutorial] = useState<Tutorial | null>(null)
  const [isPlayerOpen, setIsPlayerOpen] = useState(false)

  const filteredAndSortedTutorials = useMemo(() => {
    if (!tutorials) return []

    let filtered = tutorials.filter(tutorial => {
      const matchesSearch = tutorial.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          tutorial.description?.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesCategory = category === 'all' || tutorial.category === category
      
      return matchesSearch && matchesCategory
    })

    // Sort tutorials
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'popular':
          return b.view_count - a.view_count
        case 'title':
          return a.title.localeCompare(b.title)
        case 'recent':
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      }
    })

    return filtered
  }, [tutorials, searchTerm, category, sortBy])

  const handleTutorialClick = (tutorial: Tutorial) => {
    setSelectedTutorial(tutorial)
    setIsPlayerOpen(true)
    incrementViews.mutate(tutorial.id)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <BookOpen className="h-8 w-8" />
          Tutoriais
        </h2>
        <p className="text-muted-foreground">
          Aprenda com nossos vídeos tutoriais e melhore suas habilidades
        </p>
      </div>

      <TutorialFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        category={category}
        onCategoryChange={setCategory}
        sortBy={sortBy}
        onSortChange={setSortBy}
      />

      {filteredAndSortedTutorials.length === 0 ? (
        <div className="text-center py-12">
          <BookOpen className="h-12 w-12 mx-auto text-m6 ted-foreground mb-4" />
          <h3 className="text-lg font-medium">Nenhum tutorial encontrado</h3>
          <p className="text-muted-foreground">
            Tente ajustar os filtros ou termos de busca
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredAndSortedTutorials.map((tutorial) => (
            <TutorialCard
              key={tutorial.id}
              tutorial={tutorial}
              onClick={() => handleTutorialClick(tutorial)}
            />
          ))}
        </div>
      )}

      {selectedTutorial && (
        <VideoPlayer
          videoUrl={selectedTutorial.video_url}
          title={selectedTutorial.title}
          isOpen={isPlayerOpen}
          onClose={() => {
            setIsPlayerOpen(false)
            setSelectedTutorial(null)
          }}
        />
      )}
    </div>
  )
}
