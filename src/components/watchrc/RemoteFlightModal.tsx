"use client";

import { useCallback, useEffect, useRef } from "react";
import Watch from "./Watch";
import ScreenHost from "./ScreenHost";
import ScenarioDock from "./ScenarioDock";
import { useFlightState } from "@/watchrc/useFlightState";
import PairScreen from "./screens/PairScreen";
import PreflightScreen from "./screens/PreflightScreen";
import HudScreen from "./screens/HudScreen";
import QuickActionsScreen from "./screens/QuickActionsScreen";
import ThrottleScreen from "./screens/ThrottleScreen";
import LinkLostScreen from "./screens/LinkLostScreen";
import LandHoldScreen from "./screens/LandHoldScreen";
import PostFlightScreen from "./screens/PostFlightScreen";
import { FONT_STACK } from "./tokens";

function renderScreen(screen: string, api: ReturnType<typeof useFlightState>) {
  switch (screen) {
    case "pair":       return <PairScreen api={api} />;
    case "preflight":  return <PreflightScreen api={api} />;
    case "hud":        return <HudScreen api={api} />;
    case "actions":    return <QuickActionsScreen api={api} />;
    case "throttle":   return <ThrottleScreen api={api} />;
    case "linklost":   return <LinkLostScreen api={api} />;
    case "land":       return <LandHoldScreen api={api} />;
    case "postflight": return <PostFlightScreen api={api} />;
    default:           return null;
  }
}

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function RemoteFlightModal({ open, onClose }: Props) {
  const backdropRef = useRef<HTMLDivElement | null>(null);
  const api = useFlightState();

  // Esc to close + body scroll lock
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  // Crown → throttle on Throttle screen
  const onCrownDelta = useCallback(
    (delta: number) => {
      // Crown only adjusts throttle on the throttle screen
      if (api.state.screen !== "throttle") return;
      const next = Math.max(0, Math.min(100, api.state.throttlePct + delta));
      api.patch({ throttlePct: Math.round(next) });
    },
    [api],
  );

  // Side button → toggle Quick Actions (like watchOS control center pattern)
  const onSideTap = useCallback(() => {
    if (api.state.screen === "actions") {
      api.navigate("hud", "dismiss");
    } else {
      api.navigate("actions");
    }
  }, [api]);

  // Crown tap → "home" = HUD (watchOS behavior in our simplified model)
  const onCrownTap = useCallback(() => {
    if (api.state.screen !== "hud") api.navigate("hud", "backward");
  }, [api]);

  if (!open) return null;

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-[100] flex items-center justify-center"
      style={{
        background: "rgba(0,0,0,0.72)",
        backdropFilter: "blur(4px)",
        fontFamily: FONT_STACK,
      }}
      onMouseDown={(e) => {
        if (e.target === backdropRef.current) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Remote Flight"
    >
      <div
        className="relative flex flex-col overflow-hidden rounded-[12px] shadow-[0_24px_72px_rgba(0,0,0,0.5)]"
        style={{
          width: "min(96vw, 1180px)",
          height: "min(94vh, 820px)",
          background: "#0a0a0c",
        }}
      >
        {/* Title bar */}
        <div className="flex items-center gap-2 px-4 py-2.5 bg-[#161618] border-b border-[#222]">
          <button
            onClick={onClose}
            aria-label="Close"
            className="w-[12px] h-[12px] rounded-full bg-[#ff5f57] hover:brightness-110 transition-[filter]"
          />
          <div className="w-[12px] h-[12px] rounded-full bg-[#febc2e]" />
          <div className="w-[12px] h-[12px] rounded-full bg-[#28c840]" />
          <div className="flex-1 flex justify-center">
            <div className="text-[11px] text-[#8e8e93] font-mono tracking-wide">
              remote flight — smartwatch RC aircraft
            </div>
          </div>
          <div className="w-[54px]" />
        </div>

        {/* Stage: watch on dark background, scenario dock below */}
        <div
          className="flex-1 min-h-0 flex flex-col items-center justify-center gap-8"
          style={{
            padding: "24px 32px 28px",
            background:
              "radial-gradient(120% 80% at 50% 0%, #1a1a1e 0%, #0a0a0c 55%, #050506 100%)",
          }}
        >
          <Watch
            onCrownDelta={onCrownDelta}
            onCrownTap={onCrownTap}
            onSideTap={onSideTap}
            sideActive={api.state.screen === "actions"}
          >
            <ScreenHost screen={api.state.screen} transition={api.state.transition}>
              {renderScreen(api.state.screen, api)}
            </ScreenHost>
          </Watch>

          <ScenarioDock api={api} />
        </div>
      </div>
    </div>
  );
}
