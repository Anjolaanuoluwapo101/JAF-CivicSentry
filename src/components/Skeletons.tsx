"use client"

export function PulseSkeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-gray-200 rounded ${className}`} />
  )
}

export function CardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-3">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gray-200 rounded-lg animate-pulse" />
        <div className="flex-1 space-y-2">
          <div className="h-3 bg-gray-200 rounded w-1/3 animate-pulse" />
          <div className="h-2 bg-gray-100 rounded w-1/2 animate-pulse" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-2 bg-gray-100 rounded w-full animate-pulse" />
        <div className="h-2 bg-gray-100 rounded w-3/4 animate-pulse" />
      </div>
    </div>
  )
}

export function ListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  )
}

export function StatCardSkeleton() {
  return (
    <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100">
      <div className="h-2 bg-gray-200 rounded w-1/2 animate-pulse mb-2" />
      <div className="h-5 bg-gray-200 rounded w-1/3 animate-pulse" />
    </div>
  )
}

export function DashboardSkeleton() {
  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Navbar skeleton */}
      <div className="h-14 bg-white border-b border-gray-200 flex items-center px-4 justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gray-200 rounded-xl animate-pulse" />
          <div className="h-4 bg-gray-200 rounded w-32 animate-pulse" />
        </div>
        <div className="flex items-center gap-4">
          <div className="h-3 bg-gray-200 rounded w-20 animate-pulse" />
          <div className="h-3 bg-gray-200 rounded w-16 animate-pulse" />
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar skeleton */}
        <div className="w-80 bg-gray-50 border-r border-gray-200 p-4 space-y-4 hidden md:block">
          <div className="h-6 bg-gray-200 rounded w-1/2 animate-pulse" />
          <div className="grid grid-cols-2 gap-3">
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </div>
          <div className="bg-white rounded-xl p-4 space-y-3">
            <div className="h-3 bg-gray-200 rounded w-1/3 animate-pulse" />
            <div className="space-y-2">
              <div className="h-2 bg-gray-100 rounded w-full animate-pulse" />
              <div className="h-2 bg-gray-100 rounded w-full animate-pulse" />
              <div className="h-2 bg-gray-100 rounded w-full animate-pulse" />
            </div>
          </div>
        </div>

        {/* Map skeleton */}
        <div className="flex-1 bg-gray-100 relative">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-500 rounded-full animate-spin mx-auto mb-4" />
              <p className="text-sm text-gray-500">Loading map...</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function PageSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="h-14 bg-white border-b border-gray-200" />
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-200 rounded-xl animate-pulse" />
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded w-48 animate-pulse" />
            <div className="h-3 bg-gray-100 rounded w-64 animate-pulse" />
          </div>
        </div>
        <ListSkeleton count={3} />
      </div>
    </div>
  )
}
