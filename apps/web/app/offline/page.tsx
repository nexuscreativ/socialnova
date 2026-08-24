export default function OfflinePage() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="h-14 w-14 rounded-2xl flex items-center justify-center" style={{ backgroundColor: "var(--accent)" }}>
        <span className="text-white text-xl font-bold">S</span>
      </div>
      <h1 className="text-xl font-bold" style={{ fontFamily: "var(--font-plus-jakarta)" }}>
        You&apos;re offline
      </h1>
      <p className="text-sm max-w-md" style={{ color: "var(--text-secondary)" }}>
        SocialNova needs an internet connection for AI features. Check your connection and try again — cached pages and assets will still work.
      </p>
    </div>
  )
}
