import type { ComponentType } from "react";
import OvershootSpring from "@/components/primitives/demos/OvershootSpring";
import MaskReveal from "@/components/primitives/demos/MaskReveal";
import ReactiveTilt from "@/components/primitives/demos/ReactiveTilt";
import TurbulenceBurst from "@/components/primitives/demos/TurbulenceBurst";
import RubberBand from "@/components/primitives/demos/RubberBand";
import Stagger from "@/components/primitives/demos/Stagger";
import AmbientBreath from "@/components/primitives/demos/AmbientBreath";
import LiquidGlass from "@/components/primitives/demos/LiquidGlass";
import ParallaxDepth from "@/components/primitives/demos/ParallaxDepth";
import SvgMorph from "@/components/primitives/demos/SvgMorph";
import SharedElementFlip from "@/components/primitives/demos/SharedElementFlip";
import GestureScrub from "@/components/primitives/demos/GestureScrub";
import MultiStageSequence from "@/components/primitives/demos/MultiStageSequence";
import NativeFeedLab from "@/components/primitives/demos/NativeFeedLab";
import NativeFeedLabTeaser from "@/components/primitives/demos/NativeFeedLabTeaser";

export type PrimitiveNote = {
  heading: string;
  body: string;
};

export type Primitive = {
  id: string;
  title: string;
  tag: string;
  description: string;
  why: string;
  /** Shown in the tile on /primitives. */
  Component: ComponentType;
  /**
   * Opt-in detail page at /primitives/[id]. If present, the tile becomes
   * a link and this component renders full-size on the detail page.
   */
  DetailComponent?: ComponentType;
  /** Longer-form teaching notes rendered under the detail-page demo. */
  notes?: PrimitiveNote[];
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
    id: "rubber-band",
    title: "Rubber Band",
    tag: "Gesture",
    description:
      "A draggable element that resists past its bounds and springs back on release.",
    why: "Native-feel iOS scrolling and sheets rely on this resistance curve. It tells the user 'there's an edge' without hard-stopping. One line of config in use-gesture; enormous jump in perceived polish.",
    Component: RubberBand,
  },
  {
    id: "mask-reveal",
    title: "Mask Reveal",
    tag: "Reveal",
    description:
      "Content unveiled through an expanding clip-path, one slice at a time.",
    why: "The technique behind every editorial headline entrance — The New Yorker, Apple keynotes, Stripe Press. Reveals feel intentional because the content appears to be there already, waiting for the camera. Pair with stagger for cinematic cadence.",
    Component: MaskReveal,
  },
  {
    id: "stagger",
    title: "Stagger",
    tag: "Choreography",
    description:
      "A group of elements animating together, each offset by a small delay.",
    why: "The cheap trick that rescues dozens of use cases — lists, onboarding dots, menu items, icon grids. A 60–100ms offset turns a wall of simultaneous motion into rhythm. Variants propagate, so you define the child animation once.",
    Component: Stagger,
  },
  {
    id: "ambient-breath",
    title: "Ambient Breath",
    tag: "Ambient",
    description:
      "Always-on, low-amplitude motion on a hero element to signal life.",
    why: "The detail that separates 'static page' from 'alive product.' Subtle scale and opacity cycles on a glow — low enough to stay peripheral, present enough that its absence would feel dead. Two layers breathing at different periods add depth.",
    Component: AmbientBreath,
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
  {
    id: "parallax-depth",
    title: "Parallax Depth",
    tag: "Depth",
    description:
      "Layered elements that offset at different rates to imply three-dimensional space.",
    why: "Perceived depth on a flat screen is differential motion. Back layers move least, front layers most. Three layers is almost always enough; more reads as gimmicky. Spring-smooth the input so the scene glides rather than twitches.",
    Component: ParallaxDepth,
  },
  {
    id: "liquid-glass",
    title: "Liquid Glass",
    tag: "Material",
    description:
      "A frosted panel whose blur and saturation turn whatever's behind it into a refraction.",
    why: "The Vision Pro / iOS 26 aesthetic is one CSS property — backdrop-filter — plus craft around it. A thin inner border and subtle outer shadow sell the physicality. The panel needs motion *behind* it to show off; static glass looks painted on.",
    Component: LiquidGlass,
  },
  {
    id: "turbulence-burst",
    title: "Turbulence Burst",
    tag: "Material",
    description:
      "A particle cloud treated as a material — press and drag to perturb it, releasing impulses that shift its color temperature.",
    why: "Particle systems are the language behind Apple's Titanium marketing, iOS haptic visuals, and Meta's reaction effects. The recipe: many cheap entities under a shared noise field, rendered with additive blending. Re-skin the loop as smoke, water, sand, or metal — the math doesn't change.",
    Component: TurbulenceBurst,
  },
  {
    id: "svg-morph",
    title: "SVG Morph",
    tag: "Reveal",
    description:
      "One SVG path smoothly interpolated into another, even when their topologies differ.",
    why: "The browser can't interpolate between arbitrary SVG paths on its own. Flubber resamples both shapes into matched point sets, then tweens between them. This is the technique behind every app-icon morph, every loading spinner that unfolds into a checkmark.",
    Component: SvgMorph,
  },
  {
    id: "shared-element-flip",
    title: "Shared Element",
    tag: "Transition",
    description:
      "A tile that expands in place into a detail panel, then collapses back — without a cut.",
    why: "The FLIP technique — First, Last, Invert, Play — measures the two layouts and reverse-engineers a seamless animation. Motion's layoutId does the bookkeeping. The result feels like physical continuity, because the same element simply travels between states.",
    Component: SharedElementFlip,
  },
  {
    id: "gesture-scrub",
    title: "Gesture Scrub",
    tag: "Gesture",
    description:
      "Animation progress bound directly to drag input — the user becomes the playhead.",
    why: "Decouple animation from time. Every downstream visual reads a shared 0..1 progress value driven by gesture, not a clock. This is how scrub-through interactions feel premium — the motion is exactly as fast as your finger.",
    Component: GestureScrub,
  },
  {
    id: "multi-stage-sequence",
    title: "Multi-stage Sequence",
    tag: "Choreography",
    description:
      "A chain of simple animations with deliberate pauses between them.",
    why: "Polished splashes and product intros are almost never a single animation — they're a choreographed chain. The secret is the *empty air* between stages. Rushed sequences feel frantic; well-paced ones feel cinematic. Delay is the director.",
    Component: MultiStageSequence,
  },
  {
    id: "native-feed-lab",
    title: "Native Feed Lab",
    tag: "Mobile UI",
    description:
      "A high-performance social feed shell: snap pager, rubber-band ends, canvas reaction burst, bottom sheet, and layered mobile chrome.",
    why: "A composite of almost every other primitive in this kit — easing, gesture thresholds, parallax, mask layering, liquid-glass chrome, particle burst — fused into one phone-scale shell. React handles state at interaction boundaries; requestAnimationFrame owns continuous motion; everything moves via transform and opacity. Swap the content for video, WebGL, or prototypes — the primitive is the shell.",
    Component: NativeFeedLabTeaser,
    DetailComponent: NativeFeedLab,
    notes: [
      {
        heading: "What it demonstrates",
        body: "A vertical pager with velocity-based post changes, rubber-band resistance at the ends, a canvas reaction-burst layer, a pull-to-refresh affordance, a bottom sheet, and tab dots — all inside one full-screen mobile shell. The same shell can host any content: video, cards, WebGL, prototypes. The primitive is the chrome plus the gesture physics.",
      },
      {
        heading: "The motion rule",
        body: "React owns state changes at interaction boundaries (active index, liked, sheet open). An on-demand requestAnimationFrame loop owns continuous motion and sleeps when settled. setState is never called during pointer movement. Moving layers use transform, opacity, and filter — never top/left/width/height — so the compositor keeps them on the GPU. The cost of this discipline is zero, the win is 60fps.",
      },
      {
        heading: "Easing vs. spring (the tuning call)",
        body: "Regular post-to-post transitions use exponential ease-out — position += (target - position) * 0.22 — which is monotonic, snappy, and never overshoots. The underdamped spring is reserved for the one moment it belongs: when you keep pulling past the first or last post and release. Then the ends bounce back with a visible overshoot that says 'this is the edge of the feed.' Overshoot is precious; spend it where it communicates.",
      },
      {
        heading: "Tuning knobs",
        body: "Ease coefficient 0.22 controls snap speed — higher is snappier, lower is slower. Drag threshold 72px and velocity threshold 7px/frame determine how much intent counts as a post change. The rubber-band constant 0.55 is the resistance curve past the ends. Inside the bouncy spring path, stiffness 0.12 and damping 0.82 shape how the edge rebound reads — softer or crisper.",
      },
      {
        heading: "The reaction burst",
        body: "The heart tap emits 34 particles from the click point into a canvas that spans the whole phone. Each frame: apply a gentle gravity, decay velocity, fade alpha by life remaining. Additive blending is implicit since the particles are drawn with alpha compositing onto a transparent canvas. When the particle array empties, the raf loop shuts itself off — zero cost when idle.",
      },
      {
        heading: "Re-skin ideas",
        body: "Swap the gradients for video loops, WebGL shaders, or case-study hero frames. Replace the reaction rail with custom affordances. Change the bottom sheet content to render a live MapLibre map, a Three.js scene, or a prototype iframe. The pager physics don't care what's inside each card.",
      },
    ],
  },
];
