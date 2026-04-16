"use client";

import { animate, useMotionValue, useTransform } from "motion/react";
import { motion } from "motion/react";
import { useEffect } from "react";

export default function AnimatedNumber({
  value,
  fractionDigits = 0,
  format,
}: {
  value: number;
  fractionDigits?: number;
  format?: (v: number) => string;
}) {
  const mv = useMotionValue(value);
  useEffect(() => {
    const controls = animate(mv, value, { type: "spring", stiffness: 220, damping: 24 });
    return () => controls.stop();
  }, [value, mv]);
  const display = useTransform(mv, (v) =>
    format ? format(v) : v.toFixed(fractionDigits),
  );
  return <motion.span>{display}</motion.span>;
}
