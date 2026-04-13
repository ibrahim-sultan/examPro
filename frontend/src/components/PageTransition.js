import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const variants = {
  initial: { opacity: 0, y: 8 },
  in: { opacity: 1, y: 0 },
  out: { opacity: 0, y: -8 },
};

const PageTransition = ({ children, routeKey }) => {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={routeKey}
        initial="initial"
        animate="in"
        exit="out"
        transition={{ duration: 0.2, ease: 'easeOut' }}
        variants={variants}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};

export default PageTransition;
