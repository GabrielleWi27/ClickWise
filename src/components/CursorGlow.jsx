// A soft, blurry red glow that follows your mouse around the page, giving
// a subtle spotlight effect.
import { useEffect, useRef } from 'react';

const SIZE = 500; // the glow's width/height in pixels

export default function CursorGlow() {
  // A "ref" lets us grab the actual on-screen element and change its style
  // directly (fast) instead of re-rendering the whole component every time
  // the mouse moves (slow).
  const glowRef = useRef(null);

  useEffect(() => {
    const glow = glowRef.current;
    if (!glow) return;

    // Every time the mouse moves, shift the glow so its center sits right
    // under the cursor (hence subtracting half the SIZE).
    const handleMove = (e) => {
      glow.style.transform = `translate3d(${e.clientX - SIZE / 2}px, ${e.clientY - SIZE / 2}px, 0)`;
    };

    window.addEventListener('mousemove', handleMove);
    // Clean up the listener if this component ever gets removed from the page.
    return () => window.removeEventListener('mousemove', handleMove);
  }, []);

  return (
    <div
      ref={glowRef}
      className="fixed top-0 left-0 z-[1] pointer-events-none opacity-60 will-change-transform print:hidden"
      style={{
        width: SIZE,
        height: SIZE,
        background: 'radial-gradient(circle, rgba(239,35,60,0.18), transparent 70%)',
        filter: 'blur(40px)',
        // Starts off-screen so it doesn't flash in the top-left corner
        // before the mouse has moved even once.
        transform: 'translate3d(-9999px, -9999px, 0)',
      }}
    />
  );
}
