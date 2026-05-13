export default function ClipCardSkeleton({ rank }) {
  return (
    <div className="bg-forge-card border border-forge-border rounded-xl overflow-hidden">
      {/* Video placeholder */}
      <div className="aspect-video bg-forge-border relative animate-pulse">
        {rank && (
          <div className="absolute top-2 left-2 bg-black/70 text-gray-500 text-xs font-bold px-2 py-1 rounded-md">
            #{rank}
          </div>
        )}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
          <div className="flex gap-1">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-1.5 h-6 bg-gray-600 rounded-full animate-bounce"
                style={{ animationDelay: `${i * 0.15}s`, animationDuration: '0.9s' }}
              />
            ))}
          </div>
          <p className="text-gray-600 text-xs">Rendering clip...</p>
        </div>
      </div>

      <div className="p-4 space-y-3">
        {/* Type badge + timestamp */}
        <div className="flex items-center justify-between">
          <div className="h-5 w-24 bg-forge-border rounded-full animate-pulse" />
          <div className="h-4 w-20 bg-forge-border rounded animate-pulse" />
        </div>
        {/* Score bar */}
        <div className="h-1.5 bg-forge-border rounded-full animate-pulse" />
        {/* Reason lines */}
        <div className="space-y-1.5">
          <div className="h-3 bg-forge-border rounded animate-pulse" />
          <div className="h-3 bg-forge-border rounded animate-pulse w-4/5" />
          <div className="h-3 bg-forge-border rounded animate-pulse w-3/5" />
        </div>
        {/* Action buttons */}
        <div className="flex gap-2 pt-1">
          <div className="h-7 w-20 bg-forge-border rounded-lg animate-pulse" />
          <div className="h-7 w-16 bg-forge-border rounded-lg animate-pulse" />
        </div>
      </div>
    </div>
  )
}
