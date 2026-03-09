'use client';

import React from 'react';
import { Calendar, Clock, CheckCircle, XCircle, LucideIcon } from 'lucide-react';
import Link from 'next/link';

// Icon mapping
const iconMap: Record<string, LucideIcon> = {
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
};

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: string; // Changed from LucideIcon to string
  change?: {
    value: number;
    isPositive: boolean;
  };
  href?: string;
  className?: string;
}

const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  icon: iconName,
  change,
  href,
  className = '',
}) => {
  const Icon = iconMap[iconName] || Calendar; // Fallback to Calendar if icon not found
  const content = (
    <div
      className={`
        bg-slate-800 border border-slate-700 rounded-lg p-6
        hover:border-slate-600 transition-colors
        ${href ? 'cursor-pointer' : ''}
        ${className}
      `}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="p-2 bg-blue-600/10 rounded-lg">
          <Icon className="w-5 h-5 text-blue-500" />
        </div>
        {change && (
          <span
            className={`
              text-xs font-medium px-2 py-1 rounded
              ${
                change.isPositive
                  ? 'bg-green-500/10 text-green-400'
                  : 'bg-red-500/10 text-red-400'
              }
            `}
          >
            {change.isPositive ? '+' : ''}
            {change.value}%
          </span>
        )}
      </div>
      <h3 className="text-2xl font-bold text-white mb-1">{value}</h3>
      <p className="text-sm text-gray-400">{title}</p>
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
};

export default StatsCard;
