#!/usr/bin/env node

/**
 * H.İ.V: Halısaha İhtiyacım Var — Android Çoklu-Çıktı Derleme & Google Play Yayınlama Botu
 *
 * Kullanım:
 *   node scripts/deploy-google-play.mjs status
 *   node scripts/deploy-google-play.mjs bump
 *   node scripts/deploy-google-play.mjs build [--bump] [--aab-only]
 *   node scripts/deploy-google-play.mjs deploy [--track=alpha|internal|beta|production] [--name="..."] [--notes="..."] [--aab="..."]
 *   node scripts/deploy-google-play.mjs release [--bump] [--aab-only] [--track=alpha|internal|beta|production] [--name="..."] [--notes="..."]
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import https from 'node:https';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const MOBILE_DIR = path.resolve(__dirname, '..');
const PROJECT_ROOT = path.resolve(MOBILE_DIR, '..');

const GOOGLE_PACKAGE_NAME = 'com.hiv.halisaha';
const GOOGLE_SA_PATH = path.join(PROJECT_ROOT, 'store-secrets', 'google-play-service-account.json');
const ANDROID_DIR = path.join(MOBILE_DIR, 'android');

const APP_JSON_PATH = path.join(MOBILE_DIR, 'app.json');
const PACKAGE_JSON_PATH = path.join(MOBILE_DIR, 'package.json');
const BUILD_GRADLE_PATH = path.join(ANDROID_DIR, 'app', 'build.gradle');
const SIDE_MENU_PATH = path.join(MOBILE_DIR, 'components', 'SideMenu.tsx');

const RELEASE_AAB_PATH = path.join(ANDROID_DIR, 'app', 'build', 'outputs', 'bundle', 'release', 'app-release.aab');
const RELEASE_APK_PATH = path.join(ANDROID_DIR, 'app', 'build', 'outputs', 'apk', 'release', 'app-release.apk');

const JDK_CANDIDATES = [
  'C:\\Program Files\\Eclipse Adoptium\\jdk-17.0.21.9-hotspot',
  'C:\\Users\\90536\\.jdks\\jbr-21.0.11',
  'C:\\Program Files\\Android\\Android Studio\\jbr'
];

const VALID_TRACKS = ['internal', 'alpha', 'beta', 'production'];
const DEFAULT_TRACK = 'alpha';

function readLocalAppMeta() {
  const appJson = JSON.parse(fs.readFileSync(APP_JSON_PATH, 'utf8'));
  const version = appJson?.expo?.version || '1.0.0';
  const versionCode = Number(appJson?.expo?.android?.versionCode || 1);
  const iosBuildNumber = String(appJson?.expo?.ios?.buildNumber || versionCode);
  return { appJson, version, versionCode, iosBuildNumber };
}

function getDefaultReleaseName(version) {
  return `${version} - Performans ve Uyumluluk Güncellemesi`;
}

function getDefaultReleaseNotes(version) {
  return [
    `⚽ H.İ.V v${version} Güncellemesi:`,
    '• Performans, kararlılık ve güvenlik iyileştirmeleri yapıldı.',
    '• R8/ProGuard optimizasyonu ve gereksiz izin temizliği uygulandı.',
    '• Büyük ekran ve modern Android sürümleri için uyumluluk güncellendi.'
  ].join('\n');
}

function parseCliArgs() {
  const args = process.argv.slice(2);
  const command = (args[0] && !args[0].startsWith('--')) ? args[0] : 'status';
  const options = {
    command,
    track: DEFAULT_TRACK,
    name: null,
    notes: null,
    aab: RELEASE_AAB_PATH,
    bump: false,
    aabOnly: false
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--bump') options.bump = true;
    else if (arg === '--aab-only') options.aabOnly = true;
    else if (arg.startsWith('--track=')) options.track = arg.slice(8);
    else if (arg === '--track' && args[i + 1]) options.track = args[++i];
    else if (arg.startsWith('--name=')) options.name = arg.slice(7);
    else if (arg === '--name' && args[i + 1]) options.name = args[++i];
    else if (arg.startsWith('--notes=')) options.notes = arg.slice(8);
    else if (arg === '--notes' && args[i + 1]) options.notes = args[++i];
    else if (arg.startsWith('--aab=')) options.aab = arg.slice(6);
    else if (arg === '--aab' && args[i + 1]) options.aab = args[++i];
  }

  if (!VALID_TRACKS.includes(options.track)) {
    throw new Error(`Geçersiz track: "${options.track}". Desteklenen değerler: ${VALID_TRACKS.join(', ')}`);
  }

  return options;
}

function incrementPatchVersion(versionStr) {
  const match = String(versionStr || '').trim().match(/^(\d+)\.(\d+)\.(\d+)$/);
  if (!match) {
    throw new Error(`Geçersiz semver sürüm formatı: "${versionStr}" (beklenen: X.Y.Z)`);
  }
  const major = Number(match[1]);
  const minor = Number(match[2]);
  const patch = Number(match[3]) + 1;
  return `${major}.${minor}.${patch}`;
}

function bumpVersions() {
  const { appJson, version: oldVersion, versionCode: appJsonCode, iosBuildNumber } = readLocalAppMeta();

  let gradleCode = appJsonCode;
  if (fs.existsSync(BUILD_GRADLE_PATH)) {
    const gradleText = fs.readFileSync(BUILD_GRADLE_PATH, 'utf8');
    const codeMatch = gradleText.match(/\bversionCode\s+(\d+)/);
    if (codeMatch) {
      gradleCode = Number(codeMatch[1]);
    }
  }

  const iosCode = Number.parseInt(iosBuildNumber, 10) || appJsonCode;
  const oldCode = Math.max(appJsonCode, gradleCode, iosCode);
  const newVersion = incrementPatchVersion(oldVersion);
  const newCode = oldCode + 1;

  // 1. mobile-app/app.json
  appJson.expo.version = newVersion;
  appJson.expo.android = appJson.expo.android || {};
  appJson.expo.android.versionCode = newCode;
  appJson.expo.ios = appJson.expo.ios || {};
  appJson.expo.ios.buildNumber = String(newCode);
  fs.writeFileSync(APP_JSON_PATH, `${JSON.stringify(appJson, null, 2)}\n`, 'utf8');

  // 2. mobile-app/package.json
  const pkgJson = JSON.parse(fs.readFileSync(PACKAGE_JSON_PATH, 'utf8'));
  pkgJson.version = newVersion;
  fs.writeFileSync(PACKAGE_JSON_PATH, `${JSON.stringify(pkgJson, null, 2)}\n`, 'utf8');

  // 3. mobile-app/android/app/build.gradle
  if (!fs.existsSync(BUILD_GRADLE_PATH)) {
    throw new Error(`build.gradle bulunamadı: ${BUILD_GRADLE_PATH}`);
  }
  let gradleContent = fs.readFileSync(BUILD_GRADLE_PATH, 'utf8');
  if (!/\bversionCode\s+\d+/.test(gradleContent) || !/\bversionName\s+["'][^"']+["']/.test(gradleContent)) {
    throw new Error('android/app/build.gradle içinde versionCode veya versionName bulunamadı.');
  }
  gradleContent = gradleContent
    .replace(/(\bversionCode\s+)\d+/, `$1${newCode}`)
    .replace(/(\bversionName\s+)(["'])[^"']+\2/, `$1$2${newVersion}$2`);
  fs.writeFileSync(BUILD_GRADLE_PATH, gradleContent, 'utf8');

  // 4. mobile-app/components/SideMenu.tsx
  let sideMenuUpdated = false;
  if (fs.existsSync(SIDE_MENU_PATH)) {
    const sideMenuContent = fs.readFileSync(SIDE_MENU_PATH, 'utf8');
    const versionRegex = /(styles\.version\}>v)\d+\.\d+\.\d+/;
    const fallbackRegex = /(\bv)\d+\.\d+\.\d+(\s*—)/;
    let updatedContent = sideMenuContent;
    if (versionRegex.test(sideMenuContent)) {
      updatedContent = sideMenuContent.replace(versionRegex, `$1${newVersion}`);
      sideMenuUpdated = true;
    } else if (fallbackRegex.test(sideMenuContent)) {
      updatedContent = sideMenuContent.replace(fallbackRegex, `$1${newVersion}$2`);
      sideMenuUpdated = true;
    }
    if (sideMenuUpdated) {
      fs.writeFileSync(SIDE_MENU_PATH, updatedContent, 'utf8');
    } else {
      console.warn('⚠️ components/SideMenu.tsx içinde vX.Y.Z sürüm etiketi bulunamadı, atlandı.');
    }
  } else {
    console.warn(`⚠️ SideMenu.tsx bulunamadı (${SIDE_MENU_PATH}), atlandı.`);
  }

  console.log('\n==============================================================');
  console.log(`🔼 SÜRÜM OTOMATİK ARTIRILDI: v${oldVersion} (code ${oldCode}) -> v${newVersion} (code ${newCode})`);
  console.log('==============================================================');
  console.log(`  ✓ app.json                  -> version: "${newVersion}", android.versionCode: ${newCode}, ios.buildNumber: "${newCode}"`);
  console.log(`  ✓ package.json              -> version: "${newVersion}"`);
  console.log(`  ✓ android/app/build.gradle  -> versionName: "${newVersion}", versionCode: ${newCode}`);
  if (sideMenuUpdated) {
    console.log(`  ✓ components/SideMenu.tsx   -> v${newVersion}`);
  }

  return { oldVersion, newVersion, oldCode, newCode };
}

function formatSize(bytes) {
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB (${bytes.toLocaleString('tr-TR')} bayt)`;
}

function reportArtifact(label, filePath, required = true) {
  if (fs.existsSync(filePath)) {
    const stat = fs.statSync(filePath);
    console.log(`  ✓ ${label}`);
    console.log(`    Yol   : ${filePath}`);
    console.log(`    Boyut : ${formatSize(stat.size)}`);
    return stat;
  }
  if (required) {
    throw new Error(`${label} çıktısı bulunamadı: ${filePath}`);
  }
  console.log(`  ⚪ ${label}: Henüz oluşturulmadı (${filePath})`);
  return null;
}

function httpRequest(urlStr, options = {}, bodyBuffer = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlStr);
    const reqOptions = {
      protocol: url.protocol,
      hostname: url.hostname,
      port: url.port || 443,
      path: `${url.pathname}${url.search}`,
      method: options.method || 'GET',
      headers: {
        'User-Agent': 'HIV-Deploy-Bot/2.0',
        ...options.headers
      }
    };

    if (bodyBuffer) {
      reqOptions.headers['Content-Length'] = Buffer.isBuffer(bodyBuffer)
        ? bodyBuffer.length
        : Buffer.byteLength(bodyBuffer);
    }

    const req = https.request(reqOptions, (res) => {
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => {
        const raw = Buffer.concat(chunks);
        const str = raw.toString('utf8');
        let parsed = null;
        try { parsed = JSON.parse(str); } catch { parsed = null; }
        resolve({ statusCode: res.statusCode, headers: res.headers, data: parsed, rawString: str });
      });
    });

    req.on('error', reject);
    if (bodyBuffer) req.write(bodyBuffer);
    req.end();
  });
}

async function getGoogleAccessToken() {
  if (!fs.existsSync(GOOGLE_SA_PATH)) {
    throw new Error(`Google Play Service Account JSON bulunamadı: ${GOOGLE_SA_PATH}`);
  }
  const sa = JSON.parse(fs.readFileSync(GOOGLE_SA_PATH, 'utf8'));
  const now = Math.floor(Date.now() / 1000);

  const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({
    iss: sa.client_email,
    scope: 'https://www.googleapis.com/auth/androidpublisher',
    aud: sa.token_uri,
    iat: now,
    exp: now + 3600
  })).toString('base64url');

  const unsigned = `${header}.${payload}`;
  const sig = crypto.sign('sha256', Buffer.from(unsigned), sa.private_key).toString('base64url');
  const postData = `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${unsigned}.${sig}`;

  const res = await httpRequest(sa.token_uri, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
  }, postData);

  if (res.statusCode !== 200 || !res.data?.access_token) {
    throw new Error(`Google OAuth token alınamadı (${res.statusCode}): ${res.rawString}`);
  }
  return { token: res.data.access_token, email: sa.client_email };
}

async function checkStatus() {
  const { version, versionCode, iosBuildNumber } = readLocalAppMeta();
  console.log('==============================================================');
  console.log(`📱 H.İ.V. Yerel Sürüm: v${version} (Android versionCode: ${versionCode} | iOS build: ${iosBuildNumber})`);
  console.log('==============================================================');
  reportArtifact('Google Play AAB', RELEASE_AAB_PATH, false);
  reportArtifact('Huawei / Doğrudan APK', RELEASE_APK_PATH, false);
  console.log('');

  const { token, email } = await getGoogleAccessToken();
  console.log(`🔑 Service Account: ${email}`);
  const baseUrl = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${GOOGLE_PACKAGE_NAME}`;

  const editRes = await httpRequest(`${baseUrl}/edits`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
  });

  if (editRes.statusCode !== 200 || !editRes.data?.id) {
    console.error(`❌ Google Play edit açılamadı (${editRes.statusCode}):\n${editRes.rawString}`);
    process.exit(1);
  }

  const editId = editRes.data.id;
  try {
    for (const track of VALID_TRACKS) {
      const trackRes = await httpRequest(`${baseUrl}/edits/${editId}/tracks/${track}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (trackRes.statusCode === 200 && trackRes.data?.releases?.length) {
        const rel = trackRes.data.releases[0];
        console.log(`✅ [${track}] Sürüm: ${rel.name || 'İsimsiz'} | versionCodes: ${JSON.stringify(rel.versionCodes || [])} | durum: ${rel.status}`);
      } else {
        console.log(`⚪ [${track}] Aktif sürüm yok`);
      }
    }
  } finally {
    await httpRequest(`${baseUrl}/edits/${editId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    }).catch(() => {});
  }
}

function resolveJdk() {
  const foundCandidate = JDK_CANDIDATES.find((p) => fs.existsSync(p));
  if (foundCandidate) return foundCandidate;
  if (process.env.JAVA_HOME && fs.existsSync(process.env.JAVA_HOME)) {
    return process.env.JAVA_HOME;
  }
  return null;
}

function runAndroidBuild({ aabOnly = false } = {}) {
  return new Promise((resolve, reject) => {
    const keystoreProps = path.join(ANDROID_DIR, 'keystore.properties');
    if (!fs.existsSync(keystoreProps)) {
      return reject(new Error(`keystore.properties bulunamadı: ${keystoreProps}\nÖnce android/keystore.properties dosyasını oluşturun.`));
    }

    const { version, versionCode } = readLocalAppMeta();
    const env = { ...process.env };
    const foundJdk = resolveJdk();
    if (foundJdk) {
      env.JAVA_HOME = foundJdk;
      env.PATH = `${path.join(foundJdk, 'bin')}${path.delimiter}${env.PATH || ''}`;
      console.log(`☕ JAVA_HOME: ${foundJdk}`);
    } else {
      console.warn('⚠️ Uyarı: Önerilen JDK 17 yolu bulunamadı; sistem varsayılan Java kullanılacak.');
    }

    const gradleTasks = aabOnly ? ['bundleRelease'] : ['bundleRelease', 'assembleRelease'];
    const isWin = process.platform === 'win32';
    const cmd = isWin ? 'cmd.exe' : './gradlew';
    const cmdArgs = isWin ? ['/c', 'gradlew.bat', ...gradleTasks] : gradleTasks;

    console.log('\n==============================================================');
    console.log(`🔨 H.İ.V. v${version} (versionCode: ${versionCode}) Release Derlemesi`);
    console.log(`   Görevler: gradlew ${gradleTasks.join(' ')}`);
    console.log('==============================================================');

    const proc = spawn(cmd, cmdArgs, {
      cwd: ANDROID_DIR,
      env,
      stdio: 'inherit'
    });

    proc.on('error', reject);
    proc.on('close', (code) => {
      if (code !== 0) {
        return reject(new Error(`Gradle (${gradleTasks.join(' ')}) hata koduyla sonlandı: ${code}`));
      }

      try {
        console.log('\n==============================================================');
        console.log('✅ DERLEME TAMAMLANDI — İMZALI RELEASE ÇIKTILARI:');
        console.log('==============================================================');
        reportArtifact('Google Play Paketi (AAB)', RELEASE_AAB_PATH, true);
        if (!aabOnly) {
          reportArtifact('Huawei AppGallery & Doğrudan Dağıtım (APK)', RELEASE_APK_PATH, true);
        }
        console.log('');
        resolve();
      } catch (err) {
        reject(err);
      }
    });
  });
}

async function deployGooglePlay({ track, name, notes, aab }) {
  const { version } = readLocalAppMeta();
  const releaseName = name || getDefaultReleaseName(version);
  const releaseNotes = notes || getDefaultReleaseNotes(version);

  console.log(`\n🚀 Google Play Store (${track}) Yükleme Başlıyor...`);
  if (!fs.existsSync(aab)) {
    throw new Error(`AAB dosyası bulunamadı: ${aab}`);
  }

  const { token } = await getGoogleAccessToken();
  const baseUrl = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${GOOGLE_PACKAGE_NAME}`;
  const uploadBaseUrl = `https://androidpublisher.googleapis.com/upload/androidpublisher/v3/applications/${GOOGLE_PACKAGE_NAME}`;

  console.log('  1. Edit oturumu açılıyor...');
  const editRes = await httpRequest(`${baseUrl}/edits`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
  });
  if (editRes.statusCode !== 200 || !editRes.data?.id) {
    throw new Error(`Google Play edit açılamadı (${editRes.statusCode}): ${editRes.rawString}`);
  }
  const editId = editRes.data.id;
  console.log(`  ✓ Edit ID: ${editId}`);

  try {
    const aabBuffer = fs.readFileSync(aab);
    console.log(`  2. AAB yükleniyor (${formatSize(aabBuffer.length)})...`);
    const uploadRes = await httpRequest(
      `${uploadBaseUrl}/edits/${editId}/bundles?uploadType=media`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/octet-stream'
        }
      },
      aabBuffer
    );

    if (uploadRes.statusCode !== 200 || !uploadRes.data?.versionCode) {
      throw new Error(`AAB yükleme başarısız (${uploadRes.statusCode}): ${uploadRes.rawString}`);
    }
    const uploadedVersionCode = uploadRes.data.versionCode;
    console.log(`  ✓ Paket yüklendi! versionCode: ${uploadedVersionCode}`);

    console.log(`  3. "${track}" kanalı güncelleniyor (${releaseName})...`);
    const trackPayload = JSON.stringify({
      track,
      releases: [{
        name: releaseName,
        versionCodes: [String(uploadedVersionCode)],
        status: 'completed',
        releaseNotes: [{ language: 'tr-TR', text: releaseNotes }]
      }]
    });

    const trackRes = await httpRequest(
      `${baseUrl}/edits/${editId}/tracks/${track}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      },
      Buffer.from(trackPayload)
    );

    if (trackRes.statusCode !== 200) {
      throw new Error(`Track güncellenemedi (${trackRes.statusCode}): ${trackRes.rawString}`);
    }
    console.log(`  ✓ "${track}" kanalı güncellendi.`);

    console.log('  4. Değişiklikler onaylanıyor (commit)...');
    const commitRes = await httpRequest(`${baseUrl}/edits/${editId}:commit`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
    });

    if (commitRes.statusCode !== 200) {
      throw new Error(`Commit başarısız (${commitRes.statusCode}): ${commitRes.rawString}`);
    }
    console.log(`\n🎉 Google Play Store (${track}) yayını BAŞARILI! (versionCode: ${uploadedVersionCode})`);
  } catch (err) {
    await httpRequest(`${baseUrl}/edits/${editId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    }).catch(() => {});
    throw err;
  }
}

async function main() {
  const opts = parseCliArgs();
  if (opts.command === 'status') {
    await checkStatus();
  } else if (opts.command === 'bump') {
    bumpVersions();
  } else if (opts.command === 'build') {
    if (opts.bump) bumpVersions();
    await runAndroidBuild(opts);
  } else if (opts.command === 'deploy') {
    await deployGooglePlay(opts);
  } else if (opts.command === 'release') {
    if (opts.bump) bumpVersions();
    await runAndroidBuild(opts);
    await deployGooglePlay(opts);
  } else {
    console.log('Kullanım:');
    console.log('  node scripts/deploy-google-play.mjs status');
    console.log('  node scripts/deploy-google-play.mjs bump');
    console.log('  node scripts/deploy-google-play.mjs build [--bump] [--aab-only]');
    console.log('  node scripts/deploy-google-play.mjs deploy [--track=alpha|internal|beta|production] [--name="..."] [--notes="..."]');
    console.log('  node scripts/deploy-google-play.mjs release [--bump] [--aab-only] [--track=alpha|internal|beta|production]');
  }
}

main().catch((err) => {
  console.error(`\n❌ Hata: ${err.message}`);
  process.exit(1);
});
