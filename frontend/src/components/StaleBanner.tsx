export function StaleBanner({ stale, reason }: { stale?: boolean; reason?: string }) {
  if (!stale) return null;
  return (
    <div className="mb-4 rounded-lg border border-amber-600/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-100">
      Data may be outdated (LeetCode API unavailable). Reason: {reason || 'unknown'}.
    </div>
  );
}
