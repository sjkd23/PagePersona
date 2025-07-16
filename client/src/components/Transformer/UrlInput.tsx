import { useState, useEffect } from 'react';
import InputField from './InputField';
import { validateInput } from './validation';

interface UrlInputProps {
  url: string;
  onUrlChange: (url: string) => void;
  isLoading: boolean;
  maxTextLength?: number;
  'data-testid'?: string;
}

export default function UrlInput({
  url,
  onUrlChange,
  isLoading,
  maxTextLength = 10000,
  'data-testid': testId = 'url-input-component',
}: UrlInputProps) {
  const [inputMode, setInputMode] = useState<'url' | 'text'>('url');
  const [urlError, setUrlError] = useState<string | null>(null);
  const [textError, setTextError] = useState<string | null>(null);

  // Validate input when value or mode changes
  useEffect(() => {
    const validation = validateInput(url, inputMode, maxTextLength);
    if (inputMode === 'url') {
      setUrlError(validation.error);
      setTextError(null);
    } else {
      setTextError(validation.error);
      setUrlError(null);
    }
  }, [url, inputMode, maxTextLength]);

  const handleModeChange = (mode: 'url' | 'text') => {
    setInputMode(mode);
    setUrlError(null);
    setTextError(null);
  };

  const handleInputChange = (value: string) => {
    onUrlChange(value);
  };

  return (
    <InputField
      mode={inputMode}
      value={url}
      onModeChange={handleModeChange}
      onChange={handleInputChange}
      urlError={urlError}
      textError={textError}
      maxLength={maxTextLength}
      disabled={isLoading}
      className="url-input-component"
      data-testid={testId}
    />
  );
}
