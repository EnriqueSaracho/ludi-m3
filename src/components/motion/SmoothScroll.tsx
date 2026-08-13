"use client";

import { useEffect } from "react";
import Lenis from "lenis";

/** Momentum scrolling for the long, band-based pages. Renders nothing; it only
 *  attaches Lenis to the document and drives it from rAF. */
export function SmoothScroll() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const lenis = new Lenis({
      duration: 1.05,
      // Anchor jumps and in-page nav should still feel instant-ish.
      easing: (t) => 1 - Math.pow(1 - t, 3),
      wheelMultiplier: 1,
    });

    let frame = 0;
    function raf(time: number) {
      lenis.raf(time);
      frame = requestAnimationFrame(raf);
    }
    frame = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(frame);
      lenis.destroy();
    };
  }, []);

  return null;
}
