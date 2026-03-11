import React from 'react';

interface InventoryCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  color?: 'green' | 'blue' | 'yellow' | 'red' | 'purple';
  description?: string;
}

export function InventoryCard({
  title,
  value,
  icon,
  color = 'blue',
  description,
}: InventoryCardProps) {
  const colorClasses = {
    green: 'border-green-200 bg-green-50',
    blue: 'border-blue-200 bg-blue-50',
    yellow: 'border-yellow-200 bg-yellow-50',
    red: 'border-red-200 bg-red-50',
    purple: 'border-purple-200 bg-purple-50',
  };

  const textColorClasses = {
    green: 'text-green-700',
    blue: 'text-blue-700',
    yellow: 'text-yellow-700',
    red: 'text-red-700',
    purple: 'text-purple-700',
  };

  return (
    <div className={`rounded-lg border ${colorClasses[color]} p-4`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className={`mt-2 text-2xl font-bold ${textColorClasses[color]}`}>
            {value}
          </p>
          {description && (
            <p className="mt-1 text-xs text-gray-600">{description}</p>
          )}
        </div>
        {icon && (
          <div className={`text-3xl opacity-20 ${textColorClasses[color]}`}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
