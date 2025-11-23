/**
 * Link Cell Component
 * Displays and edits links (URL + Text)
 */

'use client';

import { useState, useRef, useEffect } from 'react';
import { ExternalLink, Link as LinkIcon } from 'lucide-react';

interface LinkValue {
  url: string;
  text: string;
}

interface LinkCellProps {
  value: LinkValue | string | null;
  isEditing: boolean;
  onSave: (value: LinkValue) => void;
  onCancel: () => void;
}

export function LinkCell({ value, isEditing, onSave, onCancel }: LinkCellProps) {
  const [linkData, setLinkData] = useState<LinkValue>({ url: '', text: '' });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value) {
      if (typeof value === 'string') {
        try {
          const parsed = JSON.parse(value);
          setLinkData(parsed);
        } catch {
          setLinkData({ url: value, text: value });
        }
      } else {
        setLinkData(value as LinkValue);
      }
    } else {
      setLinkData({ url: '', text: '' });
    }
  }, [value]);

  // Handle click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        if (isEditing) {
          // Only save if there is at least a URL
          if (linkData.url) {
            onSave({
              url: linkData.url,
              text: linkData.text || linkData.url,
            });
          } else {
            onCancel();
          }
        }
      }
    }

    if (isEditing) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isEditing, linkData, onSave, onCancel]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (linkData.url) {
        onSave({
          url: linkData.url,
          text: linkData.text || linkData.url,
        });
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
    }
  };

  if (!isEditing) {
    if (!linkData.url) {
      return (
        <span className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
          —
        </span>
      );
    }

    return (
      <a
        href={linkData.url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1.5 group hover:underline truncate"
        style={{ color: 'var(--accent)' }}
        onClick={(e) => e.stopPropagation()} // Prevent editing when clicking the link directly
      >
        <LinkIcon size={14} className="flex-shrink-0" />
        <span className="truncate text-sm">{linkData.text || linkData.url}</span>
        <ExternalLink size={12} className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
      </a>
    );
  }

  return (
    <div
      ref={containerRef}
      className="absolute z-50 p-3 bg-[var(--elevated)] border border-[var(--border-subtle)] rounded-md shadow-lg min-w-[250px]"
      style={{ top: '0', left: '0' }}
    >
      <div className="space-y-2">
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
            Web Address (URL)
          </label>
          <input
            type="url"
            value={linkData.url}
            onChange={(e) => setLinkData({ ...linkData, url: e.target.value })}
            onKeyDown={handleKeyDown}
            placeholder="https://..."
            className="w-full px-2 py-1 text-sm rounded border border-[var(--border-subtle)] bg-[var(--background)]"
            autoFocus
          />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
            Text to Display
          </label>
          <input
            type="text"
            value={linkData.text}
            onChange={(e) => setLinkData({ ...linkData, text: e.target.value })}
            onKeyDown={handleKeyDown}
            placeholder="My Link"
            className="w-full px-2 py-1 text-sm rounded border border-[var(--border-subtle)] bg-[var(--background)]"
          />
        </div>
        <div className="text-xs text-right" style={{ color: 'var(--text-tertiary)' }}>
          Enter to save
        </div>
      </div>
    </div>
  );
}

