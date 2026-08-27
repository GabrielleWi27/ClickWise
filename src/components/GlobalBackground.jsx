// The decorative background behind every page: a dark red-to-black
// gradient, two layers of tiny "stars" that slowly drift upward, a soft
// red glow in the center, and a faint grid pattern. It's purely visual —
// `pointer-events-none` means you can click straight through it — and it
// sits behind all real page content (`z-0`).
export default function GlobalBackground() {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none print:hidden">
      {/* the dark gradient base color */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#1a0505] to-black" />
      {/* two layers of tiny drifting "stars" (the actual dots come from index.css) */}
      <div className="absolute top-0 left-0 w-[1px] h-[1px] bg-transparent stars-1 animate-[animStar_50s_linear_infinite]" />
      <div className="absolute top-0 left-0 w-[2px] h-[2px] bg-transparent stars-2 animate-[animStar_80s_linear_infinite]" />
      {/* soft red glow, centered on the screen */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-red-600/5 rounded-full blur-[120px]" />
      {/* faint grid lines, faded out toward the edges of the screen */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(circle_at_center,black_40%,transparent_80%)]" />
    </div>
  );
}
