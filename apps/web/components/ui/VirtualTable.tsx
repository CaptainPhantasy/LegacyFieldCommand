/**
 * Virtual scrolling table component
 * Efficiently renders large lists by only rendering visible items
 */

'use client';

import { useVirtualizer } from '@tanstack/react-virtual';
import { useRef, ReactNode } from 'react';

export interface VirtualTableProps<T> {
  data: T[];
  renderRow: (item: T, index: number) => ReactNode;
  rowHeight?: number;
  className?: string;
  containerHeight?: number;
  overscan?: number;
}

export function VirtualTable<T>({
  data,
  renderRow,
  rowHeight = 50,
  className = '',
  containerHeight = 600,
  overscan = 10,
}: VirtualTableProps<T>) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: data.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => rowHeight,
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
        {virtualItems.map((virtualRow) => (
          <div
            key={virtualRow.key}
            data-index={virtualRow.index}
            ref={virtualizer.measureElement}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: `${virtualRow.size}px`,
              transform: `translateY(${virtualRow.start}px)`,
            }}
          >
            {renderRow(data[virtualRow.index], virtualRow.index)}
          </div>
        ))}
      </div>
    </div>
  );
}

