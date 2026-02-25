import type { Article, AIClient, ScoredArticle, SummaryResult } from './types.ts';
import { AI_BATCH_SIZE, MAX_CONCURRENT_AI, AI_MAX_RETRIES } from './types.ts';
import { parseJsonResponse } from './ai-client.ts';

function buildSummaryPromptZh(
  articlesList: string
): string {
  return `你是一个技术内容摘要专家。请为以下文章完成三件事：

1. **中文标题** (titleZh): 将英文标题翻译成自然的中文。如果原标题已经是中文则保持不变。
2. **摘要** (summary): 4-6 句话的结构化摘要，让读者不点进原文也能了解核心内容。包含：
   - 文章讨论的核心问题或主题（1 句）
   - 关键论点、技术方案或发现（2-3 句）
   - 结论或作者的核心观点（1 句）
3. **推荐理由** (reason): 1 句话说明"为什么值得读"，区别于摘要（摘要说"是什么"，推荐理由说"为什么"）。

请用中文撰写摘要和推荐理由。如果原文是英文，请翻译为中文。标题翻译也用中文。

摘要要求：
- 直接说重点，不要用"本文讨论了..."、"这篇文章介绍了..."这种开头
- 包含具体的技术名词、数据、方案名称或观点
- 保留关键数字和指标（如性能提升百分比、用户数、版本号等）
- 如果文章涉及对比或选型，要点出比较对象和结论
- 目标：读者花 30 秒读完摘要，就能决定是否值得花 10 分钟读原文

## 待摘要文章

${articlesList}

请严格按 JSON 格式返回：
{
  "results": [
    {
      "index": 0,
      "titleZh": "中文翻译的标题",
      "summary": "摘要内容...",
      "reason": "推荐理由..."
    }
  ]
}`;
}

function buildSummaryPromptEn(
  articlesList: string
): string {
  return `You are a technical content summarization expert. For each article below, produce three things:

1. **Localized title** (titleZh): If the original title is in a non-English language, translate it into natural English. If already English, keep it as-is.
2. **Summary** (summary): A structured summary of 4-6 sentences so readers can grasp the core content without clicking through. Include:
   - The core problem or topic discussed (1 sentence)
   - Key arguments, technical approaches, or findings (2-3 sentences)
   - Conclusion or the author's main takeaway (1 sentence)
3. **Recommendation reason** (reason): 1 sentence explaining "why this is worth reading", distinct from the summary (summary = "what it is", reason = "why it matters").

ALL output — titleZh, summary, reason — MUST be in English. Do NOT use any Chinese characters.

Summary requirements:
- Get to the point directly; do NOT start with "This article discusses..." or "The author introduces..."
- Include specific technical terms, data, solution names, or viewpoints
- Preserve key numbers and metrics (performance improvements, user counts, version numbers, etc.)
- If the article involves comparisons, state the compared items and the conclusion
- Goal: a reader spends 30 seconds on the summary and can decide whether to spend 10 minutes on the original

## Articles to summarize

${articlesList}

Return strictly as JSON:
{
  "results": [
    {
      "index": 0,
      "titleZh": "English title here",
      "summary": "Summary content...",
      "reason": "Recommendation reason..."
    }
  ]
}`;
}

function buildSummaryPrompt(
  articles: Array<{ index: number; title: string; description: string; sourceName: string; link: string }>,
  lang: 'zh' | 'en'
): string {
  const articlesList = articles.map(a =>
    `Index ${a.index}: [${a.sourceName}] ${a.title}\nURL: ${a.link}\n${a.description.slice(0, 800)}`
  ).join('\n\n---\n\n');

  return lang === 'en' ? buildSummaryPromptEn(articlesList) : buildSummaryPromptZh(articlesList);
}

export async function summarizeArticles(
  articles: Array<Article & { index: number }>,
  aiClient: AIClient,
  lang: 'zh' | 'en'
): Promise<Map<number, { titleZh: string; summary: string; reason: string }>> {
  const summaries = new Map<number, { titleZh: string; summary: string; reason: string }>();

  const indexed = articles.map(a => ({
    index: a.index,
    title: a.title,
    description: a.description,
    sourceName: a.sourceName,
    link: a.link,
  }));

  const batches: typeof indexed[] = [];
  for (let i = 0; i < indexed.length; i += AI_BATCH_SIZE) {
    batches.push(indexed.slice(i, i + AI_BATCH_SIZE));
  }

  console.log(`[digest] Generating summaries for ${articles.length} articles in ${batches.length} batches`);

  for (let i = 0; i < batches.length; i += MAX_CONCURRENT_AI) {
    const batchGroup = batches.slice(i, i + MAX_CONCURRENT_AI);
    const promises = batchGroup.map(async (batch) => {
      const prompt = buildSummaryPrompt(batch, lang);
      let lastError: Error | undefined;
      for (let attempt = 0; attempt <= AI_MAX_RETRIES; attempt++) {
        try {
          const responseText = await aiClient.call(prompt);
          const parsed = parseJsonResponse<SummaryResult>(responseText);

          if (parsed.results && Array.isArray(parsed.results)) {
            for (const result of parsed.results) {
              summaries.set(result.index, {
                titleZh: result.titleZh || '',
                summary: result.summary || '',
                reason: result.reason || '',
              });
            }
          }
          return; // success
        } catch (error) {
          lastError = error instanceof Error ? error : new Error(String(error));
          if (attempt < AI_MAX_RETRIES) {
            console.warn(`[digest] Summary batch attempt ${attempt + 1} failed: ${lastError.message}, retrying...`);
            await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
          }
        }
      }
      console.warn(`[digest] Summary batch failed after ${AI_MAX_RETRIES + 1} attempts: ${lastError!.message}`);
      for (const item of batch) {
        summaries.set(item.index, { titleZh: item.title, summary: item.title, reason: '' });
      }
    });

    await Promise.all(promises);
    console.log(`[digest] Summary progress: ${Math.min(i + MAX_CONCURRENT_AI, batches.length)}/${batches.length} batches`);
  }

  return summaries;
}

export async function generateHighlights(
  articles: ScoredArticle[],
  aiClient: AIClient,
  lang: 'zh' | 'en'
): Promise<string> {
  const articleList = articles.slice(0, 10).map((a, i) =>
    `${i + 1}. [${a.category}] ${a.titleZh || a.title} \u2014 ${a.summary.slice(0, 100)}`
  ).join('\n');

  const prompt = lang === 'en'
    ? `Based on the following curated tech articles of the day, write a 3-5 sentence "Today's Highlights" summary.

Requirements:
- Distill 2-3 major trends or themes from today's tech scene
- Do NOT list articles one by one; synthesize at a macro level
- Style: concise and punchy, like a news lede
- Write ENTIRELY in English. Do NOT use any Chinese characters.

Articles:
${articleList}

Return plain text only. No JSON, no markdown formatting.`
    : `根据以下今日精选技术文章列表，写一段 3-5 句话的"今日看点"总结。
要求：
- 提炼出今天技术圈的 2-3 个主要趋势或话题
- 不要逐篇列举，要做宏观归纳
- 风格简洁有力，像新闻导语
用中文回答。

文章列表：
${articleList}

直接返回纯文本总结，不要 JSON，不要 markdown 格式。`;

  try {
    const text = await aiClient.call(prompt);
    return text.trim();
  } catch (error) {
    console.warn(`[digest] Highlights generation failed: ${error instanceof Error ? error.message : String(error)}`);
    return '';
  }
}
