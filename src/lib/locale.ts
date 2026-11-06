export function defaultLanguage(): 'fr' | 'en' {
  try {
    const loc = Intl.DateTimeFormat().resolvedOptions().locale ?? 'fr';
    return loc.toLowerCase().startsWith('en') ? 'en' : 'fr';
  } catch {
    return 'fr';
  }
}
