import sharp from 'sharp';

const svgSquareNoAlpha = `
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#4f46e5" />
      <stop offset="100%" stop-color="#3730a3" />
    </linearGradient>
  </defs>
  <!-- 100% OPAQUE FULL SQUARE BACKGROUND - NO ROUNDED CORNERS, NO ALPHA -->
  <rect width="512" height="512" fill="url(#bg)" />
  <circle cx="256" cy="256" r="160" fill="#6366f1" />
  <text x="256" y="315" font-family="-apple-system, BlinkMacSystemFont, 'SF Pro Display', Roboto, 'Helvetica Neue', sans-serif" font-size="200" font-weight="900" fill="#ffffff" text-anchor="middle">
    $
  </text>
</svg>
`;

async function generate() {
  const buf = Buffer.from(svgSquareNoAlpha);
  
  // Apple Touch Icon: strictly 180x180, flatten onto opaque background, RGB (no alpha)
  await sharp(buf)
    .resize(180, 180)
    .flatten({ background: '#4f46e5' })
    .toColourspace('srgb')
    .png({ progressive: false })
    .toFile('public/apple-touch-icon.png');

  await sharp(buf)
    .resize(180, 180)
    .flatten({ background: '#4f46e5' })
    .toColourspace('srgb')
    .png({ progressive: false })
    .toFile('public/apple-touch-icon-precomposed.png');

  await sharp(buf)
    .resize(192, 192)
    .png()
    .toFile('public/icon-192.png');

  await sharp(buf)
    .resize(512, 512)
    .png()
    .toFile('public/icon-512.png');

  console.log('Square opaque icons generated successfully!');
}

generate();
