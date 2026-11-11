import React from 'react';
import { Mail, CheckSquare, Clock, ShieldAlert } from 'lucide-react';
import { StatCard } from '../common/StatCard';

export const MetricGrid = ({ metrics = {}, pendingCount = 0 }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        title="Emails Ingested"
        value={metrics.emails_processed?.value ?? 0}
        subtitle={metrics.emails_processed?.subtitle ?? 'Total raw messages triaged'}
        changePercent={metrics.emails_processed?.change_percent}
        trend={metrics.emails_processed?.trend}
        icon={Mail}
        color="indigo"
      />
      <StatCard
        title="Tasks Automated"
        value={metrics.tasks_automated?.value ?? 0}
        subtitle={metrics.tasks_automated?.subtitle ?? 'Decomposed into Kanban'}
        changePercent={metrics.tasks_automated?.change_percent}
        trend={metrics.tasks_automated?.trend}
        icon={CheckSquare}
        color="cyan"
      />
      <StatCard
        title="Time Saved"
        value={metrics.time_saved?.value ?? '0.0h'}
        subtitle={metrics.time_saved?.subtitle ?? 'Triage automation speedup'}
        changePercent={metrics.time_saved?.change_percent}
        trend={metrics.time_saved?.trend}
        icon={Clock}
        color="emerald"
      />
      <StatCard
        title="HITL Approval Queue"
        value={pendingCount || metrics.hitl_queue?.value || 0}
        subtitle={metrics.hitl_queue?.subtitle ?? 'Awaiting operator review'}
        changePercent={metrics.hitl_queue?.change_percent}
        trend={metrics.hitl_queue?.trend}
        icon={ShieldAlert}
        color={pendingCount > 0 ? "rose" : "amber"}
      />
    </div>
  );
};
