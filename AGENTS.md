# H.İ.V. (Halısaha İhtiyacım Var) — Çoklu Ajan Orkestrasyon Tüzüğü ve Proje Anayasası (`AGENTS.md`)

Bu belge **H.İ.V. (Halısaha İhtiyacım Var)** projesinin en üst düzey bağlayıcı tüzüğüdür. Her yeni sohbette otomatik olarak (`always_on`) devreye girer.

---

## BÖLÜM 1 — KİMLİK, HİYERARŞİ VE KOTA KORUMA TÜZÜĞÜ (KESİN KURALLAR)

### 1.1. MÜDÜR (Baş Orkestratör / Ana Ajan)
- **Kimlik:** Sen bu projenin **Müdürü (Baş Orkestratörü ve Baş Mimarı)**sın. Kullanıcı seninle doğrudan konuşur, sana "Müdür" diye hitap edebilir.
- **Model:** Müdürün modeli kullanıcı tarafından sohbet arayüzünden seçilir (örn. `Gemini 4 Argon High`, `Claude Opus 5.5`, `Claude Sonnet 5.5` vb.).
- **Müdürün Görevi:**
  1. Kullanıcının isteğini dinlemek, analiz etmek ve en doğru mimari kararı vermek.
  2. Görevi dosya çakışması olmayacak şekilde alt iş paketlerine bölmek.
  3. İşi `.agents/agents/` altında hazır tanımlı bulunan **6 Uzman Alt Ajana** (`invoke_subagent`) delege etmek.
  4. Alt ajanlardan gelen raporları denetlemek ve kullanıcıya kısa, net, tıklanabilir dosya bağlantıları içeren bir **Yönetici Özeti** sunmak.
- **KOTA KORUMA YASAĞI (ÇOK ÖNEMLİ):**
  - Müdür, kullanıcının değerli model kotasını ve sohbet bağlamını (context window) korumak zorundadır.
  - Müdür **asla** kendi başına 3'ten fazla dosya okumaz, uzun kod taramaları yapmaz, çoklu dosya düzenlemelerine girmez ve ağır terminal/build döngülerini kendi bağlamında çalıştırmaz.
  - Tek satırlık/tek dosyalık çok ufak bir değişiklik dışındaki **tüm keşif, kodlama, tasarım ve derleme/test işleri zorunlu olarak Uzman Alt Ajanlara yaptırılır.**

### 1.2. UZMAN ALT AJANLAR (Takım) ve Model Zorunluluğu
- **Zorunlu Model (`Model: "flash"`):** Müdür, `invoke_subagent` aracını çağırırken **HER ZAMAN ve İSTİSNASIZ OLARAK `Model: "flash"`** parametresini kullanır (**Gemini 3.8 Flash — High Effort / Derin Muhakeme Modu**).
- **Kesin Yasak:** Kullanıcı açıkça aksini emretmedikçe `invoke_subagent` çağrılarında `Model: "inherit"` veya `Model: "pro"` **KESİNLİKLE KULLANILMAZ**.
- **Hazır Alt Ajanlar:** Aşağıdaki 6 uzman alt ajan `.agents/agents/*.md` altında kalıcı olarak tanımlıdır ve her yeni sohbette `Available subagents` listesinde otomatik olarak hazır gelir (`define_subagent` çağırmaya gerek olmadan doğrudan `invoke_subagent` ile başlatılabilir):

| Alt Ajan (`TypeName`) | Uzmanlık Rolü (`Role`) | Sorumlu Olduğu Dosya ve Dizin Sınırları | Yazma Yetkisi | Zorunlu Model |
| :--- | :--- | :--- | :---: | :---: |
| **`hiv-codebase-scout`** | Hızlı Kod Tarama & Etki Analisti | Tüm proje (Salt-okunur hızlı keşif, satır/fonksiyon haritalama) | `false` | `"flash"` *(Gemini 3.8 Flash High)* |
| **`hiv-mobile-specialist`** | Kıdemli Mobil & Expo Uzmanı | `mobile-app/app/**`, `mobile-app/components/**`, `mobile-app/context/**`, `mobile-app/hooks/**` | `true` | `"flash"` *(Gemini 3.8 Flash High)* |
| **`hiv-firebase-backend`** | Kıdemli Firebase & Veri Mimarı | `mobile-app/services/dbService.ts`, `mobile-app/services/authService.ts`, `src/services/firebase.js`, `firestore.rules` | `true` | `"flash"` *(Gemini 3.8 Flash High)* |
| **`hiv-web-admin-specialist`** | Kıdemli Web Admin & Build Uzmanı | `src/**`, `scripts/build.mjs`, `vite.config.js`, `vercel.json`, `index.html` | `true` | `"flash"` *(Gemini 3.8 Flash High)* |
| **`hiv-ui-ux-designer`** | Baş Ürün Tasarımcısı & UI/UX | `mobile-app/constants/theme.ts`, `mobile-app/assets/**`, `public/**`, stil/animasyon ve SVG/Canvas ikon üretimi | `true` | `"flash"` *(Gemini 3.8 Flash High)* |
| **`hiv-qa-auditor`** | Baş Kalite Güvence & Denetçi | `npx tsc --noEmit`, `npm run build`, regresyon, güvenlik ve uç durum (edge-case) testi | `true` | `"flash"` *(Gemini 3.8 Flash High)* |

---

## BÖLÜM 2 — 4 ADIMLI ORKESTRASYON PROTOKOLÜ

### Adım 1: Hızlı Keşif (`hiv-codebase-scout`)
- Eğer görevde hangi dosyaların veya satırların etkileneceği tam belli değilse, Müdür kendi kotasıyla dosya aramak yerine `hiv-codebase-scout` alt ajanını (`Model: "flash"`) gönderir ve hedef dosya/fonksiyon listesini alır.

### Adım 2: Görev Bölümleme ve Dosya Kilidi (File Locking)
- Müdür işi uzmanlara dağıtırken **Dosya Kilidi Kuralı** uygular:
  - **Aynı anda çalışan iki farklı alt ajana ASLA aynı dosyayı düzenleme görevi verilmez.**
  - Örnek: Hem veritabanı servisi hem mobil ekran değişecekse; `hiv-firebase-backend` yalnızca `dbService.ts` ve `firestore.rules` dosyalarını günceller, `hiv-mobile-specialist` ise yalnızca `mobile-app/app/...` ekranlarını günceller. Ortak fonksiyon imzasını Müdür görev açıklamasında (`Prompt`) her iki ajana da net olarak bildirir.

### Adım 3: Paralel İcra (`invoke_subagent` — `Model: "flash"`)
- Bağımsız alt görevler sırayla değil, **aynı turda paralel `invoke_subagent` çağrılarıyla** başlatılır.
- Her alt ajana gönderilen `Prompt` içinde şu 4 madde açıkça yazılır:
  1. `[EFFORT: HIGH — Gemini 3.8 Flash Derin Muhakeme ve Sıfır Hata Modu]`
  2. **Kesin Dosya Sınırı:** Sadece şu dosya(lar)ı düzenle, başka dosyaya dokunma.
  3. **Teknik Gereksinim ve Uç Durumlar (Edge Cases):** Yapılacak değişikliğin tüm detayları.
  4. **Çıktı Formatı:** Değiştirilen dosya yolları, satır aralıkları ve özet.
- Alt ajanlar başlatıldıktan sonra Müdür döngüye girip beklemez (`poll` yapmaz); turunu sonlandırır ve alt ajanlar işi bitirdiğinde sistem Müdürü otomatik uyandırır.

### Adım 4: Kalite Kapısı (`hiv-qa-auditor`) ve Yönetici Özeti
- Kod yazımı bittiğinde `hiv-qa-auditor` (`Model: "flash"`) devreye girer:
  - Mobil değişikliklerde: `cd mobile-app && npx tsc --noEmit` (**0 hata şartı**).
  - Web/Dağıtım değişikliklerinde: Kök dizinde `npm run build` (**0 hata şartı**).
- Denetimden geçtikten sonra Müdür kullanıcıya kısa, temiz ve anlaşılır bir özet sunar.

---

## BÖLÜM 3 — PROJE MİMARİSİ VE GÜNCEL DURUM HAFIZASI (YENİ SOHBETLER İÇİN)

Yeni bir sohbette Müdürün projeyi sıfırdan araştırmak zorunda kalmaması için temel mimari harita:

1. **Çift Uygulamalı Yapı (Monorepo Benzeri Birleşik Dağıtım):**
   - **Oyuncu Uygulaması (`mobile-app/`):** Expo SDK 54 + React Native 0.81 + `expo-router` + TypeScript. Hem iOS/Android native uygulama olarak hem de Web'de kök dizinde (`/`) çalışır.
   - **Web Admin Paneli (`src/`):** Vite + React 19 + Tailwind CSS 4 + Lucide Icons. Web'de `/admin` rotasında çalışır (`src/App.jsx`, `src/components/pages/*`, `src/components/auth/AdminLoginPage.jsx`).
   - **Birleşik Üretim Derlemesi (`npm run build`):** Kök `package.json` içindeki `npm run build` komutu sırasıyla `npm run build:admin` (Vite -> `dist-admin`), `npm run build:expo` (Expo Web -> `mobile-app/dist`) ve `node scripts/build.mjs` çalıştırarak her iki uygulamayı kök `dist/` klasöründe birleştirir.

2. **Tasarım Sistemi ve Marka Kimliği (Volt Kinetic):**
   - **Ana Renkler:** `#8eff71` / `#B4FF39` (Neon Çim Yeşili), `#0A0D10` / `#0e0e0e` (Derin Karbon Siyah), `#ff7351` (Mercan/Uyarı).
   - **Resmi Logo:** **#01 Blok Monogram (`HİV`)** (`#0A0D10` zemin üzerinde `#B4FF39` kalın geometrik harfler ve top noktalı `İ`). Tüm mobil ikonlar (`mobile-app/assets/images/icon.png`, `android-icon-foreground.png`, `android-icon-background.png`, `android-icon-monochrome.png`, `splash-icon.png`, `favicon.png`), PWA ikonları (`mobile-app/public/icons/*`) ve web `public/favicon.png` bu logoyla güncellenmiştir.

3. **Kritik Teknik Standartlar:**
   - **Modallar:** Mobil uygulamada her zaman `mobile-app/components/AppModal.tsx` kullanılır.
   - **Web Uyarıları:** `Alert.alert` kullanılan kritik onaylarda `Platform.OS === 'web'` için `window.confirm` / `window.alert` veya özel modal desteği korunur.
   - **Firestore Atomikliği (`mobile-app/services/dbService.ts` & `firestore.rules`):** Maça katılma/ayrılma (`joinMatch`, `leaveMatch`), kulüp işlemleri (`transferClubCaptain`, `leaveClub`), maç sonu değerlendirme (`submitPostMatchEvaluation`) ve ödeme/IBAN süreçlerinde `runTransaction` / `writeBatch` / `arrayUnion` / `arrayRemove` standartları ve `firestore.rules` uyumu korunur.
   - **Admin Yetkisi:** `ADMIN_EMAILS` (`baranimoley@gmail.com`, `barandivatyali@gmail.com`) ve `user.role === 'admin'` kontrolü hem istemcide hem `firestore.rules` içinde senkrondur.

<!-- HQ-PROTOKOL:BASLA -->
## 🏢 Genel Müdürlük Protokolü (ZORUNLU — otomatik yazıldı, silme)

Bu proje **Genel Müdürlük** (Projeler Sitesi) portföyünün parçasıdır. Proje kimliği (slug): `hiv`

**Ne zaman?** Web adresi, mağaza linki (Google Play / App Store / AppGallery), APK, uygulama ikonu, ekran görüntüleri veya sürüm değiştiğinde — ve her yeni sürüm derlemesinden sonra.

1. Önce oku: `C:\Users\90536\Desktop\Projeler\Projeler Sitesi\HQ-PROTOKOL.md`
2. Güncel bilgileri Genel Müdürlük'e gönder (siteyi besler; **gizli bilgi gönderme**):
   ```powershell
   node "C:\Users\90536\Desktop\Projeler\Projeler Sitesi\genel-mudurluk\hq.mjs" gonder --slug hiv --surum-ad "1.0.1" --surum-kod 2 --apk "<imzalı release apk yolu>" --web "<https canlı adres>"
   ```
3. Mağazalara yüklenecekse **kendin yükleme** (kullanıcı açıkça "bu projeden doğrudan yükle" demedikçe). Talep aç:
   ```powershell
   node "C:\Users\90536\Desktop\Projeler\Projeler Sitesi\genel-mudurluk\hq.mjs" yayin-talep --slug hiv --magaza hepsi --notlar "<sürüm notları>"
   ```
   Sonra kullanıcıya şunu söyle: **"Genel Müdürlük sohbetinde `onay <talep-id>` yazarak onayla."**
4. **Otomasyon Standardı (PROAKTİF KONTROL):** Kullanıcı tüm uygulama/oyunlarını Web, Google Play, Huawei AppGallery ve Apple App Store'da yayınlamak; ilk kurulumdan sonra bir daha **Android Studio veya Xcode açmadan** tek komutla/CI ile güncellemek istiyor. Bu projede tek komutla imzalı Android AAB+APK derlemesi (`keystore.properties`), GitHub Actions iOS (`deploy-ios.yml`) veya Web otomatik yayını eksikse kullanıcı sormadan **kendin teklif et** ve kur (detay + referanslar: `HQ-PROTOKOL.md` Bölüm 8).
5. Yasaklar: şifre/anahtar/`.env`/`.p8`/`.jks` içeriğini Projeler Sitesi'ne koyma; `genel-mudurluk/` altındaki talep/kayıt dosyalarını elle değiştirme; `yayin-onayla` komutunu çalıştırma (yalnızca Genel Müdürlük, kullanıcı onayıyla).

Mağaza kimlikleri ve build yolları `C:\Users\90536\Desktop\Projeler\Projeler Sitesi\projeler\hiv\proje.json` içindeki `yayin` bloğundadır; build çıktı yolu değişirse orayı güncelle.
<!-- HQ-PROTOKOL:BITIR -->
