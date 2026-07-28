const sharp = require('sharp');
const fs = require('fs');

async function resize() {
  // Create a transparent 1024x1024 image, and composite the 512x512 logo in the center
  await sharp({
    create: {
      width: 1024,
      height: 1024,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    }
  })
  .composite([{ input: 'public/android-chrome-512x512.png', gravity: 'center' }])
  .toFile('assets/logo.png');

  // Copy to icon and splash as well
  fs.copyFileSync('assets/logo.png', 'assets/icon.png');
  fs.copyFileSync('assets/logo.png', 'assets/splash.png');
  console.log('Logo padded successfully!');
}

resize().catch(console.error);
