/**
 * Virtual scrolling list component
 * Simpler than VirtualTable for basic list rendering
 */

'use client';

import { useVirtualizer } from '@tanstack/react-virtual';
import { useRef, ReactNode } from 'react';

export interface VirtualListProps<T> {
  data: T[];
  renderItem: (item: T, index: number) => ReactNode;
  itemHeight?: number | ((index: number) => number);
  className?: string;
  containerHeight?: number;
  overscan?: number;
  gap?: number;
}

export function VirtualList<T>({
  data,
  renderItem,
  itemHeight = 50,
  className = '',
  containerHeight = 600,
  overscan = 10,
  gap = 0,
}: VirtualListProps<T>) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: data.length,
    getScrollElement: () => parentRef.current,
    estimateSize: typeof itemHeight === 'function' ? itemHeight : () => itemHeight,
    overscan,
  });

  const totalSize = virtualizer.getTotalSize();
  const virtualItems = virtualizer.getVirtualItems();

  return (
    <div
      ref={parentRef}
      className={`overflow-auto ${className}`}
      style={{ height: `${containerHeight}px` }}
    >
      <div
        style={{
          height: `${totalSize}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualItems.map((virtualItem) => (
          <div
            key={virtualItem.key}
            data-index={virtualItem.index}
            ref={virtualizer.measureElement}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: `${virtualItem.size}px`,
              transform: `translateY(${virtualItem.start}px)`,
              marginBottom: gap > 0 ? `${gap}px` : undefined,
            }}
          >
            {renderItem(data[virtualItem.index], virtualItem.index)}
          </div>
        ))}
      </div>
    </div>
  );
}

