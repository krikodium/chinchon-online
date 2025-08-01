import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import Card from './Card';

function SortableCard({ card }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: card.id });

  const style = {
    // dnd-kit se encarga del transform durante el arrastre.
    transform: CSS.Transform.toString(transform),
    transition,
    // El z-index y otros efectos de arrastre se gestionan en PlayerHand.module.css
  };

  // Se eliminó motion.div para simplificar y evitar conflictos.
  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
    >
      <Card cardInfo={card} />
    </div>
  );
}

export default SortableCard;