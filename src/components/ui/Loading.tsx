import { memo } from 'react';
import { motion } from 'framer-motion';

// Spinner component
export const Spinner = memo(function Spinner({ 
  size = 'md',
  className = '' 
}: { 
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-2',
    lg: 'w-12 h-12 border-3',
  };

  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      className={`${sizeClasses[size]} border-primary-200 border-t-primary-600 rounded-full ${className}`}
    />
  );
});

// Full page loading
export const PageLoading = memo(function PageLoading() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center gap-4"
      >
        <Spinner size="lg" />
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-dark-500 text-sm"
        >
          Yuklanmoqda...
        </motion.p>
      </motion.div>
    </div>
  );
});

// Skeleton components
export const Skeleton = memo(function Skeleton({ 
  className = '' 
}: { 
  className?: string;
}) {
  return (
    <div className={`skeleton ${className}`} />
  );
});

export const SkeletonCard = memo(function SkeletonCard() {
  return (
    <div className="card animate-pulse">
      <div className="flex items-center gap-4 mb-4">
        <Skeleton className="w-12 h-12 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
      <div className="space-y-2">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-5/6" />
        <Skeleton className="h-3 w-4/6" />
      </div>
    </div>
  );
});

export const SkeletonTable = memo(function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="card p-0 overflow-hidden animate-pulse">
      <div className="bg-dark-50 px-4 py-3 border-b border-dark-100">
        <div className="flex gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-4 flex-1" />
          ))}
        </div>
      </div>
      <div className="divide-y divide-dark-50">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="px-4 py-4">
            <div className="flex gap-4">
              {[1, 2, 3, 4, 5].map((j) => (
                <Skeleton key={j} className="h-4 flex-1" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

// Inline loading for buttons
export const ButtonLoading = memo(function ButtonLoading() {
  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
    />
  );
});
