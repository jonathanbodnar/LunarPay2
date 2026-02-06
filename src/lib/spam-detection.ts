// Spam detection for auto-restricting suspicious merchant accounts

// Common spam/inappropriate words to flag
const SPAM_WORDS = [
  // Adult content
  'porn', 'xxx', 'adult', 'nude', 'naked', 'sex', 'escort', 'cam girl', 'camgirl',
  'onlyfans', 'fansly', 'stripper', 'erotic', 'fetish', 'bdsm',
  
  // Gambling (often restricted)
  'casino', 'betting', 'gambling', 'poker', 'slots',
  
  // Scam indicators
  'crypto investment', 'guaranteed returns', 'get rich', 'mlm', 'pyramid',
  'forex trading', 'binary options', 'make money fast', 'passive income guarantee',
  
  // Drugs
  'cannabis', 'marijuana', 'weed', 'cbd', 'thc', 'dispensary', 'vape', 'kratom',
  
  // Weapons
  'firearms', 'guns', 'ammo', 'ammunition', 'weapons',
  
  // Generic spam patterns
  'test', 'asdf', 'qwerty', 'aaa', 'bbb', '123456', 'abcdef',
  'sample', 'demo account', 'fake', 'spam',
];

// Suspicious email domains
const SUSPICIOUS_DOMAINS = [
  'tempmail', 'throwaway', 'guerrillamail', 'mailinator', '10minutemail',
  'yopmail', 'trashmail', 'fakeinbox', 'temp-mail', 'disposable',
];

export interface SpamCheckResult {
  isSpam: boolean;
  reason: string | null;
  matchedWords: string[];
}

/**
 * Check if a business name contains spam words
 */
export function checkBusinessName(name: string): SpamCheckResult {
  const lowerName = name.toLowerCase();
  const matchedWords: string[] = [];

  for (const word of SPAM_WORDS) {
    if (lowerName.includes(word.toLowerCase())) {
      matchedWords.push(word);
    }
  }

  if (matchedWords.length > 0) {
    return {
      isSpam: true,
      reason: `Business name contains restricted terms: ${matchedWords.join(', ')}`,
      matchedWords,
    };
  }

  // Check for gibberish patterns (repeated characters)
  const gibberishPattern = /(.)\1{4,}/; // 5+ repeated characters
  if (gibberishPattern.test(lowerName)) {
    return {
      isSpam: true,
      reason: 'Business name appears to be gibberish',
      matchedWords: [],
    };
  }

  // Check for too short names (likely test accounts)
  if (name.trim().length < 3) {
    return {
      isSpam: true,
      reason: 'Business name is too short',
      matchedWords: [],
    };
  }

  return {
    isSpam: false,
    reason: null,
    matchedWords: [],
  };
}

/**
 * Check if email domain is suspicious
 */
export function checkEmailDomain(email: string): SpamCheckResult {
  const lowerEmail = email.toLowerCase();
  const matchedWords: string[] = [];

  for (const domain of SUSPICIOUS_DOMAINS) {
    if (lowerEmail.includes(domain)) {
      matchedWords.push(domain);
    }
  }

  if (matchedWords.length > 0) {
    return {
      isSpam: true,
      reason: `Email uses disposable/temporary domain`,
      matchedWords,
    };
  }

  return {
    isSpam: false,
    reason: null,
    matchedWords: [],
  };
}

/**
 * Full spam check for registration
 */
export function checkForSpam(businessName: string, email: string): SpamCheckResult {
  // Check business name first
  const nameCheck = checkBusinessName(businessName);
  if (nameCheck.isSpam) {
    return nameCheck;
  }

  // Check email domain
  const emailCheck = checkEmailDomain(email);
  if (emailCheck.isSpam) {
    return emailCheck;
  }

  return {
    isSpam: false,
    reason: null,
    matchedWords: [],
  };
}
