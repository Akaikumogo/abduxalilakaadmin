import { memo } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';

interface AnimatedListProps<T> {
  items: T[];
  keyExtractor: (item: T) => string;
  renderItem: (item: T, index: number) => React.ReactNode;
  onReorder?: (items: T[]) => void;
  className?: string;
  emptyState?: React.ReactNode;
}

// Non-reorderable animated list
export const AnimatedList = memo(function AnimatedList<T>({
  items,
  keyExtractor,
  renderItem,
  className = '',
  emptyState,
}: AnimatedListProps<T>) {
  if (items.length === 0 && emptyState) {
    return <>{emptyState}</>;
  }

  return (
    <div className={className}>
      <AnimatePresence mode="popLayout">
        {items.map((item, index) => (
          <motion.div
            key={keyExtractor(item)}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            layout
          >
            {renderItem(item, index)}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}) as <T>(props: AnimatedListProps<T>) => React.ReactElement;

// Reorderable list with drag and drop
interface ReorderListProps<T> {
  items: T[];
  keyExtractor: (item: T) => string;
  renderItem: (item: T, index: number) => React.ReactNode;
  onReorder: (items: T[]) => void;
  className?: string;
  itemClassName?: string;
}

export const ReorderList = memo(function ReorderList<T>({
  items,
  keyExtractor,
  renderItem,
  onReorder,
  className = '',
  itemClassName = '',
}: ReorderListProps<T>) {
  return (
    <Reorder.Group
      axis="y"
      values={items}
      onReorder={onReorder}
      className={className}
    >
      <AnimatePresence mode="popLayout">
        {items.map((item, index) => (
          <Reorder.Item
            key={keyExtractor(item)}
            value={item}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            whileDrag={{ 
              scale: 1.02, 
              boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
              cursor: 'grabbing',
            }}
            transition={{ duration: 0.2 }}
            className={`${itemClassName} cursor-grab active:cursor-grabbing`}
          >
            {renderItem(item, index)}
          </Reorder.Item>
        ))}
      </AnimatePresence>
    </Reorder.Group>
  );
}) as <T>(props: ReorderListProps<T>) => React.ReactElement;

// List item with actions
interface ListItemProps {
  children: React.ReactNode;
  isActive?: boolean;
  onClick?: () => void;
  className?: string;
}

export const ListItem = memo(function ListItem({
  children,
  isActive = false,
  onClick,
  className = '',
}: ListItemProps) {
  return (
    <motion.div
      whileHover={{ backgroundColor: 'rgba(0,0,0,0.02)' }}
      className={`p-4 rounded-xl border transition-colors ${
        isActive 
          ? 'border-primary-500 bg-primary-50/50' 
          : 'border-dark-100 bg-white hover:border-dark-200'
      } ${onClick ? 'cursor-pointer' : ''} ${className}`}
      onClick={onClick}
    >
      {children}
    </motion.div>
  );
});
