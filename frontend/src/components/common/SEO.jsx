import { useEffect } from 'react';

/**
 * Dynamic SEO Component for Client-Side Head Management
 * Ensures each route properly manages:
 * - document.title
 * - meta description
 * - canonical URL
 * - meta robots (index/noindex)
 * - Open Graph and Twitter tags
 */
export default function SEO({
  title = 'Secure Team – Secure Collaboration and Team Management Platform',
  description = 'Secure Team is a collaboration platform designed to help teams communicate, organize projects, manage collaboration, and work together securely.',
  canonicalUrl = 'https://secure-team.vercel.app/',
  noindex = false,
  ogType = 'website',
  ogImage = 'https://secure-team.vercel.app/logo-full.svg',
}) {
  useEffect(() => {
    // 1. Update Title
    if (title) {
      document.title = title;
    }

    // Helper: update or create meta tag by name
    const setMetaByName = (name, content) => {
      let el = document.querySelector(`meta[name="${name}"]`);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute('name', name);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    // Helper: update or create meta tag by property (Open Graph)
    const setMetaByProperty = (property, content) => {
      let el = document.querySelector(`meta[property="${property}"]`);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute('property', property);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    // 2. Robots Directive
    if (noindex) {
      setMetaByName('robots', 'noindex, nofollow');
    } else {
      setMetaByName('robots', 'index, follow');
    }

    // 3. Description
    if (description) {
      setMetaByName('description', description);
      setMetaByProperty('og:description', description);
      setMetaByName('twitter:description', description);
    }

    // 4. Canonical URL
    if (canonicalUrl) {
      let linkCanonical = document.querySelector('link[rel="canonical"]');
      if (!linkCanonical) {
        linkCanonical = document.createElement('link');
        linkCanonical.setAttribute('rel', 'canonical');
        document.head.appendChild(linkCanonical);
      }
      linkCanonical.setAttribute('href', canonicalUrl);
      setMetaByProperty('og:url', canonicalUrl);
      setMetaByName('twitter:url', canonicalUrl);
    }

    // 5. Titles
    if (title) {
      setMetaByName('title', title);
      setMetaByProperty('og:title', title);
      setMetaByName('twitter:title', title);
    }

    // 6. Type & Image
    setMetaByProperty('og:type', ogType);
    if (ogImage) {
      setMetaByProperty('og:image', ogImage);
      setMetaByName('twitter:image', ogImage);
    }
  }, [title, description, canonicalUrl, noindex, ogType, ogImage]);

  return null;
}
