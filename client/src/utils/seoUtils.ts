/**
 * SEO Utility Service
 * 
 * Provides utilities for managing SEO meta tags, structured data,
 * and other SEO-related functionality dynamically in the React app.
 * 
 * @module SEOUtils
 */

import { useEffect } from 'react';

export interface SEOMetaData {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'product';
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
}

export interface StructuredData {
  '@context': string;
  '@type': string;
  [key: string]: any;
}

/**
 * SEO Utility Class
 * 
 * Static methods for managing SEO meta tags and structured data
 * dynamically throughout the application lifecycle.
 */
export class SEOUtils {
  private static readonly DEFAULT_TITLE = 'PagePersonAI - Transform Web Content with AI-Powered Personas';
  private static readonly DEFAULT_DESCRIPTION = 'Transform any webpage into engaging content with AI-powered personas. Convert articles into Hemingway-style prose, medieval knight tales, ELI5 explanations, and more.';
  private static readonly DEFAULT_IMAGE = '/og-image.png';
  private static readonly SITE_URL = import.meta.env.VITE_SITE_URL || 'https://pagepersonai.com';

  /**
   * Update page meta tags dynamically
   * 
   * @param metadata - SEO metadata to update
   */
  static updateMetaTags(metadata: SEOMetaData): void {
    const {
      title = this.DEFAULT_TITLE,
      description = this.DEFAULT_DESCRIPTION,
      keywords,
      image = this.DEFAULT_IMAGE,
      url,
      type = 'website',
      author,
      publishedTime,
      modifiedTime
    } = metadata;

    // Update document title
    document.title = title;

    // Update or create meta tags
    this.setMetaTag('description', description);
    if (keywords) this.setMetaTag('keywords', keywords);
    if (author) this.setMetaTag('author', author);

    // Open Graph tags
    this.setMetaProperty('og:title', title);
    this.setMetaProperty('og:description', description);
    this.setMetaProperty('og:image', this.getFullUrl(image));
    this.setMetaProperty('og:type', type);
    if (url) this.setMetaProperty('og:url', this.getFullUrl(url));
    if (publishedTime) this.setMetaProperty('article:published_time', publishedTime);
    if (modifiedTime) this.setMetaProperty('article:modified_time', modifiedTime);

    // Twitter Card tags
    this.setMetaName('twitter:title', title);
    this.setMetaName('twitter:description', description);
    this.setMetaName('twitter:image', this.getFullUrl(image));

    // Update canonical URL
    if (url) this.updateCanonicalUrl(url);
  }

  /**
   * Add structured data (JSON-LD) to the page
   * 
   * @param data - Structured data object
   * @param id - Optional ID for the script tag
   */
  static addStructuredData(data: StructuredData, id?: string): void {
    // Remove existing structured data with the same ID
    if (id) {
      const existing = document.getElementById(id);
      if (existing) existing.remove();
    }

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    if (id) script.id = id;
    script.textContent = JSON.stringify(data);
    document.head.appendChild(script);
  }

  /**
   * Create breadcrumb structured data
   * 
   * @param breadcrumbs - Array of breadcrumb items
   */
  static addBreadcrumbStructuredData(breadcrumbs: Array<{ name: string; url: string }>): void {
    const breadcrumbData: StructuredData = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: breadcrumbs.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: item.name,
        item: this.getFullUrl(item.url)
      }))
    };

    this.addStructuredData(breadcrumbData, 'breadcrumb-schema');
  }

  /**
   * Create FAQ structured data
   * 
   * @param faqs - Array of FAQ items
   */
  static addFAQStructuredData(faqs: Array<{ question: string; answer: string }>): void {
    const faqData: StructuredData = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqs.map(faq => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: faq.answer
        }
      }))
    };

    this.addStructuredData(faqData, 'faq-schema');
  }

  /**
   * Create How-To structured data
   * 
   * @param name - Name of the how-to guide
   * @param description - Description of the guide
   * @param steps - Array of steps
   */
  static addHowToStructuredData(
    name: string,
    description: string,
    steps: Array<{ name: string; text: string; image?: string }>
  ): void {
    const howToData: StructuredData = {
      '@context': 'https://schema.org',
      '@type': 'HowTo',
      name,
      description,
      step: steps.map(step => ({
        '@type': 'HowToStep',
        name: step.name,
        text: step.text,
        ...(step.image && { image: this.getFullUrl(step.image) })
      }))
    };

    this.addStructuredData(howToData, 'howto-schema');
  }

  /**
   * Generate meta tags for persona-specific content
   * 
   * @param personaName - Name of the persona
   * @param originalTitle - Original content title
   */
  static getPersonaMetadata(personaName: string, originalTitle: string): SEOMetaData {
    return {
      title: `${originalTitle} - Transformed by ${personaName} | PagePersonAI`,
      description: `See how "${originalTitle}" sounds when rewritten in the style of ${personaName}. Transform any content with AI-powered personas on PagePersonAI.`,
      keywords: `${personaName}, AI content transformation, ${originalTitle}, persona writing, content rewriter`,
      type: 'article'
    };
  }

  /**
   * Generate meta tags for tool/feature pages
   * 
   * @param toolName - Name of the tool or feature
   * @param toolDescription - Description of the tool
   */
  static getToolMetadata(toolName: string, toolDescription: string): SEOMetaData {
    return {
      title: `${toolName} - PagePersonAI`,
      description: toolDescription,
      keywords: `${toolName}, AI tools, content transformation, PagePersonAI`,
      type: 'website'
    };
  }

  // Private helper methods

  private static setMetaTag(name: string, content: string): void {
    let meta = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement;
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = name;
      document.head.appendChild(meta);
    }
    meta.content = content;
  }

  private static setMetaProperty(property: string, content: string): void {
    let meta = document.querySelector(`meta[property="${property}"]`) as HTMLMetaElement;
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('property', property);
      document.head.appendChild(meta);
    }
    meta.content = content;
  }

  private static setMetaName(name: string, content: string): void {
    let meta = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement;
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = name;
      document.head.appendChild(meta);
    }
    meta.content = content;
  }

  private static updateCanonicalUrl(url: string): void {
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = this.getFullUrl(url);
  }

  private static getFullUrl(path: string): string {
    if (path.startsWith('http')) return path;
    return `${this.SITE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
  }
}

/**
 * React Hook for managing SEO metadata
 * 
 * @param metadata - SEO metadata to apply
 */
export function useSEO(metadata: SEOMetaData): void {
  // Update meta tags when metadata changes
  useEffect(() => {
    SEOUtils.updateMetaTags(metadata);

    // Cleanup: Reset to defaults when component unmounts
    return () => {
      SEOUtils.updateMetaTags({});
    };
  }, [metadata]);
}

// Re-export for convenience
export default SEOUtils;
