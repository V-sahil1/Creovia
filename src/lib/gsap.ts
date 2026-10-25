import gsap from "gsap";
import { Flip } from "gsap/Flip";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";

// Registered once; every client component imports gsap from here.
gsap.registerPlugin(useGSAP, Flip, ScrollTrigger, SplitText);
gsap.defaults({ ease: "power3.out", duration: 1 });

export { gsap, Flip, ScrollTrigger, SplitText, useGSAP };
