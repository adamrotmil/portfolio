"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { assetPath } from "@/lib/basePath";

/**
 * Sight — live object detection with design-grade boxes.
 *
 * The stack: MediaPipe ObjectDetector (EfficientDet-Lite0, ~7MB tflite)
 * running entirely in-browser via wasm — video never leaves the device.
 *
 * The motion rule (same as Native Feed Lab): React owns state at
 * interaction boundaries (idle → loading → live). A requestAnimationFrame
 * loop owns continuous motion. Detections arrive at whatever rate the
 * model manages (~10–30 Hz); the boxes are DOM nodes managed imperatively
 * and *springed* toward their latest targets every display frame, so
 * tracking feels continuous instead of snapping at detection rate. This
 * interpolation is the entire difference between "CV debug view" and
 * "product".
 */

const WASM_CDN =
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/wasm";
const SCORE_THRESHOLD = 0.45;
const MAX_RESULTS = 8;
/** Exponential-ease factor per frame — higher is snappier. */
const EASE = 0.26;
/** Minimum IoU to consider a new detection the same object as a track. */
const MATCH_IOU = 0.2;

type Phase = "idle" | "loading" | "live" | "error";

type Track = {
  id: number;
  label: string;
  score: number;
  /** Current (rendered) box in stage coordinates. */
  x: number;
  y: number;
  w: number;
  h: number;
  /** Latest detection target in stage coordinates. */
  tx: number;
  ty: number;
  tw: number;
  th: number;
  opacity: number;
  targetOpacity: number;
  /** DOM nodes owned by this track. */
  el: HTMLDivElement;
  chipEl: HTMLDivElement;
  scoreEl: HTMLSpanElement;
};

function iou(
  a: { x: number; y: number; w: number; h: number },
  b: { x: number; y: number; w: number; h: number },
) {
  const x1 = Math.max(a.x, b.x);
  const y1 = Math.max(a.y, b.y);
  const x2 = Math.min(a.x + a.w, b.x + b.w);
  const y2 = Math.min(a.y + a.h, b.y + b.h);
  const inter = Math.max(0, x2 - x1) * Math.max(0, y2 - y1);
  const union = a.w * a.h + b.w * b.h - inter;
  return union > 0 ? inter / union : 0;
}

export default function SightLab() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [stats, setStats] = useState({ fps: 0, detHz: 0, count: 0 });

  const stageRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const boxLayerRef = useRef<HTMLDivElement>(null);
  const cleanupRef = useRef<() => void>(() => {});

  const start = useCallback(async () => {
    setPhase("loading");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      const video = videoRef.current!;
      video.srcObject = stream;
      await video.play();

      // Front cameras are conventionally mirrored; detections must be
      // mirrored to match what the user sees.
      const settings = stream.getVideoTracks()[0]?.getSettings();
      const mirrored = settings?.facingMode !== "environment";
      video.style.transform = mirrored ? "scaleX(-1)" : "none";

      const { FilesetResolver, ObjectDetector } = await import(
        "@mediapipe/tasks-vision"
      );
      const fileset = await FilesetResolver.forVisionTasks(WASM_CDN);
      const detector = await ObjectDetector.createFromOptions(fileset, {
        baseOptions: {
          modelAssetPath: assetPath("/models/efficientdet_lite0.tflite"),
          delegate: "GPU",
        },
        runningMode: "VIDEO",
        scoreThreshold: SCORE_THRESHOLD,
        maxResults: MAX_RESULTS,
      });

      setPhase("live");

      const stage = stageRef.current!;
      const layer = boxLayerRef.current!;
      const tracks: Track[] = [];
      let nextId = 1;
      let lastVideoTime = -1;
      let raf = 0;
      let frames = 0;
      let detections = 0;
      let statClock = performance.now();

      function makeTrackNodes(label: string) {
        const el = document.createElement("div");
        el.className = "sight-box";
        const chipEl = document.createElement("div");
        chipEl.className = "sight-chip";
        const labelEl = document.createElement("span");
        labelEl.textContent = label;
        const scoreEl = document.createElement("span");
        scoreEl.className = "sight-score";
        chipEl.append(labelEl, scoreEl);
        el.append(chipEl);
        layer.append(el);
        return { el, chipEl, scoreEl };
      }

      function loop() {
        const stageW = stage.clientWidth;
        const stageH = stage.clientHeight;
        const vw = video.videoWidth;
        const vh = video.videoHeight;

        // Run the model only when the video has a fresh frame.
        if (vw > 0 && video.currentTime !== lastVideoTime) {
          lastVideoTime = video.currentTime;
          const result = detector.detectForVideo(video, performance.now());
          detections++;

          // Map from video pixels to stage coordinates. The video is
          // rendered with object-fit: cover, so scale to fill and center.
          const scale = Math.max(stageW / vw, stageH / vh);
          const offX = (stageW - vw * scale) / 2;
          const offY = (stageH - vh * scale) / 2;

          const updated = new Set<Track>();
          for (const det of result.detections) {
            const bb = det.boundingBox;
            const cat = det.categories[0];
            if (!bb || !cat) continue;
            let bx = bb.originX * scale + offX;
            const by = bb.originY * scale + offY;
            const bw = bb.width * scale;
            const bh = bb.height * scale;
            if (mirrored) bx = stageW - bx - bw;

            const target = { x: bx, y: by, w: bw, h: bh };
            // Greedy match: same label, best IoU above threshold.
            let best: Track | null = null;
            let bestIou = MATCH_IOU;
            for (const t of tracks) {
              if (t.label !== cat.categoryName || updated.has(t)) continue;
              const v = iou(t, target);
              if (v > bestIou) {
                bestIou = v;
                best = t;
              }
            }
            if (best) {
              best.tx = bx;
              best.ty = by;
              best.tw = bw;
              best.th = bh;
              best.score = cat.score;
              best.targetOpacity = 1;
              updated.add(best);
            } else {
              const nodes = makeTrackNodes(cat.categoryName);
              const t: Track = {
                id: nextId++,
                label: cat.categoryName,
                score: cat.score,
                // New boxes are born at their target, slightly small,
                // and fade in — pop without teleporting.
                x: bx + bw * 0.04,
                y: by + bh * 0.04,
                w: bw * 0.92,
                h: bh * 0.92,
                tx: bx,
                ty: by,
                tw: bw,
                th: bh,
                opacity: 0,
                targetOpacity: 1,
                ...nodes,
              };
              tracks.push(t);
              updated.add(t);
            }
          }
          // Anything the model no longer sees fades out.
          for (const t of tracks) {
            if (!updated.has(t)) t.targetOpacity = 0;
          }
        }

        // Spring every rendered property toward its target, every frame.
        let topTrack: Track | null = null;
        for (const t of tracks) {
          t.x += (t.tx - t.x) * EASE;
          t.y += (t.ty - t.y) * EASE;
          t.w += (t.tw - t.w) * EASE;
          t.h += (t.th - t.h) * EASE;
          t.opacity += (t.targetOpacity - t.opacity) * 0.18;
          if (!topTrack || t.score > topTrack.score) topTrack = t;
        }
        for (let i = tracks.length - 1; i >= 0; i--) {
          const t = tracks[i];
          if (t.targetOpacity === 0 && t.opacity < 0.03) {
            t.el.remove();
            tracks.splice(i, 1);
            continue;
          }
          t.el.style.transform = `translate3d(${t.x}px, ${t.y}px, 0)`;
          t.el.style.width = `${t.w}px`;
          t.el.style.height = `${t.h}px`;
          t.el.style.opacity = String(t.opacity);
          t.el.dataset.top = t === topTrack ? "true" : "false";
          t.scoreEl.textContent = `${Math.round(t.score * 100)}`;
        }

        frames++;
        const now = performance.now();
        if (now - statClock > 500) {
          setStats({
            fps: Math.round((frames * 1000) / (now - statClock)),
            detHz: Math.round((detections * 1000) / (now - statClock)),
            count: tracks.filter((t) => t.targetOpacity > 0).length,
          });
          frames = 0;
          detections = 0;
          statClock = now;
        }

        raf = requestAnimationFrame(loop);
      }
      raf = requestAnimationFrame(loop);

      cleanupRef.current = () => {
        cancelAnimationFrame(raf);
        detector.close();
        stream.getTracks().forEach((t) => t.stop());
        layer.replaceChildren();
      };
    } catch (err) {
      console.error(err);
      setErrorMsg(
        err instanceof DOMException && err.name === "NotAllowedError"
          ? "Camera permission was declined. Sight needs the camera — nothing is recorded or uploaded."
          : "Something failed while starting the camera or loading the model. Try a recent Chrome or Safari.",
      );
      setPhase("error");
    }
  }, []);

  useEffect(() => () => cleanupRef.current(), []);

  return (
    <div
      ref={stageRef}
      className="relative h-full w-full overflow-hidden"
      style={{ background: "#08080a" }}
    >
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <video
        ref={videoRef}
        playsInline
        muted
        className="absolute inset-0 h-full w-full object-cover"
        style={{ opacity: phase === "live" ? 1 : 0 }}
      />

      {/* Imperatively managed box layer — see the motion rule above. */}
      <div ref={boxLayerRef} className="pointer-events-none absolute inset-0" />

      {/* HUD */}
      {phase === "live" && (
        <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between p-4">
          <div className="sight-hud">
            SIGHT · LIVE
            <span className="mx-2 opacity-40">|</span>
            {stats.count} {stats.count === 1 ? "OBJECT" : "OBJECTS"}
          </div>
          <div className="sight-hud">
            {stats.fps} FPS · {stats.detHz} HZ MODEL
          </div>
        </div>
      )}

      {/* Pre-permission / loading / error states */}
      {phase !== "live" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 px-8 text-center">
          <div className="font-mono text-[0.68rem] uppercase tracking-[0.22em] text-white/40">
            Perception · 01
          </div>
          <div className="font-serif text-[clamp(2rem,5vw,3rem)] leading-none text-white/95">
            Sight
          </div>
          {phase === "error" ? (
            <p className="max-w-[44ch] font-sans text-[0.9rem] leading-[1.6] text-white/60">
              {errorMsg}
            </p>
          ) : (
            <p className="max-w-[44ch] font-sans text-[0.9rem] leading-[1.6] text-white/60">
              Live object detection, running entirely in your browser. The
              video never leaves your device — no recording, no upload, no
              server.
            </p>
          )}
          <button
            onClick={start}
            disabled={phase === "loading"}
            className="mt-2 rounded-[6px] px-6 py-3 font-mono text-[0.78rem] tracking-[0.06em] transition-opacity hover:opacity-85 disabled:opacity-50"
            style={{ background: "#FFCB05", color: "#0a0a0a" }}
          >
            {phase === "loading" ? "Loading model…" : "Enable camera"}
          </button>
        </div>
      )}

      <style>{`
        .sight-box {
          position: absolute;
          top: 0;
          left: 0;
          border: 1.5px solid rgba(255, 255, 255, 0.85);
          border-radius: 12px;
          box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.25), 0 8px 30px rgba(0, 0, 0, 0.25);
          will-change: transform, width, height, opacity;
        }
        .sight-box[data-top="true"] {
          border-color: #ffcb05;
        }
        .sight-chip {
          position: absolute;
          top: -30px;
          left: -1.5px;
          display: inline-flex;
          align-items: baseline;
          gap: 7px;
          padding: 4px 10px;
          border-radius: 8px;
          background: rgba(16, 16, 20, 0.55);
          border: 1px solid rgba(255, 255, 255, 0.22);
          backdrop-filter: blur(12px) saturate(160%);
          -webkit-backdrop-filter: blur(12px) saturate(160%);
          color: rgba(255, 255, 255, 0.92);
          font-family: ui-monospace, "SF Mono", Menlo, monospace;
          font-size: 11px;
          letter-spacing: 0.08em;
          white-space: nowrap;
        }
        .sight-box[data-top="true"] .sight-chip {
          border-color: rgba(255, 203, 5, 0.55);
        }
        .sight-score {
          font-size: 9.5px;
          opacity: 0.55;
        }
        .sight-hud {
          padding: 6px 12px;
          border-radius: 8px;
          background: rgba(16, 16, 20, 0.5);
          border: 1px solid rgba(255, 255, 255, 0.14);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          color: rgba(255, 255, 255, 0.75);
          font-family: ui-monospace, "SF Mono", Menlo, monospace;
          font-size: 10.5px;
          letter-spacing: 0.14em;
        }
      `}</style>
    </div>
  );
}
