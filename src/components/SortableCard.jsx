import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion } from 'framer-motion';
import Card from './Card';
import styles from './Card.module.css';

function SortableCard({ card }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: card.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    // Aseguramos un z-index muy alto solo cuando se arrastra
    zIndex: isDragging ? 9999 : 'auto', 
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={styles.sortableCard}
      // Esta animación ahora es la única que controla el arrastre.
      whileDrag={{
        scale: 1.15,
        rotate: 6,
        zIndex: 9999, // También se aplica aquí para consistencia
        boxShadow: '0 12px 24px rgba(0,0,0,0.35)',
      }}
      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
    >
      <Card cardInfo={card} />
    </motion.div>
  );
}

export default SortableCard;