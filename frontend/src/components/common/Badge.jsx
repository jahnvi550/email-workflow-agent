import React from 'react';
import clsx from 'clsx';

export const PriorityBadge = ({ priority }) => {
  const p = (priority || 'MEDIUM').toUpperCase();
  const styles = {
    URGENT: 'bg-white text-black font-extrabold border-white shadow-[0_0_15px_rgba(255,255,255,0.4)]',
    HIGH: 'bg-neutral-800 text-white border-neutral-600 font-bold',
    MEDIUM: 'bg-neutral-900 text-neutral-300 border-neutral-700 font-medium',
    LOW: 'bg-neutral-950 text-neutral-400 border-neutral-800 font-medium',
  };

  return (
    <span className={clsx(
      'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs uppercase tracking-wider border',
      styles[p] || styles.MEDIUM
    )}>
      <span className={clsx(
        'w-1.5 h-1.5 rounded-full',
        p === 'URGENT' ? 'bg-black animate-pulse' : 'bg-white'
      )} />
      {p}
    </span>
  );
};

export const StatusBadge = ({ status }) => {
  const s = (status || 'TODO').toUpperCase();
  const styles = {
    // Workflow States
    PENDING_APPROVAL: 'bg-white text-black border-white font-bold animate-pulse',
    RUNNING: 'bg-neutral-800 text-white border-neutral-600 font-semibold',
    COMPLETED: 'bg-neutral-900 text-neutral-200 border-neutral-700 font-semibold',
    REJECTED: 'bg-neutral-950 text-neutral-400 border-neutral-800 font-medium',
    FAILED: 'bg-neutral-950 text-neutral-400 border-neutral-800 font-medium',
    // Task States
    TODO: 'bg-neutral-950 text-neutral-300 border-neutral-800',
    IN_PROGRESS: 'bg-white text-black border-white font-bold',
    UNDER_REVIEW: 'bg-neutral-900 text-white border-neutral-700',
    // Email States
    UNPROCESSED: 'bg-white text-black border-white font-bold',
    PROCESSING: 'bg-neutral-800 text-white border-neutral-600 animate-pulse',
    PROCESSED: 'bg-neutral-900 text-neutral-300 border-neutral-700',
  };

  const labelMap = {
    PENDING_APPROVAL: 'Pending HITL Approval',
    IN_PROGRESS: 'In Progress',
    UNDER_REVIEW: 'Under Review',
    UNPROCESSED: 'Unprocessed',
  };

  return (
    <span className={clsx(
      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs border',
      styles[s] || 'bg-neutral-900 text-neutral-300 border-neutral-800'
    )}>
      {labelMap[s] || s}
    </span>
  );
};

export const CategoryBadge = ({ category }) => {
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-neutral-900 text-neutral-300 border border-neutral-800">
      {category || 'General'}
    </span>
  );
};
