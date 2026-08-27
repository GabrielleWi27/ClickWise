// Since sign-up only asks for an email (not a name), this guesses a
// display name from the part before the "@". For example:
//   "jane.doe@company.com"  -> "Jane Doe"
//   "mike_smith@company.com" -> "Mike Smith"
// If nothing usable is found, it falls back to "New User" so the app
// never shows a blank name.
export function deriveNameFromEmail(email) {
  const local = email.split('@')[0] ?? ''; // the part before the "@"
  return (
    local
      .split(/[.\-_]+/) // break "jane.doe" or "mike_smith" into separate words
      .filter(Boolean) // drop any empty pieces
      .map((part) => part[0].toUpperCase() + part.slice(1).toLowerCase()) // capitalize each word
      .join(' ') || 'New User'
  );
}
