/**
 * Moderation and safety filter for Artelio messaging.
 * Protects buyers and artists by blocking direct contact exchange (phone/email),
 * ensuring transactions remain protected under Artelio Escrow.
 */

export function checkMessageContent(text: string): { blocked: boolean; reason?: string } {
  if (!text || typeof text !== 'string') return { blocked: false };

  const trimmed = text.trim();

  // 1. Detect Email Addresses (standard or common obfuscations like "user [at] domain [dot] com")
  const standardEmail = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/i;
  const obfuscatedEmail = /\b[A-Za-z0-9._%+-]+\s*(?:@|\[at\]|\(at\))\s*[A-Za-z0-9.-]+\s*(?:\.|\(dot\)|\[dot\])\s*[A-Za-z]{2,}\b/i;

  if (standardEmail.test(trimmed) || obfuscatedEmail.test(trimmed)) {
    return {
      blocked: true,
      reason: 'Sharing email addresses is not permitted. Keep all conversations on Artelio to stay protected under Artelio Escrow and collector guarantees.',
    };
  }

  // 2. Detect Phone Numbers
  // Matches formatted international & Indian mobile/landline numbers:
  // e.g., +91 9876543210, 09876543210, 98765 43210, 98765-43210, (555) 123-4567, 9876543210
  const phoneRegexes = [
    /(?:(?:\+|00)\d{1,3}[\s.-]?)?(?:\(?\d{2,5}\)?[\s.-]?)?\d{3,5}[\s.-]?\d{4,5}/g,
    /\b\d{5}[\s.-]?\d{5}\b/g,
    /\b\d{3}[\s.-]?\d{3}[\s.-]?\d{4}\b/g,
  ];

  for (const regex of phoneRegexes) {
    const matches = trimmed.match(regex);
    if (matches) {
      for (const m of matches) {
        const digits = m.replace(/\D/g, '');
        // Validate length: 10 to 14 digits represents actual phone numbers
        if (digits.length >= 10 && digits.length <= 14) {
          return {
            blocked: true,
            reason: 'Sharing phone numbers is not permitted. Keep all conversations on Artelio to stay protected under Artelio Escrow and collector guarantees.',
          };
        }
      }
    }
  }

  // 3. Spaced single-digit patterns like "9 8 7 6 5 4 3 2 1 0"
  const spacedDigitsMatch = trimmed.match(/(?:\b\d[\s-]?){10,}\b/);
  if (spacedDigitsMatch) {
    const digits = spacedDigitsMatch[0].replace(/\D/g, '');
    if (digits.length >= 10) {
      return {
        blocked: true,
        reason: 'Sharing phone numbers is not permitted. Keep all conversations on Artelio to stay protected under Artelio Escrow and collector guarantees.',
      };
    }
  }

  return { blocked: false };
}
