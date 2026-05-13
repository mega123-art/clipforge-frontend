export default function CaptionPreview({ excerpt, hookLine }) {
  const text = hookLine || excerpt || ''

  return (
    <div className="relative bg-black rounded-lg aspect-[9/16] max-w-[160px] flex items-end justify-center p-3 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
      <p className="relative z-10 text-white text-xs font-bold text-center leading-snug drop-shadow">
        {text.slice(0, 80)}{text.length > 80 ? '...' : ''}
      </p>
    </div>
  )
}
