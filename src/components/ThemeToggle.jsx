import { Sun, Moon } from 'lucide-react'
import useStore from '../store'

export default function ThemeToggle({ className = '' }) {
  const { theme, toggleTheme } = useStore()
  const isLight = theme === 'light'

  return (
    <button
      onClick={toggleTheme}
      title={isLight ? 'Switch to dark mode' : 'Switch to light mode'}
      className={`relative w-9 h-9 rounded-xl border border-forge-border flex items-center justify-center transition-all hover:border-forge-border-bright hover:bg-forge-surface hover:shadow-glow-violet-sm group cursor-pointer ${className}`}
    >
      {isLight ? (
        <Moon size={14} className="text-forge-muted group-hover:text-violet-400 transition-colors" />
      ) : (
        <Sun size={14} className="text-forge-muted group-hover:text-amber-400 transition-colors" />
      )}
    </button>
  )
}
