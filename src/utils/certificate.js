// Draws a "Certificate of Completion" as an image (Canvas -> PNG) and
// triggers a download — no PDF library needed, no server involved. Kept
// in its own file since it's a decent chunk of drawing code that has
// nothing to do with how the rest of the app works.

const WIDTH = 1600;
const HEIGHT = 1131; // roughly A4 landscape proportions

// Makes sure the brand fonts are actually loaded before we measure/draw
// text with them — otherwise the canvas can silently fall back to a
// generic font and the layout looks off.
async function ensureFontsReady() {
  try {
    await Promise.all([
      document.fonts.load('700 90px Manrope'),
      document.fonts.load('700 40px Manrope'),
      document.fonts.load('400 28px Inter'),
      document.fonts.load('700 28px Inter'),
    ]);
  } catch {
    // If font loading fails for some reason, we still draw with whatever
    // the browser falls back to rather than blocking the download.
  }
}

function drawBackground(ctx) {
  const gradient = ctx.createLinearGradient(0, 0, WIDTH, HEIGHT);
  gradient.addColorStop(0, '#0a0a0a');
  gradient.addColorStop(1, '#160404');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Faint grid, echoing the site's background texture.
  ctx.strokeStyle = 'rgba(239,35,60,0.05)';
  ctx.lineWidth = 1;
  for (let x = 0; x < WIDTH; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, HEIGHT);
    ctx.stroke();
  }
  for (let y = 0; y < HEIGHT; y += 40) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(WIDTH, y);
    ctx.stroke();
  }

  // Outer border with rounded corner accents.
  ctx.strokeStyle = 'rgba(239,35,60,0.5)';
  ctx.lineWidth = 3;
  ctx.strokeRect(48, 48, WIDTH - 96, HEIGHT - 96);
  ctx.strokeStyle = '#ef233c';
  ctx.lineWidth = 6;
  const corner = 60;
  [
    [48, 48, 1, 1],
    [WIDTH - 48, 48, -1, 1],
    [48, HEIGHT - 48, 1, -1],
    [WIDTH - 48, HEIGHT - 48, -1, -1],
  ].forEach(([x, y, dx, dy]) => {
    ctx.beginPath();
    ctx.moveTo(x, y + corner * dy);
    ctx.lineTo(x, y);
    ctx.lineTo(x + corner * dx, y);
    ctx.stroke();
  });
}

// Draws the little red shield-with-checkmark logo, centered at (cx, cy).
function drawShield(ctx, cx, cy, size) {
  ctx.fillStyle = '#ef233c';
  ctx.beginPath();
  ctx.moveTo(cx, cy - size);
  ctx.bezierCurveTo(cx + size, cy - size * 0.7, cx + size, cy - size * 0.2, cx + size, cy + size * 0.1);
  ctx.bezierCurveTo(cx + size, cy + size * 0.8, cx, cy + size * 1.3, cx, cy + size * 1.3);
  ctx.bezierCurveTo(cx, cy + size * 1.3, cx - size, cy + size * 0.8, cx - size, cy + size * 0.1);
  ctx.bezierCurveTo(cx - size, cy - size * 0.2, cx - size, cy - size * 0.7, cx, cy - size);
  ctx.closePath();
  ctx.fill();

  // simple checkmark
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = size * 0.18;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(cx - size * 0.45, cy + size * 0.05);
  ctx.lineTo(cx - size * 0.1, cy + size * 0.4);
  ctx.lineTo(cx + size * 0.5, cy - size * 0.35);
  ctx.stroke();
}

function centerText(ctx, text, x, y, options = {}) {
  const { font, color = '#ffffff', letterSpacing = 0 } = options;
  ctx.font = font;
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  if (letterSpacing) {
    // Canvas has no native letter-spacing — approximate it by drawing
    // each character individually with extra gaps.
    const chars = text.split('');
    const widths = chars.map((c) => ctx.measureText(c).width + letterSpacing);
    const totalWidth = widths.reduce((a, b) => a + b, 0) - letterSpacing;
    let cursor = x - totalWidth / 2;
    for (let i = 0; i < chars.length; i++) {
      ctx.textAlign = 'left';
      ctx.fillText(chars[i], cursor, y);
      cursor += widths[i];
    }
  } else {
    ctx.fillText(text, x, y);
  }
}

// Builds the certificate and returns it as a PNG data URL.
export async function buildCertificateDataUrl({ name, orgName, passRate, simCount, lessonCount, issuedOn }) {
  await ensureFontsReady();

  const canvas = document.createElement('canvas');
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext('2d');

  drawBackground(ctx);
  drawShield(ctx, WIDTH / 2, 190, 34);

  centerText(ctx, 'CLICKWISE', WIDTH / 2, 260, {
    font: '700 34px Manrope, sans-serif',
    color: '#ffffff',
    letterSpacing: 8,
  });
  centerText(ctx, 'CERTIFICATE OF COMPLETION', WIDTH / 2, 330, {
    font: '700 24px Inter, sans-serif',
    color: '#ef233c',
    letterSpacing: 6,
  });

  centerText(ctx, 'This certifies that', WIDTH / 2, 430, {
    font: '400 26px Inter, sans-serif',
    color: '#a1a1aa',
  });
  centerText(ctx, name, WIDTH / 2, 520, {
    font: '700 78px Manrope, sans-serif',
    color: '#ffffff',
  });

  centerText(ctx, 'has successfully completed the', WIDTH / 2, 610, {
    font: '400 26px Inter, sans-serif',
    color: '#a1a1aa',
  });
  centerText(ctx, 'ClickWise Security Awareness Program', WIDTH / 2, 660, {
    font: '700 36px Manrope, sans-serif',
    color: '#ef233c',
  });
  if (orgName) {
    centerText(ctx, `on behalf of ${orgName}`, WIDTH / 2, 710, {
      font: '400 24px Inter, sans-serif',
      color: '#a1a1aa',
    });
  }

  // The row of 3 numbers near the bottom (lessons/pass-rate/simulations).
  const stats = [
    [`${lessonCount}/${lessonCount}`, 'LESSONS COMPLETED'],
    [`${passRate}%`, 'SIMULATION PASS RATE'],
    [`${simCount}/${simCount}`, 'SIMULATIONS ATTEMPTED'],
  ];
  const statY = 830;
  const spacing = WIDTH / (stats.length + 1);
  stats.forEach(([value, label], i) => {
    const x = spacing * (i + 1);
    centerText(ctx, value, x, statY, { font: '700 44px Manrope, sans-serif', color: '#ffffff' });
    centerText(ctx, label, x, statY + 40, { font: '700 14px Inter, sans-serif', color: '#71717a', letterSpacing: 2 });
  });

  // Footer: date + signature line
  centerText(ctx, issuedOn, WIDTH / 2, 970, { font: '400 20px Inter, sans-serif', color: '#71717a' });

  ctx.strokeStyle = 'rgba(255,255,255,0.2)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(WIDTH / 2 - 140, 1020);
  ctx.lineTo(WIDTH / 2 + 140, 1020);
  ctx.stroke();
  centerText(ctx, 'ClickWise Security Team', WIDTH / 2, 1050, { font: '700 20px Inter, sans-serif', color: '#ffffff' });

  return canvas.toDataURL('image/png');
}

// Draws the certificate and immediately triggers a browser download.
export async function downloadCertificate(details) {
  const dataUrl = await buildCertificateDataUrl(details);
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = `ClickWise-Certificate-${details.name.replace(/\s+/g, '-')}.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
