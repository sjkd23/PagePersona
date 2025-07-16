/**
 * Landing Page Component
 *
 * Main marketing and information page providing application overview,
 * feature demonstrations, and call-to-action elements. Adapts content
 * and actions based on user authentication state to provide personalized
 * experience for both new visitors and existing users.
 *
 * Features:
 * - Application feature showcase and demonstrations
 * - Step-by-step workflow explanation
 * - Authentication-aware call-to-action sections
 * - Responsive design for all device sizes
 * - Smooth scrolling and modern visual design
 * - SEO-optimized semantic HTML structure
 */

import { useEffect } from 'react';
import './styles/index.css';
import type { LandingPageProps } from './types';
import HowItWorksSection from './HowItWorksSection';
import CTASection from './CTASection';
import { SEOUtils } from '../../utils/seoUtils';

/**
 * Landing Page Component
 *
 * Renders the complete landing page experience with feature sections,
 * workflow explanations, and authentication-aware call-to-action elements.
 */
export default function LandingPage({
  onShowLogin,
  onShowSignup,
  isAuthenticated = false,
  userName,
}: LandingPageProps) {
  // Add FAQ structured data for better SEO
  useEffect(() => {
    const faqs = [
      {
        question: 'What is PagePersonAI?',
        answer:
          'PagePersonAI is an AI-powered tool that transforms web content into different writing styles using various personas like Hemingway, Medieval Knight, or ELI5 explanations.',
      },
      {
        question: 'How does the AI transformation work?',
        answer:
          'Simply paste a URL or text, choose your preferred persona, and our AI will rewrite the content in that specific style while maintaining the original meaning.',
      },
      {
        question: 'Is PagePersonAI free to use?',
        answer:
          'Yes! We offer a free tier with limited transformations per month. Premium plans are available for unlimited usage.',
      },
      {
        question: 'What types of content can I transform?',
        answer:
          'You can transform any text content including articles, blog posts, news stories, research papers, and more. Just paste a URL or directly input your text.',
      },
      {
        question: 'How accurate are the AI transformations?',
        answer:
          'Our AI maintains the core meaning and facts while adapting the writing style to match your chosen persona. The accuracy depends on the complexity of the source material.',
      },
    ];

    SEOUtils.addFAQStructuredData(faqs);

    // Cleanup function to remove structured data when component unmounts
    return () => {
      const faqSchema = document.getElementById('faq-schema');
      if (faqSchema) faqSchema.remove();
    };
  }, []);

  return (
    <div className="landing-page">
      {/* Main content section containing feature showcase and calls-to-action */}
      <main className="main-content" role="main">
        <HowItWorksSection />
        <CTASection
          isAuthenticated={isAuthenticated}
          userName={userName}
          onShowLogin={onShowLogin}
          onShowSignup={onShowSignup}
        />
      </main>

      {/* Features Section */}
      <section className="features-section" role="complementary">
        <div className="container">
          <h2 className="section-title">Why Choose PagePersonAI?</h2>
          <div className="features-grid">
            <article className="feature-card">
              <div className="feature-icon" aria-hidden="true">
                🤖
              </div>
              <h3>Advanced AI Technology</h3>
              <p>
                Powered by state-of-the-art language models for accurate and engaging
                transformations.
              </p>
            </article>

            <article className="feature-card">
              <div className="feature-icon" aria-hidden="true">
                ⚡
              </div>
              <h3>Lightning Fast</h3>
              <p>
                Get your transformed content in seconds, not minutes. No waiting around for results.
              </p>
            </article>

            <article className="feature-card">
              <div className="feature-icon" aria-hidden="true">
                🎨
              </div>
              <h3>Creative Personas</h3>
              <p>
                Choose from unique writing styles including historical figures, fictional
                characters, and educational formats.
              </p>
            </article>

            <article className="feature-card">
              <div className="feature-icon" aria-hidden="true">
                📱
              </div>
              <h3>Mobile Friendly</h3>
              <p>
                Transform content on any device—desktop, tablet, or mobile. Perfect for reading on
                the go.
              </p>
            </article>

            <article className="feature-card">
              <div className="feature-icon" aria-hidden="true">
                🔒
              </div>
              <h3>Privacy Focused</h3>
              <p>
                Your content is processed securely and not stored permanently. Privacy is our
                priority.
              </p>
            </article>

            <article className="feature-card">
              <div className="feature-icon" aria-hidden="true">
                💎
              </div>
              <h3>High Quality Output</h3>
              <p>
                Maintains the original meaning while adapting tone, style, and complexity to your
                chosen persona.
              </p>
            </article>
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="use-cases-section" role="complementary">
        <div className="container">
          <h2 className="section-title">Perfect For</h2>
          <div className="use-cases-grid">
            <div className="use-case">
              <h3>Students & Educators</h3>
              <p>
                Transform complex academic papers into ELI5 explanations or engaging story formats
                for better understanding.
              </p>
            </div>

            <div className="use-case">
              <h3>Content Creators</h3>
              <p>
                Repurpose existing content into different styles for various audiences and
                platforms.
              </p>
            </div>

            <div className="use-case">
              <h3>Professionals</h3>
              <p>
                Convert technical documentation into accessible formats for stakeholders and
                clients.
              </p>
            </div>

            <div className="use-case">
              <h3>Curious Readers</h3>
              <p>
                Make dry articles more entertaining by transforming them into your favorite writing
                style.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
