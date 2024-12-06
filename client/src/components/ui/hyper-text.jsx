"use client";;
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

const alphabets = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

const getRandomInt = (max) => Math.floor(Math.random() * max);

export default function HyperText({
  rederedHighlight , 
  text,
  duration = 800,

  framerProps = {
    initial: { opacity: 0, y: -10 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 3 },
  },

  className,
  animateOnLoad = true
}) {
  const [displayText, setDisplayText] = useState(text.split(""));
  const [trigger, setTrigger] = useState(false);
  const interations = useRef(0);
  const isFirstRender = useRef(true);

  const triggerAnimation = () => {
    interations.current = 0;
    setTrigger(true);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      if (!animateOnLoad && isFirstRender.current) {
        clearInterval(interval);
        isFirstRender.current = false;
        return;
      }
      if (interations.current < text.length) {
        setDisplayText((t) =>
          t.map((l, i) =>
            l === " "
              ? l
              : i <= interations.current
                ? text[i]
                : alphabets[getRandomInt(26)]));
        interations.current = interations.current + 0.1;
      } else {
        setTrigger(false);
        clearInterval(interval);
      }
    }, duration / (text.length * 10));
    // Clean up interval on unmount
    return () => clearInterval(interval);
  }, [rederedHighlight]);

  return (
    (<h1
      
      onMouseEnter={triggerAnimation}>
      <AnimatePresence mode="wait">
        {displayText.map((letter, i) => (
          <motion.span
            key={i}
            className={cn("", 'sdfd' === " " ? "w-3" : "", className)}
            {...framerProps}>
            {letter.toUpperCase()}
          </motion.span>
        ))}
      </AnimatePresence>
    </h1>)
  );
}
