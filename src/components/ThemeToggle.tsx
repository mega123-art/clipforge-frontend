import { Sun, Moon } from 'lucide-react'
import useStore from '../store'

interface ThemeToggleProps {
  className?: string
}

export default function ThemeToggle({ className = '' }: ThemeToggleProps) {
  const { theme, toggleTheme } = useStore()
  const isLight = theme === 'light'

  return (
    <button
      onClick={toggleTheme}
      title={isLight ? 'Switch to dark mode' : 'Switch to light mode'}
      className={`relative w-9 h-9 rounded-full border border-forge-border bg-forge-surface/60 flex items-center justify-center transition-colors hover:border-forge-border-bright group cursor-pointer ${className}`}
    >
      {isLight ? (
        <Moon size={14} className="text-forge-muted group-hover:text-forge-text transition-colors" />
      ) : (
        <Sun size={14} className="text-forge-muted group-hover:text-forge-text transition-colors" />
      )}
    </button>
  )
}
