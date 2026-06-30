import React from 'react';

export const CardSkeleton = () => (
  <div className="glass-panel p-6 rounded-[20px] w-full flex flex-col gap-4">
    <div className="h-6 w-1/3 skeleton-shimmer rounded-lg"></div>
    <div className="h-12 w-full skeleton-shimmer rounded-lg"></div>
    <div className="h-4 w-2/3 skeleton-shimmer rounded-lg"></div>
  </div>
);

export const ListSkeleton = ({ rows = 4 }) => (
  <div className="flex flex-col gap-3 w-full">
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="glass-panel p-4 rounded-xl flex items-center justify-between">
        <div className="flex items-center gap-3 w-2/3">
          <div className="h-10 w-10 skeleton-shimmer rounded-full flex-shrink-0"></div>
          <div className="flex flex-col gap-2 w-full">
            <div className="h-4 w-1/3 skeleton-shimmer rounded-md"></div>
            <div className="h-3 w-1/2 skeleton-shimmer rounded-md"></div>
          </div>
        </div>
        <div className="h-8 w-20 skeleton-shimmer rounded-lg"></div>
      </div>
    ))}
  </div>
);

export const ChartSkeleton = () => (
  <div className="glass-panel p-6 rounded-[20px] w-full h-[300px] flex flex-col gap-4 justify-between">
    <div className="h-6 w-1/4 skeleton-shimmer rounded-lg"></div>
    <div className="h-[200px] w-full skeleton-shimmer rounded-lg"></div>
  </div>
);

