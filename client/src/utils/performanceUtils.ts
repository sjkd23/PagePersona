/**
 * Performance Optimization Utilities
 * 
 * Provides utilities for improving web performance including
 * lazy loading, prefetching, and other optimization techniques.
 * 
 * @module PerformanceUtils
 */

/**
 * Performance Utility Class
 * 
 * Static methods for implementing performance optimizations
 * throughout the application.
 */
export class PerformanceUtils {
  
  /**
   * Lazy load images with intersection observer
   * 
   * @param imageSelector - CSS selector for images to lazy load
   */
  static setupLazyLoading(imageSelector: string = 'img[data-src]'): void {
    if (!('IntersectionObserver' in window)) {
      // Fallback for browsers without IntersectionObserver
      this.loadAllImages(imageSelector);
      return;
    }

    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement;
          const src = img.dataset.src;
          
          if (src) {
            img.src = src;
            img.removeAttribute('data-src');
            img.classList.add('loaded');
            observer.unobserve(img);
          }
        }
      });
    }, {
      rootMargin: '50px 0px',
      threshold: 0.01
    });

    document.querySelectorAll(imageSelector).forEach(img => {
      imageObserver.observe(img);
    });
  }

  /**
   * Prefetch critical resources
   * 
   * @param resources - Array of resource URLs to prefetch
   */
  static prefetchResources(resources: string[]): void {
    resources.forEach(resource => {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = resource;
      document.head.appendChild(link);
    });
  }

  /**
   * Preload critical fonts
   * 
   * @param fonts - Array of font URLs to preload
   */
  static preloadFonts(fonts: string[]): void {
    fonts.forEach(font => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = font;
      link.as = 'font';
      link.type = 'font/woff2';
      link.crossOrigin = 'anonymous';
      document.head.appendChild(link);
    });
  }

  /**
   * Setup service worker for caching
   * 
   * @param swPath - Path to service worker file
   */
  static async setupServiceWorker(swPath: string = '/sw.js'): Promise<void> {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register(swPath);
        console.log('SW registered: ', registration);
      } catch (registrationError) {
        console.log('SW registration failed: ', registrationError);
      }
    }
  }

  /**
   * Debounce function for performance optimization
   * 
   * @param func - Function to debounce
   * @param wait - Wait time in milliseconds
   * @param immediate - Execute immediately
   */
  static debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number,
    immediate?: boolean
  ): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout | null = null;
    
    return function executedFunction(...args: Parameters<T>) {
      const later = () => {
        timeout = null;
        if (!immediate) func(...args);
      };
      
      const callNow = immediate && !timeout;
      
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(later, wait);
      
      if (callNow) func(...args);
    };
  }

  /**
   * Throttle function for performance optimization
   * 
   * @param func - Function to throttle
   * @param limit - Time limit in milliseconds
   */
  static throttle<T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): (...args: Parameters<T>) => void {
    let inThrottle: boolean;
    
    return function executedFunction(this: any, ...args: Parameters<T>) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }

  /**
   * Monitor Core Web Vitals
   */
  static monitorWebVitals(): void {
    // Largest Contentful Paint (LCP)
    new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      const lastEntry = entries[entries.length - 1];
      console.log('LCP:', lastEntry.startTime);
    }).observe({ entryTypes: ['largest-contentful-paint'] });

    // First Input Delay (FID)
    new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      entries.forEach((entry) => {
        const fidEntry = entry as any; // Type assertion for FID entry
        console.log('FID:', fidEntry.processingStart - fidEntry.startTime);
      });
    }).observe({ entryTypes: ['first-input'] });

    // Cumulative Layout Shift (CLS)
    let clsValue = 0;
    new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      entries.forEach((entry: any) => {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
          console.log('CLS:', clsValue);
        }
      });
    }).observe({ entryTypes: ['layout-shift'] });
  }

  /**
   * Setup critical resource hints
   */
  static setupResourceHints(): void {
    // DNS prefetch for external domains
    const dnsPrefetchDomains = [
      '//fonts.googleapis.com',
      '//fonts.gstatic.com',
      '//api.openai.com',
      '//auth0.com'
    ];

    dnsPrefetchDomains.forEach(domain => {
      const link = document.createElement('link');
      link.rel = 'dns-prefetch';
      link.href = domain;
      document.head.appendChild(link);
    });

    // Preconnect to critical domains
    const preconnectDomains = [
      'https://fonts.googleapis.com',
      'https://fonts.gstatic.com'
    ];

    preconnectDomains.forEach(domain => {
      const link = document.createElement('link');
      link.rel = 'preconnect';
      link.href = domain;
      if (domain.includes('gstatic')) {
        link.crossOrigin = 'anonymous';
      }
      document.head.appendChild(link);
    });
  }

  /**
   * Optimize images by adding loading="lazy" attribute
   */
  static optimizeImages(): void {
    document.querySelectorAll('img').forEach(img => {
      if (!img.loading) {
        img.loading = 'lazy';
      }
      
      // Add alt text if missing (accessibility and SEO)
      if (!img.alt) {
        img.alt = img.title || 'Image';
      }
    });
  }

  /**
   * Setup critical CSS inlining
   * 
   * @param criticalCSS - Critical CSS string to inline
   */
  static inlineCriticalCSS(criticalCSS: string): void {
    const style = document.createElement('style');
    style.textContent = criticalCSS;
    document.head.appendChild(style);
  }

  // Private helper methods

  private static loadAllImages(selector: string): void {
    document.querySelectorAll(selector).forEach(img => {
      const image = img as HTMLImageElement;
      const src = image.dataset.src;
      if (src) {
        image.src = src;
        image.removeAttribute('data-src');
      }
    });
  }
}

/**
 * React Hook for performance monitoring
 */
export function usePerformanceMonitoring(): void {
  if (typeof window === 'undefined') return;
  
  // Monitor Web Vitals in development
  if (import.meta.env.DEV) {
    PerformanceUtils.monitorWebVitals();
  }
  
  // Setup resource hints
  PerformanceUtils.setupResourceHints();
  
  // Optimize images
  PerformanceUtils.optimizeImages();
}

export default PerformanceUtils;
