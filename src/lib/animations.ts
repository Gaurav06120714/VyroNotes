// Reusable Framer Motion variants — keep transitions consistent across app.
import type { Variants, Transition } from "framer-motion";

export const easing: number[] = [0.22, 1, 0.36, 1]; // gentle ease-out

export const fadeUp: Variants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

export const fadeUpTransition: Transition = {
  duration: 0.3,
  ease: easing,
};

export const fadeIn: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

export const scaleIn: Variants = {
  initial: { opacity: 0, scale: 0.96 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.96 },
};

export const scaleInTransition: Transition = {
  duration: 0.22,
  ease: easing,
};

export const stagger: Variants = {
  animate: {
    transition: { staggerChildren: 0.04, delayChildren: 0.05 },
  },
};

export const staggerItem: Variants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.25, ease: easing } },
};

export const slideRight: Variants = {
  initial: { x: "-100%" },
  animate: { x: 0 },
  exit: { x: "-100%" },
};

export const slideRightTransition: Transition = {
  duration: 0.28,
  ease: easing,
};

export const popIn: Variants = {
  initial: { opacity: 0, scale: 0.92, y: 8 },
  animate: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.92, y: 8 },
};
