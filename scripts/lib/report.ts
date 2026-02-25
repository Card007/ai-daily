import type { ScoredArticle } from './types.ts';
import { CATEGORY_META } from './types.ts';
import {
  humanizeTime,
} from './visualization.ts';

const i18n = {
  zh: {
    title: '📰 AI 博客每日精选',
    subtitle: (totalFeeds: number, topN: number) =>
      `来自 Karpathy 推荐的 ${totalFeeds} 个顶级技术博客，AI 精选 Top ${topN}`,
    highlights: '📝 今日看点',
    mustRead: '🏆 今日必读',
    whyRead: '为什么值得读',
    footer: (dateStr: string, time: string, successFeeds: number, totalArticles: number, timeDesc: string, filteredArticles: number, topN: number) =>
      `*生成于 ${dateStr} ${time} | 扫描 ${successFeeds} 源 · 共 ${totalArticles} 篇 · ${timeDesc} ${filteredArticles} 篇 · 精选 ${topN} 篇*`,
    timeDesc: (date: string | undefined, hours: number) =>
      date ? `${date} 当日` : `${hours}h 内新发布`,
    source: `*基于 [Hacker News Popularity Contest 2025](https://refactoringenglish.com/tools/hn-popularity/) RSS 源列表，由 [Andrej Karpathy](https://x.com/karpathy) 推荐*`,
  },
  en: {
    title: '📰 AI Blog Daily Picks',
    subtitle: (totalFeeds: number, topN: number) =>
      `AI-curated Top ${topN} from ${totalFeeds} top tech blogs recommended by Karpathy`,
    highlights: '📝 Today\'s Highlights',
    mustRead: '🏆 Must Read',
    whyRead: 'Why Read This',
    footer: (dateStr: string, time: string, successFeeds: number, totalArticles: number, timeDesc: string, filteredArticles: number, topN: number) =>
      `*Generated at ${dateStr} ${time} | Scanned ${successFeeds} feeds · ${totalArticles} total · ${timeDesc} ${filteredArticles} articles · Top ${topN} selected*`,
    timeDesc: (date: string | undefined, hours: number) =>
      date ? `${date}` : `last ${hours}h`,
    source: `*Based on [Hacker News Popularity Contest 2025](https://refactoringenglish.com/tools/hn-popularity/) RSS feed list, recommended by [Andrej Karpathy](https://x.com/karpathy)*`,
  },
} as const;

export function generateDigestReport(articles: ScoredArticle[], highlights: string, stats: {
  totalFeeds: number;
  successFeeds: number;
  totalArticles: number;
  filteredArticles: number;
  hours: number;
  date?: string;
  lang: string;
}): string {
  const now = new Date();
  const dateStr = stats.date || now.toISOString().split('T')[0];
  const t = stats.lang === 'en' ? i18n.en : i18n.zh;
  const isEn = stats.lang === 'en';
  const catLabel = (cat: keyof typeof CATEGORY_META) => {
    const meta = CATEGORY_META[cat];
    return isEn ? meta.labelEn : meta.label;
  };

  let report = `# ${t.title} — ${dateStr}\n\n`;
  report += `> ${t.subtitle(stats.totalFeeds, articles.length)}\n\n`;

  if (highlights) {
    report += `## ${t.highlights}\n\n`;
    report += `${highlights}\n\n`;
    report += `---\n\n`;
  }

  if (articles.length >= 3) {
    report += `## ${t.mustRead}\n\n`;
    for (let i = 0; i < Math.min(3, articles.length); i++) {
      const a = articles[i];
      const medal = ['🥇', '🥈', '🥉'][i];
      const catMeta = CATEGORY_META[a.category];

      report += `${medal} **${a.titleZh || a.title}**\n\n`;
      report += `[${a.title}](${a.link}) — ${a.sourceName} · ${humanizeTime(a.pubDate)} · ${catMeta.emoji} ${catLabel(a.category)}\n\n`;
      report += `> ${a.summary}\n\n`;
      if (a.reason) {
        report += `💡 **${t.whyRead}**: ${a.reason}\n\n`;
      }
      if (a.keywords.length > 0) {
        report += `🏷️ ${a.keywords.join(', ')}\n\n`;
      }
    }
    report += `---\n\n`;
  }

  const categoryGroups = new Map<string, ScoredArticle[]>();
  for (const a of articles) {
    const list = categoryGroups.get(a.category) || [];
    list.push(a);
    categoryGroups.set(a.category, list);
  }

  const sortedCategories = Array.from(categoryGroups.entries())
    .sort((a, b) => b[1].length - a[1].length);

  let globalIndex = 0;
  for (const [catId, catArticles] of sortedCategories) {
    const catMeta = CATEGORY_META[catId as keyof typeof CATEGORY_META];
    report += `## ${catMeta.emoji} ${catLabel(catId as keyof typeof CATEGORY_META)}\n\n`;

    for (const a of catArticles) {
      globalIndex++;
      const scoreTotal = a.scoreBreakdown.relevance + a.scoreBreakdown.quality + a.scoreBreakdown.timeliness;

      report += `### ${globalIndex}. ${a.titleZh || a.title}\n\n`;
      report += `[${a.title}](${a.link}) — **${a.sourceName}** · ${humanizeTime(a.pubDate)} · ⭐ ${scoreTotal}/30\n\n`;
      report += `> ${a.summary}\n\n`;
      if (a.keywords.length > 0) {
        report += `🏷️ ${a.keywords.join(', ')}\n\n`;
      }
      report += `---\n\n`;
    }
  }

  const timeDesc = t.timeDesc(stats.date, stats.hours);
  const time = now.toISOString().split('T')[1]?.slice(0, 5) || '';
  report += `${t.footer(dateStr, time, stats.successFeeds, stats.totalArticles, timeDesc, stats.filteredArticles, articles.length)}\n`;
  report += `${t.source}\n`;

  return report;
}
