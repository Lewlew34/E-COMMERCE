import { useEffect } from 'react';

export interface PageMetaOptions {
  title?: string;
  description?: string;
  keywords?: string;
  canonical?: string;
  image?: string;
  type?: 'website' | 'article' | 'product';
  url?: string;
  price?: number;
  currency?: string;
  availability?: string;
  jsonLd?: Record<string, unknown>;
}

export function usePageMeta(meta: PageMetaOptions) {
  useEffect(() => {
    // 1. Tiêu đề trang (Document Title)
    if (meta.title) {
      document.title = meta.title.includes('LHK Tech') 
        ? meta.title 
        : `${meta.title} | LHK Tech - Sàn Công Nghệ`;
    }

    // Helper tạo hoặc cập nhật thẻ <meta>
    const setMetaTag = (attrName: 'name' | 'property', attrValue: string, content?: string) => {
      if (!content) return;
      let el = document.querySelector(`meta[${attrName}="${attrValue}"]`) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attrName, attrValue);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    // Helper tạo hoặc cập nhật thẻ <link>
    const setLinkTag = (rel: string, href?: string) => {
      if (!href) return;
      let el = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
      if (!el) {
        el = document.createElement('link');
        el.setAttribute('rel', rel);
        document.head.appendChild(el);
      }
      el.setAttribute('href', href);
    };

    // 2. Thẻ Meta Description & Keywords
    if (meta.description) {
      // Giới hạn mô tả SEO tối ưu trong khoảng 150 - 160 ký tự cho Google & Facebook
      const cleanDesc = meta.description.replace(/<[^>]*>?/gm, '').trim();
      setMetaTag('name', 'description', cleanDesc);
    }
    if (meta.keywords) {
      setMetaTag('name', 'keywords', meta.keywords);
    }

    // 3. Thẻ Canonical URL (Rất quan trọng cho SEO tránh trùng lặp nội dung)
    const canonicalUrl = meta.canonical || meta.url || window.location.href.split('?')[0];
    setLinkTag('canonical', canonicalUrl);

    // 4. Chuẩn hóa URL ảnh OpenGraph tuyệt đối (https://...)
    let absoluteImageUrl = meta.image;
    if (absoluteImageUrl && !absoluteImageUrl.startsWith('http')) {
      absoluteImageUrl = `${window.location.origin}${absoluteImageUrl.startsWith('/') ? '' : '/'}${absoluteImageUrl}`;
    }

    // 5. Thẻ Open Graph (Chia sẻ Facebook, Zalo, LinkedIn, Skype)
    const ogTitle = meta.title ? `${meta.title} | LHK Tech` : 'LHK Tech - Sàn Thương Mại Điện Tử Đồ Công Nghệ';
    const ogDesc = meta.description ? meta.description.replace(/<[^>]*>?/gm, '').trim() : '';

    setMetaTag('property', 'og:type', meta.type || 'product');
    setMetaTag('property', 'og:site_name', 'LHK Tech');
    setMetaTag('property', 'og:title', ogTitle);
    setMetaTag('property', 'og:description', ogDesc);
    setMetaTag('property', 'og:url', canonicalUrl);

    if (absoluteImageUrl) {
      setMetaTag('property', 'og:image', absoluteImageUrl);
      setMetaTag('property', 'og:image:secure_url', absoluteImageUrl);
      setMetaTag('property', 'og:image:alt', meta.title || 'LHK Tech Product');
      setMetaTag('property', 'og:image:width', '1200');
      setMetaTag('property', 'og:image:height', '630');
    }

    // Nếu là sản phẩm, thêm các thẻ OpenGraph bổ trợ e-commerce
    if (meta.type === 'product' && meta.price) {
      setMetaTag('property', 'product:price:amount', String(meta.price));
      setMetaTag('property', 'product:price:currency', meta.currency || 'VND');
      if (meta.availability) {
        setMetaTag('property', 'product:availability', meta.availability);
      }
    }

    // 6. Thẻ Twitter Card
    setMetaTag('name', 'twitter:card', 'summary_large_image');
    setMetaTag('name', 'twitter:title', ogTitle);
    setMetaTag('name', 'twitter:description', ogDesc);
    if (absoluteImageUrl) {
      setMetaTag('name', 'twitter:image', absoluteImageUrl);
    }

    // 7. Structured Data (JSON-LD Schema.org)
    const jsonLdData = meta.jsonLd || (meta.type === 'product' && meta.title ? {
      '@context': 'https://schema.org/',
      '@type': 'Product',
      name: meta.title,
      image: absoluteImageUrl ? [absoluteImageUrl] : [],
      description: ogDesc,
      offers: {
        '@type': 'Offer',
        url: canonicalUrl,
        priceCurrency: meta.currency || 'VND',
        price: meta.price || 0,
        availability: meta.availability === 'in stock' ? 'https://schema.org/InStock' : 'https://schema.org/InStock'
      }
    } : null);

    if (jsonLdData) {
      let script = document.getElementById('page-jsonld-schema') as HTMLScriptElement | null;
      if (!script) {
        script = document.createElement('script');
        script.id = 'page-jsonld-schema';
        script.type = 'application/ld+json';
        document.head.appendChild(script);
      }
      script.text = JSON.stringify(jsonLdData);
    }
  }, [
    meta.title,
    meta.description,
    meta.keywords,
    meta.canonical,
    meta.image,
    meta.type,
    meta.url,
    meta.price,
    meta.currency,
    meta.availability,
    meta.jsonLd
  ]);
}
