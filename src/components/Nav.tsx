"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { hero, nav, site } from "@/data/site";

// Fixed header: transparent over the hero, hides on scroll down, returns on scroll up.
export default function Nav() {
  const ref = useRef<HTMLElement>(null);
  const [open, setOpen] = useState(false);
  const openRef = useRef(open);
  openRef.current = open;

  useGSAP(
    () => {
      const el = ref.current!;
      ScrollTrigger.create({
        start: "top -80",
        end: "max",
        onToggle: (self) => el.classList.toggle("is-scrolled", self.isActive),
        onUpdate: (self) => {
          if (openRef.current) return;
          gsap.to(el, {
            yPercent: self.direction === 1 ? -100 : 0,
            duration: 0.5,
            overwrite: true,
          });
        },
      });
    },
    { scope: ref },
  );

  useGSAP(
    () => {
      gsap.to(ref.current, { yPercent: 0, duration: 0.4, overwrite: true });
      gsap.to(".menu", { autoAlpha: open ? 1 : 0, duration: 0.4 });
      if (open) {
        gsap.fromTo(
          ".menu a",
          { y: 24, autoAlpha: 0 },
          { y: 0, autoAlpha: 1, stagger: 0.06, duration: 0.7, delay: 0.1 },
        );
      }
    },
    { scope: ref, dependencies: [open] },
  );

  useEffect(() => {
    document.documentElement.classList.toggle("menu-open", open);
    return () => document.documentElement.classList.remove("menu-open");
  }, [open]);

  return (
    <header className="nav" ref={ref}>
      <a href="#top" className="nav-logo" aria-label={`${site.name} home`}>
        {/* The preloader's mark lands in this slot, then this copy takes over. */}
        <span className="nav-mark">
          <Image src="/creovia-mark-dark.png" alt="" width={450} height={295} priority />
        </span>
        <span className="nav-word">
          <Image src="/creovia-wordmark-dark.png" alt={site.name} width={1020} height={170} priority />
        </span>
      </a>
      <nav className="nav-links" aria-label="Primary">
        {nav.map((item) => (
          <a key={item.href} href={item.href}>
            {item.label}
          </a>
        ))}
      </nav>
      <div className="nav-end">
        <a href={hero.primaryCta.href} className="btn btn-primary btn-small">
          {hero.primaryCta.label}
        </a>
        <button
          type="button"
          className="nav-toggle"
          aria-expanded={open}
          aria-controls="menu"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? "Close" : "Menu"}
        </button>
      </div>

      <div className="menu" id="menu">
        {nav.map((item) => (
          <a key={item.href} href={item.href} onClick={() => setOpen(false)}>
            {item.label}
          </a>
        ))}
        <a href={hero.primaryCta.href} onClick={() => setOpen(false)}>
          {hero.primaryCta.label}
        </a>
      </div>
    </header>
  );
}
