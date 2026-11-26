export function splitIntoChunks(
  text: string,
  maxWords = 180,
  overlapWords = 30,
): string[] {
  const normalizedText = text
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  if (!normalizedText) {
    return [];
  }

  const words = normalizedText.split(/\s+/);

  if (words.length <= maxWords) {
    return [normalizedText];
  }

  const chunks: string[] = [];

  let start = 0;

  while (start < words.length) {
    const end = Math.min(start + maxWords, words.length);

    const chunk = words.slice(start, end).join(" ");

    chunks.push(chunk);

    if (end === words.length) {
      break;
    }

    start = end - overlapWords;
  }

  return chunks;
}
