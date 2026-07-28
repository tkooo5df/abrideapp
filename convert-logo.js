import sharp from 'sharp';

async function convertSvgToPng() {
  try {
    // Convert to 32x32 PNG for favicon
    await sharp('public/logo.svg')
      .resize(32, 32)
      .png()
      .toFile('public/logo-32x32.png');
    
    // Convert to 16x16 PNG for favicon
    await sharp('public/logo.svg')
      .resize(16, 16)
      .png()
      .toFile('public/logo-16x16.png');
    
    // Convert to 180x180 PNG for apple touch icon
    await sharp('public/logo.svg')
      .resize(180, 180)
      .png()
      .toFile('public/logo-180x180.png');
    
    // Create a generic logo.png (32x32)
    await sharp('public/logo.svg')
      .resize(32, 32)
      .png()
      .toFile('public/logo.png');
    
    console.log('Successfully converted SVG to PNG formats');
  } catch (error) {
    console.error('Error converting SVG to PNG:', error);
  }
}

convertSvgToPng();