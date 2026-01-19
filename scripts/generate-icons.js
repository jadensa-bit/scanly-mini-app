// Generate PWA icons from SVG
const fs = require('fs');
const { createCanvas } = require('canvas');

const sizes = [192, 512];

// Simple piqo logo SVG
const createIconSVG = (size) => `
<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#22d3ee;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#8b5cf6;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" fill="#000000"/>
  <circle cx="${size/2}" cy="${size/2}" r="${size/3}" fill="url(#grad)"/>
  <text x="${size/2}" y="${size/2 + size/10}" font-family="Arial, sans-serif" font-size="${size/4}" font-weight="bold" fill="#ffffff" text-anchor="middle">P</text>
</svg>
`;

// For now, just create placeholder text files that explain the icons are needed
sizes.forEach(size => {
  const content = `Icon placeholder for ${size}x${size}
  
To generate proper icons, you can:
1. Use an online tool like https://realfavicongenerator.net/
2. Upload your piqo logo/branding
3. Generate PWA icons in ${size}x${size} size
4. Replace this file with the generated PNG

Or use the SVG content:
${createIconSVG(size)}
`;
  
  fs.writeFileSync(`./public/icon-${size}.png.txt`, content);
});

console.log('Icon placeholders created. Replace with actual PNG icons for production.');
