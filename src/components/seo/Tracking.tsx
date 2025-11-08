import { Helmet } from 'react-helmet-async';
import { useSiteSetting } from '@/hooks/useSiteSettings';

export const Tracking = () => {
  const { data: gaId } = useSiteSetting('analytics_google_id');
  const { data: gtmId } = useSiteSetting('analytics_gtm_id');
  const { data: fbPixel } = useSiteSetting('tracking_facebook_pixel');
  const { data: googleVerify } = useSiteSetting('tracking_google_verify');
  const { data: bingVerify } = useSiteSetting('tracking_bing_verify');

  return (
    <Helmet>
      {/* Google Analytics 4 */}
      {gaId && (
        <>
          <script async src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} />
          <script>
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${gaId}');
            `}
          </script>
        </>
      )}

      {/* Google Tag Manager */}
      {gtmId && (
        <>
          <script>
            {`
              (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
              new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
              j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
              'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
              })(window,document,'script','dataLayer','${gtmId}');
            `}
          </script>
        </>
      )}

      {/* Facebook Pixel */}
      {fbPixel && (
        <script>
          {`
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${fbPixel}');
            fbq('track', 'PageView');
          `}
        </script>
      )}

      {/* Search Console Verification */}
      {googleVerify && (
        <meta name="google-site-verification" content={googleVerify} />
      )}

      {/* Bing Webmaster Verification */}
      {bingVerify && (
        <meta name="msvalidate.01" content={bingVerify} />
      )}
    </Helmet>
  );
};
