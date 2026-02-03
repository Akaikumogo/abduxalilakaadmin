import { memo, forwardRef } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

interface CardProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  children: React.ReactNode;
  hover?: boolean;
  className?: string;
  delay?: number;
}

export const Card = memo(forwardRef<HTMLDivElement, CardProps>(function Card(
  { children, hover = false, className = '', delay = 0, ...props },
  ref
) {
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3, delay }}
      whileHover={hover ? { y: -2, boxShadow: '0 4px 25px -5px rgba(0, 0, 0, 0.1)' } : undefined}
      className={`card ${hover ? 'cursor-pointer' : ''} ${className}`}
      {...props}
    >
      {children}
    </motion.div>
  );
}));

// Stats Card with gradient
interface StatCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: { value: number; isPositive: boolean };
  color?: 'primary' | 'accent' | 'success' | 'warning';
  delay?: number;
}

const colorConfig = {
  primary: {
    bg: 'from-primary-500 to-primary-600',
    light: 'bg-primary-100',
    text: 'text-primary-600',
  },
  accent: {
    bg: 'from-accent-500 to-accent-600',
    light: 'bg-accent-100',
    text: 'text-accent-600',
  },
  success: {
    bg: 'from-success-500 to-success-600',
    light: 'bg-success-100',
    text: 'text-success-600',
  },
  warning: {
    bg: 'from-warning-500 to-warning-600',
    light: 'bg-warning-100',
    text: 'text-warning-600',
  },
};

export const StatCard = memo(function StatCard({
  title,
  value,
  icon,
  trend,
  color = 'primary',
  delay = 0,
}: StatCardProps) {
  const config = colorConfig[color];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="stat-card group"
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-sm font-medium text-dark-500">{title}</p>
          <motion.p
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: delay + 0.1 }}
            className="text-3xl font-bold text-dark-900 mt-1"
          >
            {value}
          </motion.p>
        </div>
        {icon && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: delay + 0.2, type: 'spring' }}
            className={`p-3 rounded-xl ${config.light} ${config.text} group-hover:scale-110 transition-transform`}
          >
            {icon}
          </motion.div>
        )}
      </div>
      {trend && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: delay + 0.3 }}
          className="flex items-center gap-1"
        >
          <span className={`text-sm font-medium ${trend.isPositive ? 'text-success-600' : 'text-accent-600'}`}>
            {trend.isPositive ? '+' : ''}{trend.value}%
          </span>
          <span className="text-xs text-dark-400">so'nggi haftada</span>
        </motion.div>
      )}
    </motion.div>
  );
});

// Empty State
interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export const EmptyState = memo(function EmptyState({
  icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="empty-state"
    >
      {icon && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1, type: 'spring' }}
          className="empty-state-icon"
        >
          {icon}
        </motion.div>
      )}
      <h3 className="text-lg font-semibold text-dark-700 mb-2">{title}</h3>
      {description && <p className="text-dark-500 mb-6 max-w-sm">{description}</p>}
      {action}
    </motion.div>
  );
});
