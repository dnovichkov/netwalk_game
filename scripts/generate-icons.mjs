import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.join(__dirname, '..');

// Android icon sizes
const ICON_SIZES = {
  'mipmap-mdpi': { launcher: 48, foreground: 108 },
  'mipmap-hdpi': { launcher: 72, foreground: 162 },
  'mipmap-xhdpi': { launcher: 96, foreground: 216 },
  'mipmap-xxhdpi': { launcher: 144, foreground: 324 },
  'mipmap-xxxhdpi': { launcher: 192, foreground: 432 },
};

const SOURCE_SVG = path.join(ROOT_DIR, 'public/icons/icon-512.svg');
const ANDROID_RES = path.join(ROOT_DIR, 'android/app/src/main/res');

// Background color for the icon
const BG_COLOR = { r: 26, g: 26, b: 46, alpha: 255 }; // #1a1a2e

async function generateIcons() {
  console.log('Reading source SVG...');
  const svgBuffer = await fs.readFile(SOURCE_SVG);

  for (const [folder, sizes] of Object.entries(ICON_SIZES)) {
    const targetDir = path.join(ANDROID_RES, folder);

    try {
      await fs.access(targetDir);
    } catch {
      console.log(`Creating directory: ${folder}`);
      await fs.mkdir(targetDir, { recursive: true });
    }

    console.log(`Generating icons for ${folder}...`);

    // Generate ic_launcher.png (with background)
    await sharp(svgBuffer)
      .resize(sizes.launcher, sizes.launcher)
      .flatten({ background: BG_COLOR })
      .png()
      .toFile(path.join(targetDir, 'ic_launcher.png'));

    // Generate ic_launcher_round.png (with background, will be masked by Android)
    await sharp(svgBuffer)
      .resize(sizes.launcher, sizes.launcher)
      .flatten({ background: BG_COLOR })
      .png()
      .toFile(path.join(targetDir, 'ic_launcher_round.png'));

    // Generate ic_launcher_foreground.png (for adaptive icon)
    // Foreground needs padding - icon should be 66% of the total size
    const iconSize = Math.floor(sizes.foreground * 0.66);
    const padding = Math.floor((sizes.foreground - iconSize) / 2);

    await sharp(svgBuffer)
      .resize(iconSize, iconSize)
      .extend({
        top: padding,
        bottom: sizes.foreground - iconSize - padding,
        left: padding,
        right: sizes.foreground - iconSize - padding,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .png()
      .toFile(path.join(targetDir, 'ic_launcher_foreground.png'));
  }

  console.log('Icons generated successfully!');
}

generateIcons().catch((error) => {
  console.error('Error generating icons:', error);
  process.exit(1);
});
