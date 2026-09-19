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

// 1.1 Copy PWA public files (manifest.json, sw.js, icons/) to dist/
const mobilePublicDir = path.join(mobileDir, 'public');
if (fs.existsSync(mobilePublicDir)) {
  copyDirRecursive(mobilePublicDir, distDir);
  console.log('✓ PWA assets (manifest.json, sw.js, icons/) copied to dist/');
}

// 1.2 Inject PWA headers and ServiceWorker into all HTML files
function injectPwa(dir) {
  const pwaHeadTags = `
    <!-- PWA & Mobile Web App Meta Tags -->
    <link rel="manifest" href="/manifest.json" />
    <meta name="theme-color" content="#0e0e0e" />
    <meta name="mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
    <meta name="apple-mobile-web-app-title" content="H.İ.V" />
    <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
    <link rel="apple-touch-icon" sizes="192x192" href="/icons/icon-192x192.png" />
    <link rel="apple-touch-icon" sizes="512x512" href="/icons/icon-512x512.png" />
  `;

  const swScript = `
    <script>
      if ('serviceWorker' in navigator) {
        window.addEventListener('load', function() {
          navigator.serviceWorker.register('/sw.js', { scope: '/' })
            .then(function(reg) {
              console.log('PWA ServiceWorker registered with scope:', reg.scope);
            })
            .catch(function(err) {
              console.log('PWA ServiceWorker registration failed:', err);
            });
        });
      }
    </script>
  `;

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'admin') {
        injectPwa(fullPath);
      }
    } else if (entry.name.endsWith('.html')) {
      let html = fs.readFileSync(fullPath, 'utf8');
      if (!html.includes('rel="manifest"')) {
        html = html.replace('</head>', `${pwaHeadTags}\n</head>`);
      }
      if (!html.includes('navigator.serviceWorker.register')) {
        html = html.replace('</body>', `${swScript}\n</body>`);
      }
      fs.writeFileSync(fullPath, html, 'utf8');
    }
  }
}

injectPwa(distDir);
console.log('✓ PWA manifest and ServiceWorker injected into all HTML routes');

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
