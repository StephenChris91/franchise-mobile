// Basic profanity filter — server-side only
const BLOCKED_WORDS = [
  "fuck", "shit", "bitch", "asshole", "bastard", "cunt", "damn", "hell",
  "nigger", "nigga", "faggot", "retard", "whore", "slut",
];

const pattern = new RegExp(
  `\\b(${BLOCKED_WORDS.join("|")})\\b`,
  "i"
);

export function containsProfanity(text: string): boolean {
  return pattern.test(text);
}
