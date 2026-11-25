---
name: hiv-orchestration
description: >-
  H.İ.V. (Halısaha İhtiyacım Var) projesi için Çoklu Ajan Orkestrasyon (Müdür +
  Gemini 3.8 Flash High alt ajanlar) kurulum ve çalıştırma kılavuzu. Çok adımlı
  geliştirme, kapsamlı denetim, yeni özellik ekleme veya paralel hata düzeltme
  görevlerinde bu yeteneği etkinleştirin.
---

# H.İ.V. Çoklu Ajan Orkestrasyon Kılavuzu

Bu yetenek (skill), **Müdür (Ana Ajan)** liderliğinde **Gemini 3.8 Flash (High Effort)** modelini kullanan 6 uzman alt ajanın (`hiv-mobile-specialist`, `hiv-firebase-backend`, `hiv-web-admin-specialist`, `hiv-ui-ux-designer`, `hiv-qa-auditor`, `hiv-codebase-scout`) nasıl tanımlanacağını ve paralel koordine edileceğini belirler.

## 1. Alt Ajanları Hızlı Tanımlama (`define_subagent`)

Mevcut konuşmada uzman alt ajanlar henüz tanımlanmamışsa, görev kapsamına göre aşağıdaki tanımları kullanın:

- **`hiv-codebase-scout`** (`EnableWriteTools: false`): Hızlı kod tarama ve bağımlılık analizi.
- **`hiv-mobile-specialist`** (`EnableWriteTools: true`, `EnableMCPTools: true`): `mobile-app/app/**`, `mobile-app/components/**`, `mobile-app/context/**`, `mobile-app/hooks/**`.
- **`hiv-firebase-backend`** (`EnableWriteTools: true`, `EnableMCPTools: true`): `mobile-app/services/**`, `src/services/firebase.js`, `firestore.rules`.
- **`hiv-web-admin-specialist`** (`EnableWriteTools: true`, `EnableMCPTools: true`): `src/**`, `scripts/combine-builds.cjs`, `vercel.json`, `vite.config.js`.
- **`hiv-ui-ux-designer`** (`EnableWriteTools: true`, `EnableMCPTools: true`): `mobile-app/constants/theme.ts`, `mobile-app/assets/**`, `public/**`, UI/UX ve ikon/SVG tasarımı.
- **`hiv-qa-auditor`** (`EnableWriteTools: true`, `EnableMCPTools: true`): `npx tsc --noEmit` ve `npm run build` doğrulaması, regresyon ve uç durum denetimi.

## 2. Alt Ajan Çağırma Standardı (`invoke_subagent`)

Her `invoke_subagent` çağrısında:
1. **`Model: "flash"`** parametresini **zorunlu olarak** geçin (bu parametre alt ajanı **Gemini 3.8 Flash** modelinde çalıştırır ve Müdür'ün model kotasını korur).
2. **`Prompt`** metninin başına şu başlığı ekleyin:
   ```text
   [MODE: GEMINI 3.8 FLASH — HIGH EFFORT / DERİN MUHAKEME]
   Görev Kapsamı: ...
   Düzenlenecek Dosyalar (Sadece bu dosyalara dokun): ...
   Doğrulama Kriteri: ...
   ```

## 3. Paralel Görev Dağıtım Kuralları

- **Dosya Çakışması Yasağı:** Aynı anda çalışan iki alt ajana asla aynı dosyayı düzenletmeyin.
  - Eğer hem `dbService.ts` hem de `match-room/[id].tsx` değişecekse:
    - `hiv-firebase-backend` -> `mobile-app/services/dbService.ts` ve `firestore.rules` (Yeni servis fonksiyonunun imzasını Müdür önceden belirler).
    - `hiv-mobile-specialist` -> `mobile-app/app/match-room/[id].tsx` (Belirlenen fonksiyon imzasını kullanarak UI bağlantısını yapar).
- **Son Kalite Kapısı:** Paralel çalışan uzmanlar işini bitirdiğinde `hiv-qa-auditor` (veya doğrudan Müdür) `npx tsc --noEmit` çalıştırarak entegrasyonu doğrular.
