import { ScrollViewStyleReset } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="tr">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <meta name="theme-color" content="#0A0D10" />
        <title>H.İ.V. Halısaha — Maç Bul, Kadronu Kur, Sahaya Çık</title>
        <ScrollViewStyleReset />
        <style
          dangerouslySetInnerHTML={{
            __html: `
              html, body {
                background-color: #0A0D10;
              }
            `,
          }}
        />
      </head>
      <body style={{ backgroundColor: '#0A0D10' }}>{children}</body>
    </html>
  );
}
