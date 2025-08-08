import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import Card from './Card';

export default function SortableCard({ card, ...props }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`
        ${isDragging ? 'z-50 cursor-grabbing' : 'cursor-grab'}
        ${isDragging ? 'rotate-3 scale-105' : ''}
        transition-transform duration-200
      `}
    >
      <Card cardInfo={card} {...props} />
    </div>
  );
}