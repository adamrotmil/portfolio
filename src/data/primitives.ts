import type { ComponentType } from "react";
import OvershootSpring from "@/components/primitives/demos/OvershootSpring";
import MaskReveal from "@/components/primitives/demos/MaskReveal";
import ReactiveTilt from "@/components/primitives/demos/ReactiveTilt";

export type Primitive = {
  id: string;
  title: string;
  tag: string;
  description: string;
  why: string;
  Component: ComponentType;
};

export const PRIMITIVES: Primitive[] = [
  {
    id: "overshoot-spring",
    title: "Overshoot Spring",
    tag: "Spring",
    description:
      "Motion that passes its target and settles back with a gentle rebound.",
    why: "The single most common primitive in iOS-feel UI. The overshoot gives mass and energy — without it, every transition reads as flat or robotic. Tune stiffness and damping to shape the character: stiffer for snappy, lighter damping for bouncy.",
    Component: OvershootSpring,
  },
  {
    id: "mask-reveal",
    title: "Mask Reveal",
    tag: "Reveal",
    description:
      "Content unveiled through an expanding clip-path, one slice at a time.",
    why: "The technique behind every editorial headline entrance you've admired — The New Yorker, Apple keynotes, Stripe Press. Reveals feel intentional because the content appears to be there already, waiting for the camera. Pair with stagger for a cinematic cadence.",
    Component: MaskReveal,
  },
  {
    id: "reactive-tilt",
    title: "Reactive Tilt",
    tag: "Input",
    description:
      "A surface that rotates in response to pointer position, with springs smoothing the motion.",
    why: "Binds continuous user input to continuous output — the foundational pattern for hero elements, 3D cards, cursor-following dots, and Vision Pro-style glass. Once you have this hook, you have every cursor-reactive effect.",
    Component: ReactiveTilt,
  },
];
