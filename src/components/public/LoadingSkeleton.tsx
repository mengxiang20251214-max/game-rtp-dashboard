// 游戏列表加载占位骨架屏（纯静态，无需客户端 JS）
function SkeletonCard() {
  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-white/10 bg-bg-card/60">
      <div className="h-40 w-full animate-pulse bg-white/5" />
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="h-5 w-2/3 animate-pulse rounded bg-white/10" />
        <div className="h-2.5 w-full animate-pulse rounded-full bg-white/5" />
        <div className="grid grid-cols-2 gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-12 animate-pulse rounded-lg bg-white/5" />
          ))}
        </div>
        <div className="mt-auto h-9 w-full animate-pulse rounded-lg bg-white/5" />
      </div>
    </div>
  );
}

export default function LoadingSkeleton() {
  return (
    <div className="min-h-screen">
      {/* 顶部导航占位 */}
      <div className="sticky top-0 z-30 border-b border-white/10 bg-bg-primary/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 animate-pulse rounded-lg bg-white/10" />
            <div className="space-y-2">
              <div className="h-4 w-32 animate-pulse rounded bg-white/10" />
              <div className="h-3 w-24 animate-pulse rounded bg-white/5" />
            </div>
          </div>
          <div className="h-9 w-20 animate-pulse rounded-lg bg-white/5" />
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        {/* 标题占位 */}
        <div className="mb-8 space-y-3">
          <div className="h-8 w-64 animate-pulse rounded bg-white/10" />
          <div className="h-4 w-96 max-w-full animate-pulse rounded bg-white/5" />
        </div>

        {/* 分类筛选占位 */}
        <div className="mb-8 flex flex-wrap gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-10 w-24 animate-pulse rounded-full bg-white/5" />
          ))}
        </div>

        {/* 卡片网格占位 */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </main>
    </div>
  );
}
