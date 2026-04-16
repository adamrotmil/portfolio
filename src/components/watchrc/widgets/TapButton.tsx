"use client";

import { motion, type MotionProps } from "motion/react";
import type { CSSProperties, PointerEvent, ReactNode } from "react";
import { IOS, SPRING } from "../tokens";

interface Props extends Omit<MotionProps, "children"> {
  onTap?: () => void;
  color?: string;
  textColor?: string;
  fullWidth?: boolean;
  size?: "sm" | "md" | "lg";
  variant?: "solid" | "outline" | "ghost";
  style?: CSSProperties;
  children: ReactNode;
  disabled?: boolean;
}

// iOS-style tappable button with proper press-scale feedback.  Uses
// whileTap for the nice 0.96 scale bounce when pressed.
export default function TapButton({
  onTap,
  color = IOS.blue,
  textColor,
  fullWidth = false,
  size = "md",
  variant = "solid",
  style,
  children,
  disabled = false,
  ...rest
}: Props) {
  const fg = textColor ?? (variant === "solid" ? IOS.text : color);
  const bg =
    variant === "solid" ? color :
    variant === "outline" ? "transparent" :
    "transparent";
  const padY = size === "sm" ? 4 : size === "lg" ? 9 : 6;
  const padX = size === "sm" ? 10 : size === "lg" ? 18 : 14;
  const fontSize = size === "sm" ? 11 : size === "lg" ? 14 : 12;

  const handlePointerUp = (e: PointerEvent<HTMLButtonElement>) => {
    if (disabled) return;
    e.preventDefault();
    onTap?.();
  };

  return (
    <motion.button
      {...rest}
      onPointerUp={handlePointerUp}
      whileTap={disabled ? undefined : { scale: 0.96 }}
      transition={SPRING.tap}
      disabled={disabled}
      style={{
        appearance: "none",
        border: variant === "outline" ? `1px solid ${color}` : "none",
        borderRadius: 999,
        padding: `${padY}px ${padX}px`,
        background: bg,
        color: fg,
        fontSize,
        fontWeight: 600,
        letterSpacing: 0.1,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        width: fullWidth ? "100%" : undefined,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        ...style,
      }}
    >
      {children}
    </motion.button>
  );
}
