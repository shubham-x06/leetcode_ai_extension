import type { ApiMeta } from '../lib/api';

export function StaleBanner({ meta }: { meta?: ApiMeta }) {
  if (!meta?.stale) return null;
  return (
    <div className="banner warn">
      Data may be outdated (LeetCode API unavailable). Reason: {meta.staleReason || 'unknown'}.
    </div>
  );
}
