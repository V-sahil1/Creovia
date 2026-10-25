"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { onIntroDone } from "@/lib/intro";

// Lenis smooths native scrolling; GSAP's ticker drives it so ScrollTrigger stays in sync.
// It starts only after the preloader, so nothing scrolls under the loading screen.
export default function SmoothScroll() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let lenis: Lenis | undefined;
    const raf = (time: number) => lenis?.raf(time * 1000);

    const off = onIntroDone(() => {
      lenis = new Lenis({ autoRaf: false, anchors: true, lerp: 0.1 });
      lenis.on("scroll", ScrollTrigger.update);
      gsap.ticker.add(raf);
      gsap.ticker.lagSmoothing(0);
    });

    return () => {
      off();
      gsap.ticker.remove(raf);
      lenis?.destroy();
    };
  }, []);

  return null;
}
