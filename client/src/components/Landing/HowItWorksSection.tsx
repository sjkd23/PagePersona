import HowItWorksStep from './HowItWorksStep';
import PersonaAvatarsDemo from './PersonaAvatarsDemo';
import UrlInputDemo from './UrlInputDemo';
import GenerateButtonDemo from './GenerateButtonDemo';
import OutputDemo from './OutputDemo';

export default function HowItWorksSection() {
  return (
    <div className="content-container">
      {/* Left Section - Steps 1-3 with Pictures in 2-column grid */}
      <div className="steps-with-visuals">
        {/* Row 1 - Step 1 and Persona Avatars */}
        <HowItWorksStep stepNumber={1} title="Choose your persona" />
        <PersonaAvatarsDemo />

        {/* Single gradient divider after step 1 */}
        <div className="step-divider step-divider-full"></div>

        {/* Row 2 - Step 2 and URL Input */}
        <HowItWorksStep stepNumber={2} title="Enter URL" subtitle="(or text)" />
        <UrlInputDemo />

        {/* Single gradient divider after step 2 */}
        <div className="step-divider step-divider-full"></div>

        {/* Row 3 - Step 3 and Generate Button */}
        <HowItWorksStep stepNumber={3} title="Generate your text" />
        <GenerateButtonDemo />
      </div>

      {/* Right Section - Step 4 with Output */}
      <div className="step-four-section">
        {/* Removed step-four-divider */}
        <HowItWorksStep stepNumber={4} title="Read your new site/text!" className="step-four" />
        <OutputDemo />
      </div>
    </div>
  );
}
