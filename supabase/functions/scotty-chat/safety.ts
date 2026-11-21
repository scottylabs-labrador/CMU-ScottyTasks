export interface CrisisCheckResult {
  isCrisis: boolean;
}

const CRISIS_PATTERNS: RegExp[] = [
  /\b(kill\s+myself|end\s+my\s+life|take\s+my\s+(?:own\s+)?life|commit\s+suicide)\b/i,
  /\b(suicidal|suicide\s+plan|want\s+to\s+die|wanna\s+die|wish\s+i\s+(?:were|was)\s+dead)\b/i,
  /\b(don'?t\s+want\s+to\s+live|no\s+reason\s+to\s+live|better\s+off\s+dead)\b/i,
  /\b(hurt\s+myself|harm\s+myself|self[- ]?harm|cut\s+myself|overdose\s+on)\b/i,
];

/**
 * Detects explicit self-harm or suicidal crisis intent while avoiding false positives
 * on common student idioms like "this homework is killing me".
 */
export function detectCrisisSignals(text: string): CrisisCheckResult {
  const normalized = text.trim();
  if (!normalized) return { isCrisis: false };
  const matched = CRISIS_PATTERNS.some((pattern) => pattern.test(normalized));
  return { isCrisis: matched };
}

export function buildCrisisReply(): string {
  return [
    "I'm really glad you reached out, and I care about your safety. I'm an AI study companion and not a substitute for real human support—please connect with someone who can help right now:",
    "",
    "• 988 Suicide & Crisis Lifeline: Call or text 988 (24/7, free, confidential in the US & Canada)",
    "• Crisis Text Line: Text HOME to 741741",
    "• CMU CaPS (Counseling & Psychological Services): 412-268-2922 (24/7 crisis support for CMU students)",
    "• Emergency: Call 911 (or CMU Police at 412-268-2323) if you are in immediate danger",
    "",
    "You don't have to carry this alone. Please reach out to one of these resources or someone you trust.",
  ].join("\n");
}

/** Delimits user-stored database values so prompt text inside records cannot issue instructions. */
export function formatUntrustedContext(label: string, data: unknown): string {
  return `<untrusted_user_data name="${label}">\n${JSON.stringify(data)}\n</untrusted_user_data>`;
}
