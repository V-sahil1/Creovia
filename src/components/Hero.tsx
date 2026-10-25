"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { onIntroDone } from "@/lib/intro";
import { hero } from "@/data/site";
import HeroSnake from "./HeroSnake";

function Arrow() {
  return (
    <svg className="arrow" viewBox="0 0 16 16" aria-hidden="true">
      <path d="M3 13 13 3M5 3h8v8" fill="none" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

// Hero: the brand mark sits behind with mouse + scroll parallax, a 3D snake
// weaves through the headline (see HeroSnake), the headline lines rise out of
// masks, and one word keeps rolling.
export default function Hero() {
  const ref = useRef<HTMLElement>(null);
  const { headline } = hero;
  // The first word is repeated at the end so the loop can jump back invisibly.
  const words = [...headline.words, headline.words[0]];

  useGSAP(
    () => {
      const mm = gsap.matchMedia(ref);

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const section = ref.current!;

        // Intro: built paused, played once the preloader has landed the mark in the nav.
        const intro = gsap
          .timeline({ paused: true, defaults: { ease: "power4.out", duration: 1.2 } })
          .fromTo(".hero-mark", { autoAlpha: 0, scale: 1.1 }, { autoAlpha: 1, scale: 1, duration: 2 }, 0)
          // y: 0 clears the pixel offset GSAP reads from the CSS pre-hide transform.
          .fromTo(".hero-line > span", { yPercent: 110, y: 0 }, { yPercent: 0, stagger: 0.1 }, 0.2)
          .fromTo(".hero-fade", { y: 24, autoAlpha: 0 }, { y: 0, autoAlpha: 1, stagger: 0.1, duration: 1 }, 0.7);
        const offIntro = onIntroDone(() => intro.play());

        // Scroll parallax: the mark drifts down and fades, the copy lifts away.
        // The snake moves with the copy so it stays wrapped around the words.
        gsap.to(".hero-bg", {
          yPercent: 30,
          opacity: 0,
          ease: "none",
          scrollTrigger: { trigger: section, start: "top top", end: "bottom top", scrub: true },
        });
        gsap.to(".hero-copy", {
          y: -80,
          ease: "none",
          scrollTrigger: { trigger: section, start: "top top", end: "bottom top", scrub: true },
        });
        gsap.to(".hero-snake", {
          y: -80,
          opacity: 0,
          ease: "none",
          scrollTrigger: { trigger: section, start: "top top", end: "bottom top", scrub: true },
        });

        // Mouse parallax on the mark.
        const xTo = gsap.quickTo(".hero-mark", "x", { duration: 1.4, ease: "power3" });
        const yTo = gsap.quickTo(".hero-mark", "y", { duration: 1.4, ease: "power3" });
        const onMove = (e: PointerEvent) => {
          if (e.pointerType !== "mouse") return;
          xTo((e.clientX / window.innerWidth - 0.5) * 48);
          yTo((e.clientY / window.innerHeight - 0.5) * 48);
        };
        window.addEventListener("pointermove", onMove, { passive: true });

        // Rolling word. Width is measured so the line reflows with each word.
        const roll = section.querySelector<HTMLElement>(".roll")!;
        const track = section.querySelector<HTMLElement>(".roll-track")!;
        const items = Array.from(track.children) as HTMLElement[];
        const step = 100 / items.length;
        let rollTl: gsap.core.Timeline | undefined;
        let introDone = false;
        const offRoll = onIntroDone(() => {
          introDone = true;
          rollTl?.play();
        });

        const build = () => {
          rollTl?.kill();
          gsap.set(track, { yPercent: 0 });
          const widths = items.map((item) => item.offsetWidth);
          gsap.set(roll, { width: widths[0] });
          // Waits for the preloader; the first word then holds for one step before rolling.
          rollTl = gsap.timeline({ repeat: -1, paused: !introDone });
          items.forEach((_, i) => {
            if (i === 0) return;
            rollTl!
              .to(track, { yPercent: -step * i, duration: 0.9, ease: "power3.inOut" }, "+=1.8")
              .to(roll, { width: widths[i], duration: 0.9, ease: "power3.inOut" }, "<");
          });
          rollTl.set(track, { yPercent: 0 }, "+=1.8").set(roll, { width: widths[0] }, "<");
        };
        build();

        let timer = 0;
        const onResize = () => {
          window.clearTimeout(timer);
          timer = window.setTimeout(build, 200);
        };
        window.addEventListener("resize", onResize);

        return () => {
          offIntro();
          offRoll();
          window.removeEventListener("pointermove", onMove);
          window.removeEventListener("resize", onResize);
          window.clearTimeout(timer);
          rollTl?.kill();
        };
      });
    },
    { scope: ref },
  );

  return (
    <section className="hero" ref={ref}>
      <div className="hero-bg" aria-hidden="true">
        <div className="hero-mark" />
      </div>
      <HeroSnake />

      <div className="hero-copy">
        <p className="eyebrow hero-fade">{hero.eyebrow}</p>
        <h1>
          <span className="hero-line">
            <span>{headline.before}</span>
          </span>
          <span className="hero-line">
            <span>
              {headline.lead}{" "}
              <span className="roll" aria-live="off">
                <span className="roll-track">
                  {words.map((word, i) => (
                    <span key={`${word}-${i}`} aria-hidden={i > 0}>
                      {word}
                    </span>
                  ))}
                </span>
              </span>
            </span>
          </span>
          <span className="hero-line">
            <span>{headline.after}</span>
          </span>
        </h1>
        <p className="hero-intro hero-fade">{hero.intro}</p>
        <div className="hero-actions hero-fade">
          <a href={hero.primaryCta.href} className="btn btn-primary">
            {hero.primaryCta.label}
            <Arrow />
          </a>
          <a href={hero.secondaryCta.href} className="btn btn-ghost">
            {hero.secondaryCta.label}
          </a>
        </div>
      </div>

      <div className="hero-foot hero-fade" aria-hidden="true">
        <span className="hero-scroll">Scroll</span>
      </div>
    </section>
  );
}
