'use client';

import React from 'react';

interface SkeletonLoaderProps {
  rows?: number;
  className?: string;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  rows = 3,
  className = '',
}) => {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="h-4 bg-slate-700 rounded animate-pulse"
          style={{ width: `${100 - i * 10}%` }}
        />
      ))}
    </div>
  );
};

export const TableSkeleton: React.FC<{ rows?: number; cols?: number }> = ({
  rows = 5,
  cols = 5,
}) => {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4">
          {Array.from({ length: cols }).map((_, j) => (
            <div
              key={j}
              className="h-12 bg-slate-700 rounded animate-pulse flex-1"
            />
          ))}
        </div>
      ))}
    </div>
  );
};

export const CardSkeleton: React.FC = () => {
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
      <div className="h-6 bg-slate-700 rounded w-1/3 mb-4 animate-pulse" />
      <div className="space-y-2">
        <div className="h-4 bg-slate-700 rounded w-full animate-pulse" />
        <div className="h-4 bg-slate-700 rounded w-5/6 animate-pulse" />
        <div className="h-4 bg-slate-700 rounded w-4/6 animate-pulse" />
      </div>
    </div>
  );
};
