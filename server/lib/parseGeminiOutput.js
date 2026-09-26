export function extractJson(rawText) {
  let cleaned = rawText.trim();

  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/```$/, '').trim();
  }

  try {
    return JSON.parse(cleaned);
  } catch {
    return null;
  }
}