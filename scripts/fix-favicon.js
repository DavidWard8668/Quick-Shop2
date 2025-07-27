// scripts/fix-favicon.js
// Run with: node scripts/fix-favicon.js

import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

async function generateFavicons() {
  const sourceImage = 'src/assets/cartpilot-logo.png';
  
  if (!fs.existsSync(sourceImage)) {
    console.error('❌ Source logo not found at:', sourceImage);
    return;
  }

  console.log('🎯 Generating favicons from CartPilot logo...');

  try {
    // Generate ICO favicon (32x32)
    await sharp(sourceImage)
      .resize(32, 32)
      .png()
      .toFile('public/favicon.ico');
    console.log('✅ Generated favicon.ico');

    // Generate PNG favicons
    await sharp(sourceImage)
      .resize(16, 16)
      .png()
      .toFile('public/favicon-16x16.png');
    console.log('✅ Generated favicon-16x16.png');

    await sharp(sourceImage)
      .resize(32, 32)
      .png()
      .toFile('public/favicon-32x32.png');
    console.log('✅ Generated favicon-32x32.png');

    // Replace the default Vite icon
    if (fs.existsSync('public/vite.svg')) {
      fs.unlinkSync('public/vite.svg');
      console.log('🗑️  Removed default vite.svg');
    }

    console.log('');
    console.log('🎉 Favicons generated successfully!');
    console.log('💡 Clear your browser cache (Ctrl+F5) to see the new favicon');
    
  } catch (error) {
    console.error('❌ Error generating favicons:', error);
  }
}

generateFavicons();