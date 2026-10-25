"use client";

import Image from "next/image";
import { useRef } from "react";
import { Flip, gsap, useGSAP } from "@/lib/gsap";
import { markIntroDone } from "@/lib/intro";

// Loading screen: the mark draws in over a counter, then flies into its slot in the nav
// (just before the wordmark). The hero intro starts once it lands.
export default function Preloader() {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const root = document.documentElement;
      const navMark = document.querySelector<HTMLElement>(".nav-mark");
      const navWord = document.querySelector<HTMLElement>(".nav-word");
      const navRest = document.querySelectorAll<HTMLElement>(".nav-links, .nav-end");
      const mark = ref.current!.querySelector<HTMLElement>(".preloader-mark img")!;
      const count = ref.current!.querySelector<HTMLElement>(".preloader-count")!;

      // The mark has landed: the nav's own copy takes over and the page may start.
      const handOver = () => {
        if (navMark) gsap.set(navMark, { visibility: "visible" });
        gsap.set(".preloader-mark", { display: "none" });
        root.classList.remove("is-loading");
        markIntroDone();
      };

      const mm = gsap.matchMedia(ref);

      mm.add("(prefers-reduced-motion: reduce)", () => {
        gsap.set(".preloader", { display: "none" });
        handOver();
      });

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        root.classList.add("is-loading");
        const counter = { n: 0 };

        const tl = gsap.timeline({ defaults: { ease: "power4.inOut" } });

        // 1. Draw the mark in while the counter runs.
        tl.fromTo(mark, { clipPath: "inset(0 100% 0 0)" }, { clipPath: "inset(0 0% 0 0)", duration: 1.1 }, 0)
          .fromTo(".preloader-line", { scaleX: 0 }, { scaleX: 1, duration: 1.2, ease: "power3.inOut" }, 0)
          .to(
            counter,
            {
              n: 100,
              duration: 1.2,
              ease: "power3.inOut",
              onUpdate: () => {
                count.textContent = String(Math.round(counter.n)).padStart(3, "0");
              },
            },
            0,
          )
          .to(".preloader-line, .preloader-count", { autoAlpha: 0, duration: 0.4 }, 1.3);

        // 2. Fly the mark into the nav and lift the white sheet away.
        if (navMark) {
          tl.add(Flip.fit(mark, navMark, { scale: true, duration: 1, ease: "power3.inOut" }) as gsap.core.Tween, 1.45);
        }
        tl.to(".preloader", { yPercent: -100, duration: 1, ease: "power4.inOut" }, 1.6);

        // 3. Hand over to the real nav mark, slide the wordmark and links in, start the hero.
        tl.add(handOver, 2.45)
          .fromTo(navWord, { xPercent: -24, autoAlpha: 0 }, { xPercent: 0, autoAlpha: 1, duration: 0.8, ease: "power4.out" }, 2.45)
          .fromTo(navRest, { y: -12, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.7, ease: "power3.out", stagger: 0.08 }, 2.6)
          .set(".preloader", { display: "none" }, 2.65);
      });
    },
    { scope: ref },
  );

  return (
    <div ref={ref} aria-hidden="true">
      <div className="preloader">
        <span className="preloader-count">000</span>
        <span className="preloader-line" />
      </div>
      <div className="preloader-mark">
        <Image src="/creovia-mark-dark.png" alt="" width={450} height={295} priority />
      </div>
    </div>
  );
}
