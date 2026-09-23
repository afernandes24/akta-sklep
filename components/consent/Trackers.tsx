'use client';

import { usePathname } from 'next/navigation';
import Script from 'next/script';
import { useEffect, useRef, useState } from 'react';
import { CONSENT_EVENT, type Consent, GA_ID, PIXEL_ID, readConsent } from '@/lib/consent';

/** Ładuje Google Analytics i Piksel Meta WYŁĄCZNIE po wyrażeniu zgody. */
export function Trackers() {
  const [consent, setConsent] = useState<Consent | null>(null);
  const pathname = usePathname();
  const firstPixelView = useRef(true);

  useEffect(() => {
    setConsent(readConsent());
    const onChange = (e: Event) => setConsent((e as CustomEvent<Consent>).detail);
    window.addEventListener(CONSENT_EVENT, onChange);
    return () => window.removeEventListener(CONSENT_EVENT, onChange);
  }, []);

  // PageView Piksela przy zmianie podstrony (GA4 robi to sam — „enhanced measurement”)
  useEffect(() => {
    if (!consent?.marketing || !PIXEL_ID) return;
    if (firstPixelView.current) {
      firstPixelView.current = false;
      return;
    }
    (window as unknown as { fbq?: (...a: unknown[]) => void }).fbq?.('track', 'PageView');
  }, [pathname, consent?.marketing]);

  return (
    <>
      {consent?.analytics && GA_ID && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
          <Script id="ga-init" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}window.gtag=gtag;
gtag('consent','default',{ad_storage:'${consent.marketing ? 'granted' : 'denied'}',ad_user_data:'${consent.marketing ? 'granted' : 'denied'}',ad_personalization:'${consent.marketing ? 'granted' : 'denied'}',analytics_storage:'granted'});
gtag('js',new Date());gtag('config','${GA_ID}');`}
          </Script>
        </>
      )}
      {consent?.marketing && PIXEL_ID && (
        <Script id="meta-pixel" strategy="afterInteractive">
          {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
fbq('init','${PIXEL_ID}');fbq('track','PageView');`}
        </Script>
      )}
    </>
  );
}
