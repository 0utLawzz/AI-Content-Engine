import { Router } from "express";
import { GetPluginParams } from "@workspace/api-zod";

export const pluginsRouter = Router();

const PLUGINS = [
  { slug: "motivational-quotes", name: "Motivational Quotes", category: "Quotes", description: "Powerful quotes to inspire and motivate your audience every day.", previewImage: null, tags: ["quotes", "motivation", "inspiration"], isPopular: true },
  { slug: "islamic-quotes", name: "Islamic Quotes", category: "Quotes", description: "Wisdom from Islamic tradition — Quran verses, Hadith, and scholars.", previewImage: null, tags: ["quotes", "islamic", "faith"], isPopular: true },
  { slug: "stoic-wisdom", name: "Stoic Wisdom", category: "Quotes", description: "Timeless stoic philosophy from Marcus Aurelius, Epictetus, and Seneca.", previewImage: null, tags: ["quotes", "stoic", "philosophy"], isPopular: true },
  { slug: "book-summaries", name: "Book Summaries", category: "Education", description: "Condense bestselling books into powerful short-form video summaries.", previewImage: null, tags: ["education", "books", "learning"], isPopular: true },
  { slug: "business-tips", name: "Business Tips", category: "Business", description: "Actionable business insights for entrepreneurs and executives.", previewImage: null, tags: ["business", "entrepreneurship", "startup"], isPopular: false },
  { slug: "psychology-facts", name: "Psychology Facts", category: "Science", description: "Mind-bending psychology facts that explain why we do what we do.", previewImage: null, tags: ["psychology", "science", "mind"], isPopular: true },
  { slug: "daily-habits", name: "Daily Habits", category: "Lifestyle", description: "Small habits with massive compound effects. Practical and science-backed.", previewImage: null, tags: ["habits", "lifestyle", "productivity"], isPopular: false },
  { slug: "mini-stories", name: "Mini Stories", category: "Storytelling", description: "Micro-narratives — 60-second stories with a twist or lesson.", previewImage: null, tags: ["stories", "narrative", "creative"], isPopular: false },
  { slug: "kids-stories", name: "Kids Stories", category: "Kids", description: "Colorful, playful stories for children aged 3–10. Safe and engaging.", previewImage: null, tags: ["kids", "stories", "children"], isPopular: false },
  { slug: "language-learning", name: "Language Learning", category: "Education", description: "Vocabulary, phrases, and grammar tips in visual short-form format.", previewImage: null, tags: ["language", "education", "learning"], isPopular: false },
  { slug: "history-facts", name: "History Facts", category: "Education", description: "Fascinating moments from human history, told in 60 seconds.", previewImage: null, tags: ["history", "education", "facts"], isPopular: false },
  { slug: "science-facts", name: "Science Facts", category: "Science", description: "Mind-expanding science facts — space, biology, physics, and more.", previewImage: null, tags: ["science", "facts", "education"], isPopular: true },
  { slug: "health-tips", name: "Health Tips", category: "Health", description: "Evidence-based health and wellness tips for a better life.", previewImage: null, tags: ["health", "wellness", "fitness"], isPopular: false },
  { slug: "jokes", name: "Jokes", category: "Entertainment", description: "Clean, relatable jokes for high engagement and shareable content.", previewImage: null, tags: ["jokes", "humor", "entertainment"], isPopular: false },
];

pluginsRouter.get("/", async (req, res) => {
  res.json(PLUGINS);
});

pluginsRouter.get("/categories", async (req, res) => {
  const grouped: Record<string, typeof PLUGINS> = {};
  for (const plugin of PLUGINS) {
    if (!grouped[plugin.category]) grouped[plugin.category] = [];
    grouped[plugin.category].push(plugin);
  }
  res.json(Object.entries(grouped).map(([category, plugins]) => ({ category, plugins })));
});

pluginsRouter.get("/:slug", async (req, res) => {
  const params = GetPluginParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: "Invalid slug" }); return; }
  const plugin = PLUGINS.find((p) => p.slug === params.data.slug);
  if (!plugin) { res.status(404).json({ error: "Plugin not found" }); return; }
  res.json(plugin);
});
