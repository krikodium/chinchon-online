import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion } from 'framer-motion';
import Card from './Card';
// Importación corregida para apuntar a los estilos de la carta
import styles from './Card.module.css';

function SortableCard({ card }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: card.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 999 : 'auto',
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={styles.sortableCard} // Esta clase aplica el efecto al arrastrar
      whileHover={{ scale: 1.08, y: -10 }}
      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
    >
      <Card cardInfo={card} />
    </motion.div>
  );
}

export default SortableCard;