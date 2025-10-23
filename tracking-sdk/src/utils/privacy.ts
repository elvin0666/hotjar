const DEFAULT_MASK_SELECTORS = [
  'input[type="password"]',
  'input[type="email"]',
  'input[type="tel"]',
  'input[data-private]',
  '[data-mask]',
  '.sensitive',
];

const PII_PATTERNS = [
  /\b\d{3}-\d{2}-\d{4}\b/g, // SSN
  /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g, // Credit card
  /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, // Email
  /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, // Phone numbers
];

export function shouldMaskElement(
  element: HTMLElement,
  maskSelectors: string[]
): boolean {
  const selectors = [...DEFAULT_MASK_SELECTORS, ...maskSelectors];

  for (const selector of selectors) {
    try {
      if (element.matches(selector)) {
        return true;
      }
    } catch (e) {
      // Invalid selector
    }
  }

  // Check if any parent has data-mask
  let parent = element.parentElement;
  while (parent) {
    if (parent.hasAttribute('data-mask')) {
      return true;
    }
    parent = parent.parentElement;
  }

  return false;
}

export function maskValue(value: string): string {
  return '*'.repeat(value.length);
}

export function scrubPII(text: string): string {
  let scrubbed = text;

  for (const pattern of PII_PATTERNS) {
    scrubbed = scrubbed.replace(pattern, '[REDACTED]');
  }

  return scrubbed;
}

export function getElementText(element: HTMLElement): string | undefined {
  if (!element) return undefined;

  // Don't capture text from sensitive elements
  if (shouldMaskElement(element, [])) {
    return '[masked]';
  }

  let text = element.textContent?.trim() || '';

  // Limit text length
  if (text.length > 100) {
    text = text.substring(0, 100) + '...';
  }

  // Scrub PII
  return scrubPII(text);
}

export function getElementAttributes(
  element: HTMLElement
): Record<string, string> | undefined {
  const attrs: Record<string, string> = {};
  const allowedAttrs = ['href', 'title', 'alt', 'role', 'aria-label'];

  for (const attr of allowedAttrs) {
    const value = element.getAttribute(attr);
    if (value) {
      attrs[attr] = scrubPII(value);
    }
  }

  return Object.keys(attrs).length > 0 ? attrs : undefined;
}