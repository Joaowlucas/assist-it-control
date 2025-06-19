
import { Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTheme } from "@/components/theme-provider"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  const toggleTheme = () => {
    if (theme === 'light') {
      setTheme('dark')
    } else if (theme === 'dark') {
      setTheme('system')
    } else {
      setTheme('light')
    }
  }

  const getTooltipText = () => {
    switch (theme) {
      case 'light': return 'Mudar para tema escuro'
      case 'dark': return 'Mudar para tema do sistema'
      case 'system': return 'Mudar para tema claro'
      default: return 'Alternar tema'
    }
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleTheme}
      className="relative h-9 w-9 rounded-full hover:bg-muted transition-all duration-300 hover:scale-110"
      title={getTooltipText()}
    >
      <Sun className="h-4 w-4 rotate-0 scale-100 transition-all duration-300 dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all duration-300 dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Alternar tema</span>
      {theme === 'system' && (
        <div className="absolute -bottom-1 -right-1 h-2 w-2 rounded-full bg-primary animate-pulse" />
      )}
    </Button>
  )
}
