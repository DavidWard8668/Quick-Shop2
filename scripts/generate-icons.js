// scripts/generate-icons.js
// ES Module version for modern Node.js projects
// Run with: node scripts/generate-icons.js

import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Icon sizes needed for PWA
const iconSizes = [
  { size: 72, name: 'icon-72x72.png' },
  { size: 96, name: 'icon-96x96.png' },
  { size: 128, name: 'icon-128x128.png' },
  { size: 144, name: 'icon-144x144.png' },
  { size: 152, name: 'icon-152x152.png' },
  { size: 192, name: 'icon-192x192.png' },
  { size: 384, name: 'icon-384x384.png' },
  { size: 512, name: 'icon-512x512.png' }
];

// Additional sizes for iOS and Android
const additionalSizes = [
  { size: 57, name: 'apple-icon-57x57.png' },
  { size: 60, name: 'apple-icon-60x60.png' },
  { size: 72, name: 'apple-icon-72x72.png' },
  { size: 76, name: 'apple-icon-76x76.png' },
  { size: 114, name: 'apple-icon-114x114.png' },
  { size: 120, name: 'apple-icon-120x120.png' },
  { size: 144, name: 'apple-icon-144x144.png' },
  { size: 152, name: 'apple-icon-152x152.png' },
  { size: 180, name: 'apple-icon-180x180.png' }
];

async function generateIcons() {
  // Source image should be 512x512 or larger
  const sourceImage = path.join(process.cwd(), 'src/assets/cartpilot-logo.png');
  const outputDir = path.join(process.cwd(), 'public/icons');

  // Check if source image exists
  if (!fs.existsSync(sourceImage)) {
    console.error(`❌ Source image not found: ${sourceImage}`);
    console.log('📝 Please create a 512x512 CartPilot logo at src/assets/cartpilot-logo.png');
    console.log('');
    console.log('Quick fix options:');
    console.log('1. Create src/assets/ directory: mkdir src\\assets (Windows) or mkdir -p src/assets (Mac/Linux)');
    console.log('2. Add your logo as: src/assets/cartpilot-logo.png');
    console.log('3. Or create a simple test logo first');
    return false;
  }

  // Create output directory if it doesn't exist
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
    console.log(`📁 Created directory: ${outputDir}`);
  }

  console.log('🎨 Generating PWA icons...');
  console.log(`📂 Source: ${sourceImage}`);
  console.log(`📂 Output: ${outputDir}`);
  console.log('');

  try {
    // Generate main PWA icons with circular mask
    console.log('🚀 Generating main PWA icons with circular mask...');
    for (const icon of iconSizes) {
      // Create circular mask
      const circularMask = Buffer.from(
        `<svg width="${icon.size}" height="${icon.size}">
          <circle cx="${icon.size/2}" cy="${icon.size/2}" r="${icon.size/2}" fill="white"/>
        </svg>`
      );

      await sharp(sourceImage)
        .resize(icon.size, icon.size, {
          kernel: sharp.kernel.lanczos3,
          fit: 'cover',
          position: 'center',
          background: { r: 255, g: 255, b: 255, alpha: 0 }
        })
        .composite([{ input: circularMask, blend: 'dest-in' }])
        .png({ quality: 100 })
        .toFile(path.join(outputDir, icon.name));
      
      console.log(`✅ Generated circular ${icon.name}`);
    }

    console.log('');
    console.log('🍎 Generating Apple Touch Icons with circular mask...');

    // Generate Apple Touch Icons with circular mask
    for (const icon of additionalSizes) {
      // Create circular mask
      const circularMask = Buffer.from(
        `<svg width="${icon.size}" height="${icon.size}">
          <circle cx="${icon.size/2}" cy="${icon.size/2}" r="${icon.size/2}" fill="white"/>
        </svg>`
      );

      await sharp(sourceImage)
        .resize(icon.size, icon.size, {
          kernel: sharp.kernel.lanczos3,
          fit: 'cover',
          position: 'center'
        })
        .composite([{ input: circularMask, blend: 'dest-in' }])
        .png({ quality: 100 })
        .toFile(path.join(outputDir, icon.name));
      
      console.log(`✅ Generated circular ${icon.name}`);
    }

    console.log('');
    console.log('🌐 Generating favicons...');

    // Generate favicon
    const publicDir = path.join(process.cwd(), 'public');
    
    await sharp(sourceImage)
      .resize(32, 32)
      .png()
      .toFile(path.join(publicDir, 'favicon-32x32.png'));
    console.log('✅ Generated favicon-32x32.png');

    await sharp(sourceImage)
      .resize(16, 16)
      .png()
      .toFile(path.join(publicDir, 'favicon-16x16.png'));
    console.log('✅ Generated favicon-16x16.png');

    console.log('');
    console.log('🎭 Generating maskable icon...');

    // Generate maskable icon (with padding for safe area)
    await sharp(sourceImage)
      .resize(416, 416) // 512 - (48*2) for safe area
      .extend({
        top: 48,
        bottom: 48,
        left: 48,
        right: 48,
        background: { r: 59, g: 130, b: 246, alpha: 1 } // Blue background
      })
      .png()
      .toFile(path.join(outputDir, 'icon-512x512-maskable.png'));

    console.log('✅ Generated maskable icon');

    // Create splash screens for iOS
    await generateSplashScreens(sourceImage, outputDir);

    return true;

  } catch (error) {
    console.error('❌ Error generating icons:', error.message);
    console.log('');
    console.log('💡 Troubleshooting:');
    console.log('1. Make sure Sharp is installed: npm install sharp');
    console.log('2. Check your source image is valid PNG/JPG');
    console.log('3. Ensure you have write permissions to public/ folder');
    console.log('4. Try with a different source image');
    return false;
  }
}

async function generateSplashScreens(sourceImage, outputDir) {
  const splashDir = path.join(outputDir, 'splash');
  
  // Create splash directory
  if (!fs.existsSync(splashDir)) {
    fs.mkdirSync(splashDir, { recursive: true });
    console.log(`📁 Created directory: ${splashDir}`);
  }

  const splashSizes = [
    { width: 640, height: 1136, name: 'splash-640x1136.png', device: 'iPhone 5' },
    { width: 750, height: 1334, name: 'splash-750x1334.png', device: 'iPhone 6/7/8' },
    { width: 828, height: 1792, name: 'splash-828x1792.png', device: 'iPhone XR' },
    { width: 1125, height: 2436, name: 'splash-1125x2436.png', device: 'iPhone X/XS' },
    { width: 1242, height: 2208, name: 'splash-1242x2208.png', device: 'iPhone 6/7/8 Plus' },
    { width: 1242, height: 2688, name: 'splash-1242x2688.png', device: 'iPhone XS Max' },
    { width: 1536, height: 2048, name: 'splash-1536x2048.png', device: 'iPad' },
    { width: 1668, height: 2224, name: 'splash-1668x2224.png', device: 'iPad Pro 10.5"' },
    { width: 1668, height: 2388, name: 'splash-1668x2388.png', device: 'iPad Pro 11"' },
    { width: 2048, height: 2732, name: 'splash-2048x2732.png', device: 'iPad Pro 12.9"' }
  ];

  console.log('');
  console.log('📱 Generating iOS splash screens...');

  for (const splash of splashSizes) {
    try {
      // Create a splash screen with logo centered on blue background
      await sharp({
        create: {
          width: splash.width,
          height: splash.height,
          channels: 4,
          background: { r: 59, g: 130, b: 246, alpha: 1 } // CartPilot blue
        }
      })
      .composite([
        {
          input: await sharp(sourceImage)
            .resize(Math.min(splash.width * 0.3, splash.height * 0.3))
            .png()
            .toBuffer(),
          gravity: 'center'
        }
      ])
      .png()
      .toFile(path.join(splashDir, splash.name));

      console.log(`✅ Generated ${splash.name} (${splash.device})`);
    } catch (error) {
      console.log(`⚠️  Failed to generate ${splash.name}: ${error.message}`);
    }
  }
}

// HTML meta tags generator
function generateMetaTags() {
  console.log('');
  console.log('📝 Generating HTML meta tags...');

  const metaTags = `<!-- PWA Icons -->
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
<link rel="apple-touch-icon" sizes="180x180" href="/icons/apple-icon-180x180.png">
<link rel="apple-touch-icon" sizes="152x152" href="/icons/apple-icon-152x152.png">
<link rel="apple-touch-icon" sizes="144x144" href="/icons/apple-icon-144x144.png">
<link rel="apple-touch-icon" sizes="120x120" href="/icons/apple-icon-120x120.png">
<link rel="apple-touch-icon" sizes="114x114" href="/icons/apple-icon-114x114.png">
<link rel="apple-touch-icon" sizes="76x76" href="/icons/apple-icon-76x76.png">
<link rel="apple-touch-icon" sizes="72x72" href="/icons/apple-icon-72x72.png">
<link rel="apple-touch-icon" sizes="60x60" href="/icons/apple-icon-60x60.png">
<link rel="apple-touch-icon" sizes="57x57" href="/icons/apple-icon-57x57.png">

<!-- iOS Splash Screens -->
<link rel="apple-touch-startup-image" href="/icons/splash/splash-640x1136.png" media="(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2)">
<link rel="apple-touch-startup-image" href="/icons/splash/splash-750x1334.png" media="(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2)">
<link rel="apple-touch-startup-image" href="/icons/splash/splash-1242x2208.png" media="(device-width: 414px) and (device-height: 736px) and (-webkit-device-pixel-ratio: 3)">
<link rel="apple-touch-startup-image" href="/icons/splash/splash-1125x2436.png" media="(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3)">
<link rel="apple-touch-startup-image" href="/icons/splash/splash-828x1792.png" media="(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2)">
<link rel="apple-touch-startup-image" href="/icons/splash/splash-1242x2688.png" media="(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3)">
<link rel="apple-touch-startup-image" href="/icons/splash/splash-1536x2048.png" media="(device-width: 768px) and (device-height: 1024px) and (-webkit-device-pixel-ratio: 2)">
<link rel="apple-touch-startup-image" href="/icons/splash/splash-1668x2224.png" media="(device-width: 834px) and (device-height: 1112px) and (-webkit-device-pixel-ratio: 2)">
<link rel="apple-touch-startup-image" href="/icons/splash/splash-1668x2388.png" media="(device-width: 834px) and (device-height: 1194px) and (-webkit-device-pixel-ratio: 2)">
<link rel="apple-touch-startup-image" href="/icons/splash/splash-2048x2732.png" media="(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2)">

<!-- PWA Manifest -->
<link rel="manifest" href="/manifest.json">
<meta name="theme-color" content="#3b82f6">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<meta name="apple-mobile-web-app-title" content="CartPilot">`;

  // Write meta tags to file
  const metaTagsPath = path.join(process.cwd(), 'meta-tags.html');
  fs.writeFileSync(metaTagsPath, metaTags);
  console.log('✅ Meta tags saved to meta-tags.html');
  console.log('📋 Copy these tags into your public/index.html <head> section');
}

// Updated manifest.json generator
function generateManifest() {
  console.log('');
  console.log('📱 Generating/updating manifest.json...');

  const manifest = {
    "name": "CartPilot - Smart Grocery Navigation",
    "short_name": "CartPilot",
    "description": "Navigate stores efficiently with allergen-safe route planning and barcode scanning",
    "start_url": "/",
    "display": "standalone",
    "background_color": "#ffffff",
    "theme_color": "#3b82f6",
    "orientation": "portrait-primary",
    "categories": ["shopping", "lifestyle", "productivity"],
    "lang": "en-GB",
    "dir": "ltr",
    "scope": "/",
    "icons": [
      {
        "src": "/icons/icon-72x72.png",
        "sizes": "72x72",
        "type": "image/png",
        "purpose": "any"
      },
      {
        "src": "/icons/icon-96x96.png",
        "sizes": "96x96",
        "type": "image/png",
        "purpose": "any"
      },
      {
        "src": "/icons/icon-128x128.png",
        "sizes": "128x128",
        "type": "image/png",
        "purpose": "any"
      },
      {
        "src": "/icons/icon-144x144.png",
        "sizes": "144x144",
        "type": "image/png",
        "purpose": "any"
      },
      {
        "src": "/icons/icon-152x152.png",
        "sizes": "152x152",
        "type": "image/png",
        "purpose": "any"
      },
      {
        "src": "/icons/icon-192x192.png",
        "sizes": "192x192",
        "type": "image/png",
        "purpose": "any"
      },
      {
        "src": "/icons/icon-384x384.png",
        "sizes": "384x384",
        "type": "image/png",
        "purpose": "any"
      },
      {
        "src": "/icons/icon-512x512.png",
        "sizes": "512x512",
        "type": "image/png",
        "purpose": "any"
      },
      {
        "src": "/icons/icon-512x512-maskable.png",
        "sizes": "512x512",
        "type": "image/png",
        "purpose": "maskable"
      }
    ],
    "shortcuts": [
      {
        "name": "Quick Scan",
        "short_name": "Scan",
        "description": "Scan product barcode immediately",
        "url": "/scan",
        "icons": [
          {
            "src": "/icons/icon-96x96.png",
            "sizes": "96x96"
          }
        ]
      },
      {
        "name": "Find Stores",
        "short_name": "Stores",
        "description": "Locate nearby stores",
        "url": "/stores",
        "icons": [
          {
            "src": "/icons/icon-96x96.png",
            "sizes": "96x96"
          }
        ]
      }
    ]
  };

  // Ensure public directory exists
  const publicDir = path.join(process.cwd(), 'public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
    console.log('📁 Created public/ directory');
  }

  const manifestPath = path.join(publicDir, 'manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  console.log('✅ Updated public/manifest.json');
}

function showHelp() {
  console.log(`
🛒 CartPilot PWA Icon Generator (ES Module Version)

Usage:
  node scripts/generate-icons.js [options]

Options:
  --meta-only    Generate only meta tags
  --manifest     Generate only manifest.json
  --setup        Show setup instructions
  --help         Show this help

Requirements:
  - Source image at src/assets/cartpilot-logo.png (512x512 or larger)
  - Sharp npm package: npm install sharp

Examples:
  node scripts/generate-icons.js          # Generate everything
  node scripts/generate-icons.js --setup  # Show setup instructions
`);
}

function showSetup() {
  console.log(`
📦 Setup Instructions for CartPilot PWA Icons

1. Install Sharp (image processing):
   npm install sharp --save-dev

2. Create directories:
   Windows: mkdir src\\assets && mkdir public\\icons
   Mac/Linux: mkdir -p src/assets public/icons

3. Add your logo:
   - Create a 512x512 pixel CartPilot logo
   - Save as: src/assets/cartpilot-logo.png

4. Run the generator:
   node scripts/generate-icons.js

5. Copy generated meta tags:
   - Meta tags will be saved to meta-tags.html
   - Copy contents into your public/index.html <head> section

Alternative - Create a simple test logo with PowerShell (Windows):
   # Create a simple blue square with text (requires ImageMagick or similar)
   # Or just download a placeholder:
   
   PowerShell: Invoke-WebRequest -Uri "https://via.placeholder.com/512x512/3b82f6/ffffff?text=CartPilot" -OutFile "src/assets/cartpilot-logo.png"

Then run: node scripts/generate-icons.js
`);
}

// Main execution function
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help')) {
    showHelp();
    process.exit(0);
  }

  if (args.includes('--setup')) {
    showSetup();
    process.exit(0);
  }

  if (args.includes('--meta-only')) {
    generateMetaTags();
    process.exit(0);
  }

  if (args.includes('--manifest')) {
    generateManifest();
    process.exit(0);
  }

  // Generate everything
  console.log('🚀 Starting CartPilot PWA icon generation...');
  console.log('');

  const success = await generateIcons();
  
  if (success) {
    generateMetaTags();
    generateManifest();
    
    console.log('');
    console.log('🎉 All icons generated successfully!');
    console.log('');
    console.log('📋 Next steps:');
    console.log('1. Copy meta tags from meta-tags.html into your public/index.html');
    console.log('2. Verify manifest.json has been updated');
    console.log('3. Test your PWA with: npm start');
    console.log('4. Check install prompt appears in browser');
    console.log('');
    console.log('📁 Files created:');
    console.log('- public/icons/ (15+ icon files)');
    console.log('- public/manifest.json (updated)'); 
    console.log('- meta-tags.html (HTML to copy)');
    console.log('- public/favicon-*.png (favicons)');
  } else {
    console.log('');
    console.log('❌ Icon generation failed. Please check the error messages above.');
    process.exit(1);
  }
}

// Run main function
main().catch((error) => {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
});