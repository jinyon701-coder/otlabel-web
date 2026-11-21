const path = require('path');
const fs = require('fs');
const sharp = require('C:/Users/user/AppData/Local/OpenAI/Codex/runtimes/cua_node/db1cc9e06a6c48d6/bin/node_modules/sharp');

const srcIconPath = path.resolve(__dirname, '../assets/icons/icon-512.png');
const resDir = path.resolve(__dirname, '../android/app/src/main/res');

const mipmaps = [
  { folder: 'mipmap-mdpi', size: 48, fgSize: 108, innerSize: 72 },
  { folder: 'mipmap-hdpi', size: 72, fgSize: 162, innerSize: 108 },
  { folder: 'mipmap-xhdpi', size: 96, fgSize: 216, innerSize: 144 },
  { folder: 'mipmap-xxhdpi', size: 144, fgSize: 324, innerSize: 216 },
  { folder: 'mipmap-xxxhdpi', size: 192, fgSize: 432, innerSize: 288 },
];

async function generateMipmaps() {
  for (const m of mipmaps) {
    const dir = path.join(resDir, m.folder);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    // 1. ic_launcher.png (standard icon)
    await sharp(srcIconPath)
      .resize(m.size, m.size)
      .png()
      .toFile(path.join(dir, 'ic_launcher.png'));

    // 2. ic_launcher_round.png (circular mask)
    const circleSvg = Buffer.from(
      `<svg width="${m.size}" height="${m.size}"><circle cx="${m.size / 2}" cy="${m.size / 2}" r="${m.size / 2}" fill="#ffffff"/></svg>`
    );
    await sharp(srcIconPath)
      .resize(m.size, m.size)
      .composite([{ input: circleSvg, blend: 'dest-in' }])
      .png()
      .toFile(path.join(dir, 'ic_launcher_round.png'));

    // 3. ic_launcher_foreground.png (for adaptive icons, centered with safe zone)
    const resizedInner = await sharp(srcIconPath)
      .resize(m.innerSize, m.innerSize)
      .toBuffer();

    const top = Math.round((m.fgSize - m.innerSize) / 2);
    const left = Math.round((m.fgSize - m.innerSize) / 2);

    await sharp({
      create: {
        width: m.fgSize,
        height: m.fgSize,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      }
    })
      .composite([{ input: resizedInner, top, left }])
      .png()
      .toFile(path.join(dir, 'ic_launcher_foreground.png'));

    console.log(`Generated icons in ${m.folder}`);
  }
}

const splashes = [
  { folder: 'drawable', width: 480, height: 800, logoSize: 160 },
  { folder: 'drawable-port-mdpi', width: 320, height: 480, logoSize: 120 },
  { folder: 'drawable-port-hdpi', width: 480, height: 800, logoSize: 160 },
  { folder: 'drawable-port-xhdpi', width: 720, height: 1280, logoSize: 220 },
  { folder: 'drawable-port-xxhdpi', width: 960, height: 1600, logoSize: 280 },
  { folder: 'drawable-port-xxxhdpi', width: 1280, height: 1920, logoSize: 340 },
  { folder: 'drawable-land-mdpi', width: 480, height: 320, logoSize: 120 },
  { folder: 'drawable-land-hdpi', width: 800, height: 480, logoSize: 150 },
  { folder: 'drawable-land-xhdpi', width: 1280, height: 720, logoSize: 200 },
  { folder: 'drawable-land-xxhdpi', width: 1600, height: 960, logoSize: 240 },
  { folder: 'drawable-land-xxxhdpi', width: 1920, height: 1280, logoSize: 280 }
];

async function generateSplashes() {
  for (const s of splashes) {
    const dir = path.join(resDir, s.folder);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    const resizedLogo = await sharp(srcIconPath)
      .resize(s.logoSize, s.logoSize)
      .toBuffer();

    const top = Math.round((s.height - s.logoSize) / 2);
    const left = Math.round((s.width - s.logoSize) / 2);

    await sharp({
      create: {
        width: s.width,
        height: s.height,
        channels: 4,
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      }
    })
      .composite([{ input: resizedLogo, top, left }])
      .png()
      .toFile(path.join(dir, 'splash.png'));

    console.log(`Generated splash in ${s.folder} (${s.width}x${s.height})`);
  }
}

async function main() {
  console.log('Generating Android icons and splash screens...');
  await generateMipmaps();
  await generateSplashes();
  console.log('All Android visual assets generated successfully!');
}

main().catch(console.error);
