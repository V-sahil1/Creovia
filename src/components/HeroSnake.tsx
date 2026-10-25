"use client";

import { useEffect, useRef } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { onIntroDone } from "@/lib/intro";

// A glossy violet snake that slithers around the headline, weaving through the words.
// Two canvases draw the same scene: the back one (under the copy) draws the whole body,
// the front one (over the copy) only the parts nearer the camera than the text (z > 0).
// The body is one closed tube; a shader shows a moving, tapered window of it.
export default function HeroSnake() {
  const backRef = useRef<HTMLCanvasElement>(null);
  const frontRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const back = backRef.current!;
    const front = frontRef.current!;
    const section = back.closest("section")!;
    const headline = section.querySelector("h1")!;
    let disposed = false;
    let cleanup = () => {};

    (async () => {
      // Loaded on demand so three.js stays out of the initial bundle.
      const THREE = await import("three");
      const { RoomEnvironment } = await import("three/addons/environments/RoomEnvironment.js");
      if (disposed) return;

      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const small = window.innerWidth < 768;
      const TUBULAR = small ? 900 : 1400;
      const RADIAL = small ? 20 : 28;
      const SAMPLES = 360; // centreline points used for the cheap hover test
      const BODY = 0.72; // share of the loop the snake's body covers

      const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
      camera.position.z = 8;

      // The visible window of the tube, shared by both renderers' shader programs.
      const uniforms = { uTail: { value: 0 }, uLen: { value: 0 } };

      const material = new THREE.MeshPhysicalMaterial({
        color: 0x5b2ee8,
        roughness: 0.08,
        metalness: 0.3,
        clearcoat: 1,
        clearcoatRoughness: 0.03,
        envMapIntensity: 1.15,
        emissive: new THREE.Color(0x6850f0),
        emissiveIntensity: 0,
      });
      material.onBeforeCompile = (shader) => {
        shader.uniforms.uTail = uniforms.uTail;
        shader.uniforms.uLen = uniforms.uLen;
        shader.vertexShader = shader.vertexShader
          .replace(
            "#include <common>",
            `#include <common>
attribute vec3 aCenter;
attribute float aAlong;
uniform float uTail;
uniform float uLen;`,
          )
          .replace(
            "#include <begin_vertex>",
            `vec3 transformed = vec3(position);
{
  // Distance from the tail along the loop; outside the body the tube collapses to nothing.
  float d = fract(aAlong - uTail);
  float t = d / max(uLen, 1e-4);
  // Body profile: a long, gradual tail, a slightly fuller head and a round tip.
  float tail = pow(smoothstep(0.0, 0.5, t), 0.75);
  float head = 1.0 + 0.14 * smoothstep(0.82, 0.93, t);
  float tip = sqrt(max(0.0, 1.0 - pow(max(t - 0.955, 0.0) / 0.045, 2.0)));
  float f = d < uLen ? tail * head * tip : 0.0;
  transformed = aCenter + (position - aCenter) * f;
}`,
          );
      };

      const makeLayer = (canvas: HTMLCanvasElement, frontOnly: boolean) => {
        const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
        // 1.5x is visually indistinguishable here and far cheaper than 2-3x on dense screens.
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.05;
        // The text sits on the z = 0 plane; the front layer keeps only what is in front of it.
        if (frontOnly) renderer.clippingPlanes = [new THREE.Plane(new THREE.Vector3(0, 0, 1), 0)];

        const scene = new THREE.Scene();
        const pmrem = new THREE.PMREMGenerator(renderer);
        const env = pmrem.fromScene(new RoomEnvironment(), 0.04);
        pmrem.dispose();
        scene.environment = env.texture;

        const key = new THREE.PointLight(0xffffff, 30, 0, 2);
        key.position.set(3, 3, 5);
        const rim = new THREE.DirectionalLight(0x8f7bff, 2);
        rim.position.set(-4, -2, -3);
        scene.add(key, rim, new THREE.AmbientLight(0x6850f0, 0.4));

        // The pivot sits on the headline's centre, so tilting turns the loop around the words.
        const pivot = new THREE.Group();
        const mesh = new THREE.Mesh(new THREE.BufferGeometry(), material);
        pivot.add(mesh);
        scene.add(pivot);
        return { renderer, scene, env, key, pivot, mesh };
      };
      const layers = [makeLayer(back, false), makeLayer(front, true)];
      const render = () => layers.forEach((l) => l.renderer.render(l.scene, camera));

      // ---------- Path: a smooth loop around the headline, dipping in front and behind ----------
      let geometry: InstanceType<typeof THREE.TubeGeometry> | undefined;
      const samples = new Float32Array((SAMPLES + 1) * 3);
      let radiusPx = 0;
      const layout = () => {
        const w = back.clientWidth;
        const h = back.clientHeight;
        if (!w || !h) return;
        layers.forEach((l) => l.renderer.setSize(w, h, false));
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        const viewH = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.position.z;
        const viewW = viewH * camera.aspect;
        const pxToWorld = viewH / h;

        // Measure the words, not the h1 box, relative to the canvas (both share the scroll offset).
        const c = back.getBoundingClientRect();
        const box = headline.getBoundingClientRect();
        let right = box.left;
        headline.querySelectorAll(".hero-line > span").forEach((el) => {
          right = Math.max(right, el.getBoundingClientRect().right);
        });
        const font = parseFloat(getComputedStyle(headline).fontSize);
        const left = box.left - c.left;
        const rightEdge = right - c.left;
        const top = box.top - c.top;
        const bottom = box.bottom - c.top;
        const centerX = (left + rightEdge) / 2;
        const centerY = (top + bottom) / 2;
        const depth = font * 0.35;
        const minX = font * 0.4;
        const maxX = w - font * 0.5;
        radiusPx = font * 0.15;

        // Canvas px (+ depth in units of `depth`) to the pivot's local space.
        const toLocal = (x: number, y: number, z: number) =>
          new THREE.Vector3((x - centerX) * pxToWorld, (centerY - y) * pxToWorld, z * depth * pxToWorld);

        const lines = Array.from(headline.querySelectorAll<HTMLElement>(".hero-line"));
        const lineMid = (i: number) => {
          const r = lines[i].getBoundingClientRect();
          return (r.top + r.bottom) / 2 - c.top;
        };
        // Visual centre of a letter in a headline line, in canvas px. Measured against the
        // line's mask, which never moves, so the intro's slide-up does not skew it.
        const letter = (lineIndex: number, ch: string, last = false) => {
          const line = lines[lineIndex];
          const inner = line?.firstElementChild as HTMLElement | null;
          if (!inner) return null;
          const walker = document.createTreeWalker(inner, NodeFilter.SHOW_TEXT);
          let found: [Text, number] | null = null;
          for (let n = walker.nextNode(); n; n = walker.nextNode()) {
            if (n.parentElement?.closest(".roll")) continue; // skip the rolling word
            const text = n.textContent ?? "";
            const i = last ? text.lastIndexOf(ch) : text.indexOf(ch);
            if (i < 0) continue;
            found = [n as Text, i];
            if (!last) break;
          }
          if (!found) return null;
          const range = document.createRange();
          range.setStart(found[0], found[1]);
          range.setEnd(found[0], found[1] + 1);
          const r = range.getBoundingClientRect();
          const slide = inner.getBoundingClientRect().top - line.getBoundingClientRect().top;
          // 0.58 of the glyph box lands on the middle of the lowercase letters.
          return { x: r.left + r.width / 2 - c.left, y: r.top - slide + r.height * 0.58 - c.top };
        };

        // Threaded through three letters: the last "e" of the first line, the "u" of the last
        // line and the "b" of the second. At each one it crosses the text plane (z = 0), so it
        // passes through the letter; in between it alternates in front of and behind the words.
        const e = lines.length >= 3 ? letter(0, "e", true) : null;
        const u = lines.length >= 3 ? letter(2, "u") : null;
        const b = lines.length >= 3 ? letter(1, "b") : null;
        let points: InstanceType<typeof THREE.Vector3>[];
        if (e && u && b) {
          const span = rightEdge - left;
          points = [
            toLocal(e.x, e.y, 0),
            toLocal(Math.min(rightEdge + font * 0.45, maxX), lineMid(1), 1), // out past the right edge
            toLocal(left + span * 0.62, bottom - font * 0.12, 1), // under the last line
            toLocal(u.x, u.y, 0),
            toLocal((u.x + b.x) / 2 - font * 0.2, (u.y + b.y) / 2, -1), // behind, between "you" and "built"
            toLocal(b.x, b.y, 0),
            toLocal(Math.max(left - font * 0.35, minX), lineMid(0) + font * 0.1, 1), // out past the left edge
            toLocal(left + span * 0.3, top + font * 0.14, 1), // over "Premium"
            toLocal(left + span * 0.64, top + font * 0.22, -1), // behind "websites"
          ];
        } else {
          // Headline copy without those letters: a plain loop around the words.
          const hw = ((Math.min(rightEdge + font * 0.5, maxX) - Math.max(left - font * 0.25, minX)) / 2) * 0.92;
          const hh = ((bottom - top) / 2) * 0.88;
          points = Array.from({ length: 64 }, (_, i) => {
            const a = (i / 64) * Math.PI * 2;
            return toLocal(centerX + hw * Math.cos(a), centerY - hh * Math.sin(a), Math.sin(3 * a + 0.4));
          });
        }
        // Same route, smoothed: sample it densely, then relax each point toward its neighbours
        // (Taubin smoothing, which rounds tight bends without shrinking the loop). This opens
        // up the turns that were tighter than the tube is thick, where it creased.
        const route = new THREE.CatmullRomCurve3(points, true, "centripetal").getSpacedPoints(240).slice(0, -1);
        const n = route.length;
        for (let pass = 0; pass < 24; pass++) {
          const factor = pass % 2 === 0 ? 0.5 : -0.53;
          const moved = route.map((pt, i) => {
            const mid = route[(i + n - 1) % n].clone().add(route[(i + 1) % n]).multiplyScalar(0.5);
            return pt.clone().lerp(mid, factor);
          });
          moved.forEach((pt, i) => route[i].copy(pt));
        }
        const curve = new THREE.CatmullRomCurve3(route, true, "centripetal");
        const next = new THREE.TubeGeometry(curve, TUBULAR, radiusPx * pxToWorld, RADIAL, true);

        // Per vertex: its ring's centre and how far along the loop it is (TubeGeometry builds ring by ring).
        const count = next.attributes.position.count;
        const centers = new Float32Array(count * 3);
        const along = new Float32Array(count);
        const p = new THREE.Vector3();
        for (let i = 0; i <= TUBULAR; i++) {
          curve.getPointAt(i / TUBULAR, p);
          for (let j = 0; j <= RADIAL; j++) {
            const v = i * (RADIAL + 1) + j;
            centers[v * 3] = p.x;
            centers[v * 3 + 1] = p.y;
            centers[v * 3 + 2] = p.z;
            along[v] = i / TUBULAR;
          }
        }
        next.setAttribute("aCenter", new THREE.BufferAttribute(centers, 3));
        next.setAttribute("aAlong", new THREE.BufferAttribute(along, 1));
        for (let i = 0; i <= SAMPLES; i++) {
          curve.getPointAt(i / SAMPLES, p);
          samples.set([p.x, p.y, p.z], i * 3);
        }

        geometry?.dispose();
        geometry = next;
        layers.forEach((l) => {
          l.mesh.geometry = next;
          l.pivot.position.set(centerX * pxToWorld - viewW / 2, viewH / 2 - centerY * pxToWorld, 0);
        });
      };
      layout();

      let resizeTimer = 0;
      const relayout = () => {
        layout();
        if (reduced) render();
      };
      const resizeObserver = new ResizeObserver(() => {
        window.clearTimeout(resizeTimer);
        resizeTimer = window.setTimeout(relayout, 150);
      });
      resizeObserver.observe(section);
      // Web fonts change the headline's size, so measure again once they are in.
      document.fonts.ready.then(() => !disposed && relayout());

      const disposeAll = () => {
        window.clearTimeout(resizeTimer);
        resizeObserver.disconnect();
        geometry?.dispose();
        material.dispose();
        layers.forEach((l) => {
          l.env.dispose();
          l.renderer.dispose();
        });
      };

      if (reduced) {
        uniforms.uTail.value = 0.1;
        uniforms.uLen.value = BODY;
        render();
        cleanup = disposeAll;
        return;
      }

      // ---------- Motion and interaction ----------
      const state = { len: 0 };
      const tilt = { x: 0, y: 0 };
      const tiltTarget = { x: 0, y: 0 };
      let tail = 0;
      let speed = 0.09;
      let kick = 0;
      let scrollKick = 0;
      let hover = 0;
      let hovering = false;
      let pendingHit: { x: number; y: number } | null = null;
      let visible = true;

      // Hover test: project the visible part of the centreline to the screen and check the
      // distance to the pointer. A few hundred points instead of raycasting ~80k triangles.
      const v = new THREE.Vector3();
      const hitsBody = (x: number, y: number) => {
        const r = back.getBoundingClientRect();
        const reach = radiusPx * 1.5;
        const matrix = layers[0].mesh.matrixWorld;
        for (let i = 0; i <= SAMPLES; i++) {
          const d = (((i / SAMPLES - tail) % 1) + 1) % 1;
          if (d < state.len * 0.08 || d > state.len) continue;
          v.fromArray(samples, i * 3).applyMatrix4(matrix).project(camera);
          const dx = ((v.x + 1) / 2) * r.width + r.left - x;
          const dy = ((1 - v.y) / 2) * r.height + r.top - y;
          if (dx * dx + dy * dy < reach * reach) return true;
        }
        return false;
      };
      const isControl = (target: EventTarget | null) => target instanceof Element && !!target.closest("a, button");

      const onMove = (e: PointerEvent) => {
        tiltTarget.x = e.clientX / window.innerWidth - 0.5;
        tiltTarget.y = e.clientY / window.innerHeight - 0.5;
        if (e.pointerType !== "mouse") return;
        // Tested once per frame, in the ticker.
        pendingHit = isControl(e.target) ? null : { x: e.clientX, y: e.clientY };
        if (!pendingHit && hovering) {
          hovering = false;
          section.style.cursor = "";
        }
      };
      // Clicking (or tapping) the snake makes it dart forward.
      const onDown = (e: PointerEvent) => {
        if (!isControl(e.target) && hitsBody(e.clientX, e.clientY)) kick = 0.3;
      };
      section.addEventListener("pointerdown", onDown);
      window.addEventListener("pointermove", onMove, { passive: true });

      const trigger = ScrollTrigger.create({
        trigger: section,
        start: "top top",
        end: "bottom top",
        onUpdate: (self) => {
          scrollKick = Math.max(scrollKick, Math.min(Math.abs(self.getVelocity()) / 6000, 0.25));
        },
      });

      const io = new IntersectionObserver(([entry]) => (visible = entry.isIntersecting));
      io.observe(section);

      const tick = (_time: number, deltaMs: number) => {
        // Nothing to draw before the intro starts (the preloader covers the page).
        if (!visible || state.len === 0) return;
        const dt = Math.min(deltaMs / 1000, 1 / 30);
        // Frame-rate independent smoothing factors (fraction of the gap closed this frame).
        const soft = 1 - Math.exp(-dt * 4);
        const quick = 1 - Math.exp(-dt * 8);

        if (pendingHit) {
          const now = hitsBody(pendingHit.x, pendingHit.y);
          pendingHit = null;
          if (now !== hovering) {
            hovering = now;
            section.style.cursor = hovering ? "pointer" : "";
          }
        }

        tilt.x += (tiltTarget.x - tilt.x) * soft;
        tilt.y += (tiltTarget.y - tilt.y) * soft;
        hover += ((hovering ? 1 : 0) - hover) * quick;
        kick *= Math.exp(-dt * 2.5);
        scrollKick *= Math.exp(-dt * 2.5);

        // Speed eases toward its target, so hovering, clicking and scrolling never jerk it.
        speed += (0.09 + hover * 0.06 + kick + scrollKick - speed) * soft;
        tail = (tail + speed * dt) % 1;
        uniforms.uTail.value = tail;
        uniforms.uLen.value = state.len;
        material.emissiveIntensity = hover * 0.22;

        layers.forEach((l) => {
          l.pivot.rotation.set(tilt.y * 0.12, tilt.x * 0.2, 0);
          l.key.position.set(3 + tilt.x * 8, 3 - tilt.y * 8, 5);
        });
        render();
      };
      gsap.ticker.add(tick);

      // The snake grows out from its tail once the preloader has handed over.
      let introTween: gsap.core.Tween | undefined;
      const offIntro = onIntroDone(() => {
        introTween = gsap.to(state, { len: BODY, duration: 2.2, ease: "power2.inOut", delay: 0.3 });
      });

      cleanup = () => {
        offIntro();
        introTween?.kill();
        gsap.ticker.remove(tick);
        trigger.kill();
        io.disconnect();
        section.removeEventListener("pointerdown", onDown);
        window.removeEventListener("pointermove", onMove);
        section.style.cursor = "";
        disposeAll();
      };
    })();

    return () => {
      disposed = true;
      cleanup();
    };
  }, []);

  return (
    <>
      <canvas ref={backRef} className="hero-snake hero-snake-back" aria-hidden="true" />
      <canvas ref={frontRef} className="hero-snake hero-snake-front" aria-hidden="true" />
    </>
  );
}
