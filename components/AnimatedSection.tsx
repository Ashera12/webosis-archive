'use client';

import React, { useRef, useEffect } from 'react';
import { motion, useInView, useAnimation } from 'framer-motion';

interface AnimatedSectionProps {
  children?: React.ReactNode;
  id?: string;
  className?: string;
  delay?: number;
  direction?: 'up' | 'down' | 'left' | 'right' | 'scale';
  animation?: string; // Alias for direction (e.g., "slide-up" maps to direction "up")
}

const AnimatedSection: React.FC<AnimatedSectionProps> = ({ 
  children, 
  id, 
  className, 
  delay = 0,
  direction = 'up',
  animation
}) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.1 });
  const controls = useAnimation();

  useEffect(() => {
    if (isInView) {
      controls.start("visible");
    }
  }, [isInView, controls]);

  // Map animation string to direction if provided (e.g., "slide-up" => "up")
  const effectiveDirection: 'up' | 'down' | 'left' | 'right' | 'scale' = animation
    ? (animation.replace('slide-', '') as 'up' | 'down' | 'left' | 'right' | 'scale')
    : direction;

  const getVariants = () => {
    const baseTransition = { 
      duration: 0.8, 
      ease: [0.25, 0.1, 0.25, 1] as const,
      delay 
    };

    switch (effectiveDirection) {
      case 'up':
        return {
          hidden: { opacity: 0, y: 60 },
          visible: { opacity: 1, y: 0, transition: baseTransition }
        };
      case 'down':
        return {
          hidden: { opacity: 0, y: -60 },
          visible: { opacity: 1, y: 0, transition: baseTransition }
        };
      case 'left':
        return {
          hidden: { opacity: 0, x: -60 },
          visible: { opacity: 1, x: 0, transition: baseTransition }
        };
      case 'right':
        return {
          hidden: { opacity: 0, x: 60 },
          visible: { opacity: 1, x: 0, transition: baseTransition }
        };
      case 'scale':
        return {
          hidden: { opacity: 0, scale: 0.8 },
          visible: { opacity: 1, scale: 1, transition: baseTransition }
        };
      default:
        return {
          hidden: { opacity: 0, y: 60 },
          visible: { opacity: 1, y: 0, transition: baseTransition }
        };
    }
  };

  return (
    <motion.div
      ref={ref}
      id={id}
      className={className}
      variants={getVariants()}
      initial="hidden"
      animate={controls}
    >
      {children}
    </motion.div>
  );
};

export default AnimatedSection;