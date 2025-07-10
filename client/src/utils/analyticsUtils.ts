/**
 * Analytics Utility Service
 * 
 * Provides utilities for tracking user interactions, page views,
 * and other analytics events while respecting user privacy.
 * 
 * @module AnalyticsUtils
 */

import { useEffect } from 'react';

export interface AnalyticsEvent {
  action: string;
  category: string;
  label?: string;
  value?: number;
  custom_parameters?: Record<string, any>;
}

export interface PageViewData {
  page_title?: string;
  page_location?: string;
  page_referrer?: string;
  user_id?: string;
}

/**
 * Analytics Utility Class
 * 
 * Handles analytics tracking with privacy-first approach
 * and support for multiple analytics providers.
 */
export class AnalyticsUtils {
  private static isEnabled = true;
  private static userId: string | null = null;
  private static sessionId: string = AnalyticsUtils.generateSessionId();
  
  /**
   * Initialize analytics with user consent
   * 
   * @param hasConsent - Whether user has consented to analytics
   * @param userId - Optional user identifier
   */
  static initialize(hasConsent: boolean, userId?: string): void {
    this.isEnabled = hasConsent;
    this.userId = userId || null;
    
    if (hasConsent && import.meta.env.VITE_GA_TRACKING_ID) {
      this.setupGoogleAnalytics();
    }
    
    // Track initial page view
    if (hasConsent) {
      this.trackPageView();
    }
  }

  /**
   * Track page view
   * 
   * @param data - Optional page view data
   */
  static trackPageView(data?: PageViewData): void {
    if (!this.isEnabled) return;

    const pageData = {
      page_title: data?.page_title || document.title,
      page_location: data?.page_location || window.location.href,
      page_referrer: data?.page_referrer || document.referrer,
      user_id: data?.user_id || this.userId,
      session_id: this.sessionId,
      timestamp: new Date().toISOString()
    };

    // Google Analytics 4
    if (typeof gtag !== 'undefined') {
      gtag('config', import.meta.env.VITE_GA_TRACKING_ID, pageData);
    }

    // Custom analytics endpoint (if available)
    this.sendToCustomAnalytics('page_view', pageData);
  }

  /**
   * Track custom event
   * 
   * @param event - Event data to track
   */
  static trackEvent(event: AnalyticsEvent): void {
    if (!this.isEnabled) return;

    const eventData = {
      ...event,
      user_id: this.userId,
      session_id: this.sessionId,
      timestamp: new Date().toISOString(),
      page_location: window.location.href
    };

    // Google Analytics 4
    if (typeof gtag !== 'undefined') {
      gtag('event', event.action, {
        event_category: event.category,
        event_label: event.label,
        value: event.value,
        custom_parameters: event.custom_parameters
      });
    }

    // Custom analytics endpoint
    this.sendToCustomAnalytics('event', eventData);
  }

  /**
   * Track persona transformation
   * 
   * @param personaName - Name of the persona used
   * @param contentType - Type of content (url or text)
   * @param success - Whether transformation was successful
   */
  static trackTransformation(
    personaName: string, 
    contentType: 'url' | 'text', 
    success: boolean
  ): void {
    this.trackEvent({
      action: 'transform_content',
      category: 'content_transformation',
      label: `${personaName}_${contentType}`,
      value: success ? 1 : 0,
      custom_parameters: {
        persona: personaName,
        content_type: contentType,
        success
      }
    });
  }

  /**
   * Track user authentication
   * 
   * @param action - Auth action (login, signup, logout)
   * @param method - Auth method used
   */
  static trackAuth(action: 'login' | 'signup' | 'logout', method?: string): void {
    this.trackEvent({
      action: `user_${action}`,
      category: 'authentication',
      label: method,
      custom_parameters: {
        auth_method: method
      }
    });
  }

  /**
   * Track user engagement
   * 
   * @param action - Engagement action
   * @param details - Additional details
   */
  static trackEngagement(action: string, details?: Record<string, any>): void {
    this.trackEvent({
      action,
      category: 'user_engagement',
      custom_parameters: details
    });
  }

  /**
   * Track errors for debugging
   * 
   * @param error - Error object or message
   * @param context - Context where error occurred
   */
  static trackError(error: Error | string, context?: string): void {
    const errorMessage = error instanceof Error ? error.message : error;
    const errorStack = error instanceof Error ? error.stack : undefined;

    this.trackEvent({
      action: 'error_occurred',
      category: 'errors',
      label: context,
      custom_parameters: {
        error_message: errorMessage,
        error_stack: errorStack,
        context,
        user_agent: navigator.userAgent,
        url: window.location.href
      }
    });
  }

  /**
   * Track performance metrics
   * 
   * @param metric - Performance metric name
   * @param value - Metric value
   * @param unit - Metric unit (ms, bytes, etc.)
   */
  static trackPerformance(metric: string, value: number, unit?: string): void {
    this.trackEvent({
      action: 'performance_metric',
      category: 'performance',
      label: metric,
      value,
      custom_parameters: {
        metric_name: metric,
        metric_value: value,
        metric_unit: unit
      }
    });
  }

  /**
   * Update user consent
   * 
   * @param hasConsent - New consent status
   */
  static updateConsent(hasConsent: boolean): void {
    this.isEnabled = hasConsent;
    
    if (hasConsent) {
      // Re-initialize analytics
      this.initialize(true, this.userId || undefined);
    } else {
      // Clear any stored data
      this.clearAnalyticsData();
    }
  }

  /**
   * Set user ID for tracking
   * 
   * @param userId - User identifier
   */
  static setUserId(userId: string): void {
    this.userId = userId;
    
    if (this.isEnabled && typeof gtag !== 'undefined') {
      gtag('config', import.meta.env.VITE_GA_TRACKING_ID, {
        user_id: userId
      });
    }
  }

  // Private helper methods

  private static setupGoogleAnalytics(): void {
    const trackingId = import.meta.env.VITE_GA_TRACKING_ID;
    if (!trackingId) return;

    // Load Google Analytics script
    const script1 = document.createElement('script');
    script1.async = true;
    script1.src = `https://www.googletagmanager.com/gtag/js?id=${trackingId}`;
    document.head.appendChild(script1);

    // Initialize gtag
    const script2 = document.createElement('script');
    script2.innerHTML = `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '${trackingId}', {
        send_page_view: false,
        custom_map: {
          custom_parameter_1: 'persona_name',
          custom_parameter_2: 'content_type'
        }
      });
    `;
    document.head.appendChild(script2);
  }

  private static async sendToCustomAnalytics(eventType: string, data: any): Promise<void> {
    const analyticsEndpoint = import.meta.env.VITE_ANALYTICS_ENDPOINT;
    if (!analyticsEndpoint) return;

    try {
      await fetch(analyticsEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          event_type: eventType,
          data,
          timestamp: new Date().toISOString()
        })
      });
    } catch (error) {
      console.warn('Failed to send analytics data:', error);
    }
  }

  private static generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private static clearAnalyticsData(): void {
    // Clear any local storage or cookies related to analytics
    try {
      localStorage.removeItem('analytics_session');
      localStorage.removeItem('analytics_user');
    } catch (error) {
      console.warn('Failed to clear analytics data:', error);
    }
  }
}

/**
 * React Hook for analytics tracking
 * 
 * @param userId - Optional user ID for tracking
 * @param hasConsent - Whether user has consented to analytics
 */
export function useAnalytics(userId?: string, hasConsent: boolean = true): void {
  // Initialize analytics when hook is used
  useEffect(() => {
    AnalyticsUtils.initialize(hasConsent, userId);
  }, [userId, hasConsent]);
}

// Global gtag type declaration
declare global {
  function gtag(...args: any[]): void;
}

export default AnalyticsUtils;
