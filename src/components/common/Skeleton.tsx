import React from 'react';

interface SkeletonProps {
  className?: string;
  width?: string;
  height?: string;
  rounded?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  width,
  height,
  rounded = 'rounded-xl'
}) => {
  return (
    <div
      style={{ width, height }}
      className={`animate-pulse bg-[#E5F5EE]/70 border border-[#DCEAE3]/50 ${rounded} ${className}`}
    />
  );
};

export const SkeletonText: React.FC<{ lines?: number; className?: string }> = ({
  lines = 2,
  className = ''
}) => {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          height="12px"
          className={i === lines - 1 && lines > 1 ? 'w-3/4' : 'w-full'}
        />
      ))}
    </div>
  );
};

export const SkeletonStatCard: React.FC = () => {
  return (
    <div className="glass-card p-5 rounded-2xl border border-[#DCEAE3] space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton width="40%" height="14px" />
        <Skeleton width="32px" height="32px" rounded="rounded-xl" />
      </div>
      <Skeleton width="60%" height="28px" />
      <Skeleton width="80%" height="12px" />
    </div>
  );
};

export const SkeletonTable: React.FC<{ rows?: number }> = ({ rows = 5 }) => {
  return (
    <div className="glass-card p-4 rounded-2xl border border-[#DCEAE3] space-y-3">
      <div className="flex items-center justify-between pb-3 border-b border-[#DCEAE3]">
        <Skeleton width="30%" height="18px" />
        <Skeleton width="100px" height="32px" rounded="rounded-xl" />
      </div>
      <div className="space-y-2.5">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center justify-between gap-4 py-2 border-b border-[#DCEAE3]/40">
            <div className="flex items-center gap-3 flex-1">
              <Skeleton width="36px" height="36px" rounded="rounded-full" />
              <div className="space-y-1.5 flex-1">
                <Skeleton width="40%" height="14px" />
                <Skeleton width="25%" height="10px" />
              </div>
            </div>
            <Skeleton width="80px" height="24px" rounded="rounded-full" />
            <Skeleton width="60px" height="24px" rounded="rounded-xl" />
          </div>
        ))}
      </div>
    </div>
  );
};

export const SkeletonChart: React.FC = () => {
  return (
    <div className="glass-card p-5 rounded-2xl border border-[#DCEAE3] space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Skeleton width="140px" height="18px" />
          <Skeleton width="90px" height="12px" />
        </div>
        <Skeleton width="100px" height="28px" rounded="rounded-xl" />
      </div>
      <div className="h-48 flex items-end justify-between gap-2 pt-6">
        {[40, 65, 30, 85, 55, 90, 70, 45, 80, 60].map((h, i) => (
          <Skeleton
            key={i}
            className="flex-1"
            height={`${h}%`}
            rounded="rounded-t-lg"
          />
        ))}
      </div>
    </div>
  );
};

export const SkeletonDashboardView: React.FC = () => {
  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Banner Skeleton */}
      <div className="glass-card p-6 rounded-3xl border border-[#DCEAE3] flex flex-col md:flex-row gap-6 justify-between items-center">
        <div className="space-y-3 w-full md:w-2/3">
          <Skeleton width="200px" height="28px" />
          <Skeleton width="80%" height="16px" />
          <div className="flex gap-2 pt-2">
            <Skeleton width="90px" height="24px" rounded="rounded-full" />
            <Skeleton width="110px" height="24px" rounded="rounded-full" />
          </div>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <Skeleton width="140px" height="44px" rounded="rounded-2xl" />
          <Skeleton width="140px" height="44px" rounded="rounded-2xl" />
        </div>
      </div>

      {/* Grid Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SkeletonStatCard />
        <SkeletonStatCard />
        <SkeletonStatCard />
        <SkeletonStatCard />
      </div>

      {/* Middle Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <SkeletonChart />
          <SkeletonTable rows={4} />
        </div>
        <div className="space-y-6">
          <div className="glass-card p-5 rounded-2xl border border-[#DCEAE3] space-y-4">
            <Skeleton width="120px" height="18px" />
            <div className="space-y-3">
              <Skeleton height="60px" rounded="rounded-xl" />
              <Skeleton height="60px" rounded="rounded-xl" />
              <Skeleton height="60px" rounded="rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
