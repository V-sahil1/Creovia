"use client";

import { gsap, SplitText, useGSAP } from "@/lib/gsap";

// One place for every scroll-driven effect on the page, wired up with data attributes:
//   data-split            heading lines rise out of a mask
//   data-reveal           element fades up once in view
//   data-reveal-group     children fade up with a stagger
//   data-line             rule draws from left to right
//   data-parallax="0.15"  element drifts vertically with scroll (bigger = faster)
//   data-count="40+"      number counts up from zero to the attribute value ("40+", "3.2x")
//   data-wordmark         image un-clips from the bottom as it scrolls in
export default function ScrollFx() {
  useGSAP(() => {
    const mm = gsap.matchMedia();
    const all = gsap.utils.toArray<HTMLElement>;

    mm.add("(prefers-reduced-motion: no-preference)", () => {
      all("[data-split]").forEach((el) => {
        SplitText.create(el, {
          type: "lines",
          mask: "lines",
          autoSplit: true,
          onSplit: (self) =>
            gsap.from(self.lines, {
              yPercent: 110,
              duration: 1.1,
              ease: "power4.out",
              stagger: 0.09,
              scrollTrigger: { trigger: el, start: "top 88%", once: true },
            }),
        });
      });

      all("[data-reveal]").forEach((el) => {
        gsap.from(el, {
          y: 40,
          autoAlpha: 0,
          duration: 1.1,
          scrollTrigger: { trigger: el, start: "top 90%", once: true },
        });
      });

      all("[data-reveal-group]").forEach((group) => {
        gsap.from(group.children, {
          y: 40,
          autoAlpha: 0,
          duration: 1,
          stagger: 0.1,
          scrollTrigger: { trigger: group, start: "top 85%", once: true },
        });
      });

      all("[data-line]").forEach((el) => {
        gsap.from(el, {
          scaleX: 0,
          transformOrigin: "left center",
          duration: 1.4,
          ease: "power4.out",
          scrollTrigger: { trigger: el, start: "top 92%", once: true },
        });
      });

      all("[data-parallax]").forEach((el) => {
        const speed = parseFloat(el.dataset.parallax || "0.15") * 100;
        gsap.fromTo(
          el,
          { yPercent: -speed },
          {
            yPercent: speed,
            ease: "none",
            scrollTrigger: {
              trigger: el.parentElement,
              start: "top bottom",
              end: "bottom top",
              scrub: true,
            },
          },
        );
      });

      all("[data-count]").forEach((el) => {
        // Read the target from the attribute, not the text: an earlier render may have
        // already written "0+" into the element (React runs effects twice in dev).
        const match = el.dataset.count?.trim().match(/^(\d+(?:\.(\d+))?)(.*)$/);
        if (!match) return;
        const target = parseFloat(match[1]);
        const decimals = match[2]?.length ?? 0;
        const suffix = match[3];
        const counter = { n: 0 };
        gsap.to(counter, {
          n: target,
          duration: 1.8,
          ease: "power4.out",
          onUpdate: () => {
            el.textContent = counter.n.toFixed(decimals) + suffix;
          },
          scrollTrigger: { trigger: el, start: "top 85%", once: true },
        });
      });

      all("[data-wordmark]").forEach((el) => {
        gsap.fromTo(
          el,
          { clipPath: "inset(100% 0 0 0)", yPercent: 20 },
          {
            clipPath: "inset(0% 0 0 0)",
            yPercent: 0,
            ease: "none",
            scrollTrigger: { trigger: el, start: "top 95%", end: "top 35%", scrub: true },
          },
        );
      });
    });
  });

  return null;
}
