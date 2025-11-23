/**
 * Rating Cell Component
 * Displays and edits star rating (1-5)
 */

'use client';

import { useState } from 'react';
import { Star } from 'lucide-react';

interface RatingCellProps {
  value: number | null;
  isEditing: boolean;
  onSave: (value: number) => void;
  onCancel: () => void;
}

export function RatingCell({ value, isEditing, onSave, onCancel }: RatingCellProps) {
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);
  const [tempRating, setTempRating] = useState<number | null>(value ?? null);

  const displayRating = hoveredRating ?? tempRating ?? value ?? 0;

  const handleStarClick = (rating: number) => {
    setTempRating(rating);
    onSave(rating);
  };

  const handleMouseEnter = (rating: number) => {
    if (isEditing) {
      setHoveredRating(rating);
    }
  };

  const handleMouseLeave = () => {
    if (isEditing) {
      setHoveredRating(null);
    }
  };

  if (!isEditing) {
    // Display mode
    if (value === null || value === undefined || value === 0) {
      return (
        <span className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
          —
        </span>
      );
    }

    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={16}
            className={star <= value ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
            style={{
              color: star <= value ? '#fbbf24' : 'var(--border-subtle)',
              fill: star <= value ? '#fbbf24' : 'none',
            }}
          />
        ))}
      </div>
    );
  }

  // Edit mode
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => handleStarClick(star)}
          onMouseEnter={() => handleMouseEnter(star)}
          onMouseLeave={handleMouseLeave}
          className="p-0.5 hover:scale-110 transition-transform cursor-pointer"
          aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
        >
          <Star
            size={18}
            className={star <= displayRating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
            style={{
              color: star <= displayRating ? '#fbbf24' : 'var(--border-subtle)',
              fill: star <= displayRating ? '#fbbf24' : 'none',
            }}
          />
        </button>
      ))}
    </div>
  );
}

