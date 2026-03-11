import React from 'react';
import { getStatusColor } from './inventoryUtils';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md' | 'lg';
}

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const sizeClasses = {
    sm: 'px-1.5 py-0.5 text-xs',
    md: 'px-2 py-1 text-xs',
    lg: 'px-3 py-1.5 text-sm',
  };

  return (
    <span
      className={`inline-flex rounded-full font-semibold ${getStatusColor(status)} ${sizeClasses[size]}`}
    >
      {status}
    </span>
  );
}
