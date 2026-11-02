import sharp from 'sharp';
import fs from 'fs';

const svgIcon = `
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#6366f1" />
      <stop offset="100%" stop-color="#4338ca" />
    </linearGradient>
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="16" stdDeviation="20" flood-opacity="0.3"/>
    </filter>
  </defs>
  <rect width="512" height="512" rx="128" fill="url(#bg)" />
  <circle cx="256" cy="256" r="160" fill="white" opacity="0.1" />
  <g transform="matrix(1 0 0 1 256 256)" filter="url(#shadow)">
    <text x="0" y="45" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="160" font-weight="900" fill="#ffffff" text-anchor="middle">
      $
    </text>
  </g>
</svg>
`;

async function generate() {
  const buf = Buffer.from(svgIcon);
  await sharp(buf).resize(192, 192).png().toFile('public/icon-192.png');
  await sharp(buf).resize(512, 512).png().toFile('public/icon-512.png');
  await sharp(buf).resize(180, 180).png().toFile('public/apple-touch-icon.png');
  console.log('Icons generated successfully!');
}

generate();
