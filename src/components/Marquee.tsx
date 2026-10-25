"use client";

import { useRef } from "react";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";

// Kinetic marquee: loops on its own, then speeds up, skews and reverses with scroll velocity.
export default function Marquee({ items }: { items: string[] }) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia(ref);
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const track = ref.current!.querySelector<HTMLElement>(".marquee-track")!;
        const loop = gsap.to(track, { xPercent: -50, duration: 32, ease: "none", repeat: -1 });
        const clamp = gsap.utils.clamp(-6, 6);
        let kick: gsap.core.Timeline | undefined;

        ScrollTrigger.create({
          onUpdate: (self) => {
            const v = clamp(self.getVelocity() / 250);
            const dir = self.direction || 1;
            kick?.kill();
            kick = gsap
              .timeline()
              .to(loop, { timeScale: dir * (1 + Math.abs(v)), duration: 0.3, ease: "power2.out" }, 0)
              .to(track, { skewX: -v * 1.2, duration: 0.3, ease: "power2.out" }, 0)
              .to(loop, { timeScale: dir, duration: 1.4, ease: "power2.out" }, 0.3)
              .to(track, { skewX: 0, duration: 1.2, ease: "power2.out" }, 0.3);
          },
        });

        return () => kick?.kill();
      });
    },
    { scope: ref },
  );

  return (
    <div className="marquee" ref={ref}>
      <div className="marquee-track">
        {[0, 1].map((copy) => (
          <ul key={copy} aria-hidden={copy === 1}>
            {items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        ))}
      </div>
    </div>
  );
}
