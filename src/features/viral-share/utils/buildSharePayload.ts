import type { AnalysisResult, TrackId } from '../../../types';
import { getShareStrings } from '../i18n';
import { mapTrackToCreatorType } from '../constants';
import type { SharePreviewData } from '../types';

const MAX_INSIGHT_LEN = 120;
const MAX_METRIC_LEN = 72;

function truncate(text: string, max: number): string {
  const t = text.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1).trim()}…`;
}

function metricFromExpert(insight: string, role: string): string {
  const clean = insight.trim();
  if (clean) return truncate(clean, MAX_METRIC_LEN);
  if (role.trim()) return truncate(role.trim(), MAX_METRIC_LEN);
  return '';
}

/**
 * Builds share preview from existing analysis only — no AI calls.
 */
export function buildSharePayload(
  score: number,
  trackId: TrackId,
  result: AnalysisResult
): SharePreviewData {
  const strings = getShareStrings();
  const experts = result.expertAnalysis ?? [];
  const metrics: string[] = [];

  for (let i = 0; i < 3; i++) {
    const expert = experts[i];
    if (expert) {
      const line = metricFromExpert(expert.insight, expert.role);
      metrics.push(line || strings.metricFallbacks[i]);
    } else {
      metrics.push(strings.metricFallbacks[i]);
    }
  }

  const hook = result.hook?.trim();
  const insight = hook
    ? truncate(hook, MAX_INSIGHT_LEN)
    : truncate(strings.modalSubtitle, MAX_INSIGHT_LEN);

  return {
    viralScore: Math.round(Math.max(0, Math.min(100, score))),
    metrics: [metrics[0], metrics[1], metrics[2]],
    insight,
    creatorType: mapTrackToCreatorType(trackId),
  };
}
