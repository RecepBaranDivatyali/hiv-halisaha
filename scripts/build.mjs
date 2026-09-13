import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const rootDir = process.cwd();
const mobileDir = path.join(rootDir, 'mobile-app');
const distDir = path.join(rootDir, 'dist');
const distAdminDir = path.join(rootDir, 'dist-admin');
const mobileDistDir = path.join(mobileDir, 'dist');

console.log('----------------------------------------------------');
console.log('🚀 [1/4] Building Vite Admin Dashboard (/admin)...');
console.log('----------------------------------------------------');
execSync('npx vite build --outDir dist-admin --base /admin/', { stdio: 'inherit', cwd: rootDir });

console.log('\n----------------------------------------------------');
console.log('📦 [2/4] Ensuring mobile-app dependencies...');
console.log('----------------------------------------------------');
if (!fs.existsSync(path.join(mobileDir, 'node_modules'))) {
  console.log('Installing mobile-app dependencies...');
  execSync('npm install --prefer-offline', { stdio: 'inherit', cwd: mobileDir });
} else {
  console.log('mobile-app dependencies already present.');
}

console.log('\n----------------------------------------------------');
console.log('📱 [3/4] Exporting 1:1 React Native Mobile App (Expo Web)...');
console.log('----------------------------------------------------');
execSync('npx expo export --platform web', { stdio: 'inherit', cwd: mobileDir });

function copyDirRecursive(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

console.log('\n----------------------------------------------------');
console.log('📂 [4/4] Merging builds into root /dist...');
console.log('----------------------------------------------------');
if (fs.existsSync(distDir)) {
  fs.rmSync(distDir, { recursive: true, force: true });
}
fs.mkdirSync(distDir, { recursive: true });

// 1. Copy full Expo Web export to dist/
copyDirRecursive(mobileDistDir, distDir);
console.log('✓ Expo Web mobile app copied to root dist/');

// 2. Copy Vite Admin build to dist/admin/
const adminTarget = path.join(distDir, 'admin');
copyDirRecursive(distAdminDir, adminTarget);
console.log('✓ Vite Admin Dashboard copied to dist/admin/');

// 3. Clean up temp dist-admin
if (fs.existsSync(distAdminDir)) {
  fs.rmSync(distAdminDir, { recursive: true, force: true });
}

console.log('\n✨ Build Complete!');
console.log('📱 Root /       -> 1:1 React Native Mobile App');
console.log('🛡️ /admin       -> Web Admin Dashboard');
console.log('----------------------------------------------------\n');
