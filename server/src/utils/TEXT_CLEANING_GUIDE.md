# Text Cleaning for LLM - Usage Guide

## Overview

The `cleanTextForLLM` utility reduces OpenAI API costs by intelligently cleaning and optimizing text before sending it to the LLM. It removes unnecessary content, normalizes text, and applies smart truncation strategies while preserving important information.

## Quick Start

### Basic Usage

```typescript
import { cleanTextForLLM } from '../utils/cleanTextForLLM';

// Clean HTML content
const html = '<html><body><p>Article content here</p></body></html>';
const result = cleanTextForLLM(html);

console.log(result.cleanedText); // Clean text ready for LLM
console.log(result.metrics.tokenReduction); // Tokens saved
```

### With Configuration

```typescript
import { cleanTextForLLM } from '../utils/cleanTextForLLM';

const result = cleanTextForLLM(rawHtml, {
  maxChars: 45000,              // Character limit (~11k tokens)
  preserveStartRatio: 0.8,      // Keep 80% from start, 20% from end
  title: 'Article Title',       // Optional metadata
  url: 'https://example.com',   // Optional metadata
  includeHeadings: true,        // Extract h1-h6 tags
  enableMetrics: true,          // Log cleaning metrics
});

console.log(result.cleanedText);
console.log(result.headings);
console.log(result.metrics);
```

### Cleaning Scraped Content

```typescript
import { cleanScrapedContent } from '../utils/cleanTextForLLM';

const scrapedContent = {
  title: 'My Article',
  content: '<html>...</html>',
  url: 'https://example.com/article',
};

const result = cleanScrapedContent(
  scrapedContent.content,
  scrapedContent.title,
  scrapedContent.url,
  {
    maxChars: 45000,
    preserveStartRatio: 0.8,
    includeHeadings: true,
  }
);
```

## Integration Points

### 1. Content Transformer (Already Integrated)

The utility is already integrated into `content-transformer.ts` at two key points:

**For Web Content:**
```typescript
// In transformContent() method
const cleaningResult = cleanScrapedContent(
  scrapedContent.content,
  scrapedContent.title,
  scrapedContent.url,
  {
    maxChars: 45000,
    preserveStartRatio: 0.8,
    includeHeadings: true,
  }
);
```

**For Direct Text:**
```typescript
// In transformText() method
const cleaningResult = cleanScrapedContent(text, 'Direct Text Input', undefined, {
  maxChars: 45000,
  preserveStartRatio: 0.8,
  includeHeadings: false,
});
```

### 2. Manual Integration (If Needed)

If you need to add cleaning to other services:

```typescript
import { cleanTextForLLM } from '../utils/cleanTextForLLM';
import { OpenAIClientService } from './openaiClient';

// Before calling OpenAI
const cleaningResult = cleanTextForLLM(rawContent, {
  maxChars: 45000,
  title: contentTitle,
  url: contentUrl,
});

// Use cleaned text in OpenAI call
const response = await openaiClient.generateCompletion({
  systemPrompt: systemPrompt,
  userPrompt: cleaningResult.cleanedText, // Use cleaned text
});

// Log savings
logger.info('Token savings', {
  tokensSaved: cleaningResult.metrics.tokenReduction,
  reductionPercent: cleaningResult.metrics.reductionPercent,
});
```

## What Gets Removed

### HTML Elements
- `<script>`, `<style>`, `<noscript>` tags
- `<nav>`, `<header>`, `<footer>`, `<aside>` elements
- Advertisements (`.ad`, `.ads`, `.advertisement`)
- Cookie banners (`.cookie-*`)
- Social sharing widgets
- Modals and popups

### Text Patterns
- URLs and email addresses
- Cookie policy notices
- Privacy policy links
- Newsletter signup prompts
- Copyright notices
- Advertisement disclaimers

### Navigation Content
- Short menu items (< 10 chars)
- Lines with many separators (`|`, `>`, `•`)
- All-caps header lines

### Whitespace
- Multiple consecutive spaces → single space
- Multiple newlines → double newline
- Leading/trailing whitespace

## Smart Truncation

When content exceeds `maxChars`:

1. **Preserve Start (80% by default)**: Most important content is usually at the beginning
2. **Preserve End (20% by default)**: Conclusions and summaries are often at the end
3. **Add Separator**: Clear marker showing middle content was removed

Example:
```
Original: 50,000 characters
maxChars: 10,000
preserveStartRatio: 0.8

Result:
- First 8,000 chars (80%)
- Separator: "[... middle content truncated for brevity ...]"
- Last 2,000 chars (20%)
```

## Metrics

The utility provides comprehensive metrics:

```typescript
interface Metrics {
  originalLength: number;           // Original character count
  cleanedLength: number;            // Cleaned character count
  reductionPercent: number;         // Percentage reduction
  estimatedOriginalTokens: number;  // ~original chars / 4
  estimatedCleanedTokens: number;   // ~cleaned chars / 4
  tokenReduction: number;           // Tokens saved
  wasTruncated: boolean;            // Whether content was truncated
}
```

### Token Estimation

The utility uses a simple heuristic:
- **~4 characters per token** for English text
- This is a rough approximation but good enough for cost estimation
- Actual token counts may vary based on content structure

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `maxChars` | `number` | `45000` | Maximum characters (~11k tokens) |
| `preserveStartRatio` | `number` | `0.8` | Ratio of content from start (0-1) |
| `preserveEndRatio` | `number` | `0.2` | Ratio of content from end (0-1) |
| `enableMetrics` | `boolean` | `true` | Log metrics to console |
| `title` | `string?` | `undefined` | Document title (metadata) |
| `url` | `string?` | `undefined` | Document URL (metadata) |
| `includeHeadings` | `boolean` | `false` | Extract h1-h6 tags |

## Expected Results

### Typical Savings

Based on common web content:

| Content Type | Original Tokens | Cleaned Tokens | Savings |
|--------------|----------------|----------------|---------|
| Blog Article | 5,000 | 3,500 | 30% |
| News Article | 8,000 | 5,600 | 30% |
| Documentation | 12,000 | 9,000 | 25% |
| Landing Page | 15,000 | 8,000 | 47% |

### Cost Impact

Assuming GPT-4 pricing:
- Input: $0.03 per 1k tokens
- Output: $0.06 per 1k tokens

**Example: 10,000 token article**
- Before cleaning: 10,000 tokens × $0.03 = **$0.30 per request**
- After cleaning (30% reduction): 7,000 tokens × $0.03 = **$0.21 per request**
- **Savings: $0.09 per request (30% reduction)**

At scale:
- 1,000 requests/day: **$90/day savings**
- 30,000 requests/month: **$2,700/month savings**

## Logging Output

When `enableMetrics: true`, you'll see logs like:

```
[cleanTextForLLM] Starting text cleaning
  originalLength: 85432
  maxChars: 45000
  hasTitle: true
  hasUrl: true

[cleanTextForLLM] Text cleaning completed
  originalLength: 85432
  cleanedLength: 42150
  reductionPercent: 50.68
  estimatedOriginalTokens: 21358
  estimatedCleanedTokens: 10537
  tokenReduction: 10821
  wasTruncated: true
  title: "How to Build Better Software"
  url: "https://example.com/article"
  headingsCount: 5
```

## Best Practices

### 1. Adjust maxChars Based on Model

```typescript
// GPT-4 with 8k context window
cleanTextForLLM(content, { maxChars: 30000 }); // ~7.5k tokens

// GPT-4 with 32k context window
cleanTextForLLM(content, { maxChars: 120000 }); // ~30k tokens

// GPT-3.5-turbo (4k context)
cleanTextForLLM(content, { maxChars: 15000 }); // ~3.75k tokens
```

### 2. Preserve More End Content for Summaries

```typescript
// For articles with conclusions
cleanTextForLLM(content, {
  preserveStartRatio: 0.7,  // 70% start
  // 30% end automatically
});
```

### 3. Extract Headings for Context

```typescript
// Helps LLM understand structure
const result = cleanTextForLLM(html, {
  includeHeadings: true,
});

// Include headings in prompt
const prompt = `
Article headings: ${result.headings?.join(', ')}
Content: ${result.cleanedText}
`;
```

### 4. Monitor Metrics

```typescript
// Track savings over time
const result = cleanTextForLLM(content, { enableMetrics: true });

// Store metrics for analytics
await saveMetrics({
  timestamp: new Date(),
  tokensSaved: result.metrics.tokenReduction,
  reductionPercent: result.metrics.reductionPercent,
});
```

## Testing

Run the test suite:

```bash
npm test -- cleanTextForLLM.test.ts
```

Test coverage includes:
- HTML detection and extraction
- Plain text cleaning
- Boilerplate removal
- Navigation filtering
- Smart truncation
- Metrics calculation
- Headings extraction
- Edge cases
- Real-world scenarios

## Troubleshooting

### Content Too Aggressively Cleaned

Reduce filtering by adjusting thresholds in the source code or increase `maxChars`.

### Important Content Being Removed

Check if important content matches boilerplate patterns. You may need to adjust regex patterns.

### Token Estimates Inaccurate

The ~4 chars/token heuristic is approximate. For precise counting, use the `tiktoken` library (adds dependency).

### Performance Issues

The utility uses cheerio for HTML parsing, which is fast. If you see slowdowns, profile the cleaning operations.

## Future Enhancements

Potential improvements (not yet implemented):

1. **Precise Token Counting**: Use `tiktoken` library for exact counts
2. **Configurable Boilerplate Patterns**: Allow custom regex patterns
3. **Language Detection**: Adjust cleaning based on content language
4. **Section-based Truncation**: Preserve complete sections rather than character counts
5. **Caching**: Cache cleaned results to avoid re-processing

## Support

For issues or questions:
1. Check the test file for usage examples
2. Review the source code comments
3. Contact the development team
