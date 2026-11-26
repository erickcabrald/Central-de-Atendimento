import { knowledgeBase } from "./knowledge-base.data.js";

export class KnowledgeBaseService {
  private normalize(text: string) {
    return text
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  }

  search(query: string) {
    const normalizedQuery = this.normalize(query);

    const words = normalizedQuery
      .split(/\s+/)
      .filter((word) => word.length > 2);

    const results = knowledgeBase
      .map((item) => {
        const title = this.normalize(item.title);
        const content = this.normalize(item.content);
        const keywords = item.keywords.map((keyword) =>
          this.normalize(keyword),
        );

        let score = 0;

        for (const word of words) {
          if (title.includes(word)) score += 3;
          if (keywords.some((keyword) => keyword.includes(word))) {
            score += 3;
          }
          if (content.includes(word)) score += 1;
        }

        if (title.includes(normalizedQuery)) {
          score += 3;
        }

        return {
          item,
          score,
        };
      })
      .filter((result) => result.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);

    return results.map((result) => result.item);
  }
}
