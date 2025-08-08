import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Info, CheckCircle, AlertCircle, Clock, Trophy, Target } from 'lucide-react';

const messageTypes = {
  info: {
    icon: Info,
    className: 'bg-blue-500/20 border-blue-500/30 text-blue-200'
  },
  success: {
    icon: CheckCircle,
    className: 'bg-green-500/20 border-green-500/30 text-green-200'
  },
  warning: {
    icon: AlertCircle,
    className: 'bg-yellow-500/20 border-yellow-500/30 text-yellow-200'
  },
  turn: {
    icon: Clock,
    className: 'bg-purple-500/20 border-purple-500/30 text-purple-200'
  },
  win: {
    icon: Trophy,
    className: 'bg-yellow-500/20 border-yellow-500/30 text-yellow-200'
  },
  action: {
    icon: Target,
    className: 'bg-indigo-500/20 border-indigo-500/30 text-indigo-200'
  }
};

export default function GameMessage({ message, type = 'info', show = true }) {
  const messageConfig = messageTypes[type] || messageTypes.info;
  const IconComponent = messageConfig.icon;

  return (
    <AnimatePresence>
      {show && message && (
        <motion.div
          className="fixed top-2 sm:top-4 left-1/2 transform -translate-x-1/2 z-30 px-2"
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          transition={{ 
            type: "spring", 
            stiffness: 300, 
            damping: 25 
          }}
        >
          <div className={`
            flex items-center gap-2 sm:gap-3 px-3 sm:px-6 py-2 sm:py-3 rounded-full 
            border backdrop-blur-xl font-medium max-w-[90vw]
            ${messageConfig.className}
          `}>
            <IconComponent className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
            <span className="text-xs sm:text-sm font-medium truncate">{message}</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}