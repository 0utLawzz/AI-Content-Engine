import type { AIProvider, AIGenerateOptions, NormalizedScene } from "../interfaces";

const CONTENT_BANKS: Record<string, Array<{ text: string; voice: string; keywords: string[] }>> = {
  motivation: [
    { text: "Your only limit is your mind.", voice: "Your only limit is your mind. Break free from self-imposed boundaries and achieve the extraordinary.", keywords: ["mindset", "limits", "growth"] },
    { text: "Small steps every day lead to big results.", voice: "Small steps every day lead to big results. Consistency beats intensity every single time.", keywords: ["consistency", "habits", "progress"] },
    { text: "Doubt kills more dreams than failure ever will.", voice: "Doubt kills more dreams than failure ever will. Act before you're ready.", keywords: ["doubt", "action", "dreams"] },
    { text: "The harder you work, the luckier you get.", voice: "The harder you work, the luckier you get. Luck is preparation meeting opportunity.", keywords: ["work", "luck", "opportunity"] },
    { text: "Fall seven times, stand up eight.", voice: "Fall seven times, stand up eight. Resilience is the foundation of all greatness.", keywords: ["resilience", "perseverance", "strength"] },
    { text: "You don't have to be great to start, but you have to start to be great.", voice: "You don't have to be great to start, but you have to start to be great. Begin today.", keywords: ["start", "beginning", "greatness"] },
    { text: "Success is the sum of small efforts repeated daily.", voice: "Success is the sum of small efforts repeated daily. Your habits determine your future.", keywords: ["success", "effort", "daily"] },
    { text: "The best time to plant a tree was 20 years ago. The second best time is now.", voice: "The best time to plant a tree was 20 years ago. The second best time is now. Start today.", keywords: ["timing", "now", "action"] },
  ],
  wisdom: [
    { text: "The mind is everything. What you think, you become.", voice: "The mind is everything. What you think, you become. Guard your thoughts carefully.", keywords: ["mind", "thoughts", "philosophy"] },
    { text: "Know yourself and you will win all battles.", voice: "Know yourself and you will win all battles. Self-awareness is the ultimate advantage.", keywords: ["self-knowledge", "wisdom", "strategy"] },
    { text: "We suffer more in imagination than in reality.", voice: "We suffer more in imagination than in reality. Most fears never materialize.", keywords: ["stoic", "fear", "imagination"] },
    { text: "The obstacle is the way.", voice: "The obstacle is the way. Every challenge is an opportunity disguised as a problem.", keywords: ["stoic", "obstacles", "growth"] },
    { text: "Waste no more time arguing about what a good person should be. Be one.", voice: "Waste no more time arguing about what a good person should be. Be one. Action over theory.", keywords: ["stoic", "virtue", "action"] },
    { text: "He who has a why can bear almost any how.", voice: "He who has a why can bear almost any how. Purpose is the source of all endurance.", keywords: ["purpose", "meaning", "endurance"] },
  ],
  business: [
    { text: "Build something you're proud of, not just something profitable.", voice: "Build something you're proud of, not just something profitable. Legacy outlasts revenue.", keywords: ["business", "purpose", "legacy"] },
    { text: "Your network is your net worth.", voice: "Your network is your net worth. Invest in relationships as seriously as you invest in skills.", keywords: ["networking", "relationships", "growth"] },
    { text: "Revenue is vanity. Profit is sanity. Cash is reality.", voice: "Revenue is vanity. Profit is sanity. Cash is reality. Know your numbers.", keywords: ["finance", "profit", "business"] },
    { text: "The best marketing is a product people can't stop talking about.", voice: "The best marketing is a product people can't stop talking about. Build remarkable things.", keywords: ["marketing", "product", "word-of-mouth"] },
    { text: "Hire slowly, fire fast. Culture is everything.", voice: "Hire slowly, fire fast. Culture is everything. One wrong hire can poison the whole team.", keywords: ["hiring", "culture", "team"] },
    { text: "Ideas are worth nothing without execution.", voice: "Ideas are worth nothing without execution. The world rewards those who ship.", keywords: ["execution", "ideas", "action"] },
  ],
  science: [
    { text: "The universe is under no obligation to make sense to you.", voice: "The universe is under no obligation to make sense to you. Stay curious anyway.", keywords: ["science", "universe", "curiosity"] },
    { text: "Neurons that fire together wire together.", voice: "Neurons that fire together wire together. Every repeated thought literally reshapes your brain.", keywords: ["neuroscience", "brain", "learning"] },
    { text: "The human brain has 86 billion neurons.", voice: "The human brain has 86 billion neurons, each connected to thousands of others. You are the most complex thing in the known universe.", keywords: ["brain", "neuroscience", "facts"] },
    { text: "Water has memory. Your cells are 70% water.", voice: "Water has memory. Your cells are 70% water. What are you filling yourself with?", keywords: ["science", "water", "biology"] },
    { text: "Light travels at 186,000 miles per second.", voice: "Light travels at 186,000 miles per second. The light from the sun you see right now left 8 minutes ago.", keywords: ["physics", "light", "space"] },
  ],
  health: [
    { text: "Sleep is the best performance enhancer on Earth.", voice: "Sleep is the best performance enhancer on Earth. Eight hours of sleep beats any supplement.", keywords: ["sleep", "health", "performance"] },
    { text: "Movement is medicine.", voice: "Movement is medicine. The body was designed to move. Sitting is the new smoking.", keywords: ["exercise", "movement", "health"] },
    { text: "You are what you repeatedly do.", voice: "You are what you repeatedly do. Every meal, every night of sleep, every workout shapes who you become.", keywords: ["habits", "health", "lifestyle"] },
    { text: "Your gut is your second brain.", voice: "Your gut is your second brain. 90% of serotonin is produced in the digestive system. Feed it well.", keywords: ["gut", "brain", "health"] },
    { text: "Stress is the silent killer. Breathe.", voice: "Stress is the silent killer. Three deep breaths can lower cortisol by 30% in under a minute.", keywords: ["stress", "breathing", "wellness"] },
  ],
  kids: [
    { text: "You are braver than you believe.", voice: "You are braver than you believe, stronger than you seem, and smarter than you think.", keywords: ["kids", "bravery", "confidence"] },
    { text: "Every expert was once a beginner.", voice: "Every expert was once a beginner. Keep practicing and one day you'll be amazing.", keywords: ["kids", "learning", "practice"] },
    { text: "It's okay to make mistakes. That's how we learn!", voice: "It's okay to make mistakes. That's how we learn! Every mistake is just a step on the path to greatness.", keywords: ["kids", "mistakes", "learning"] },
    { text: "Be kind. Always.", voice: "Be kind. Always. Kindness is free and it can change someone's entire day.", keywords: ["kids", "kindness", "values"] },
  ],
};

const TONE_TEMPLATES: Record<string, string> = {
  inspirational: "inspirational",
  educational: "educational",
  entertaining: "entertaining",
  professional: "professional",
  casual: "casual",
};

function getContentBank(topic: string) {
  const normalized = topic.toLowerCase();
  if (normalized.includes("motiv") || normalized.includes("inspir")) return CONTENT_BANKS.motivation;
  if (normalized.includes("wisdom") || normalized.includes("stoic") || normalized.includes("philos")) return CONTENT_BANKS.wisdom;
  if (normalized.includes("business") || normalized.includes("entrepreneur") || normalized.includes("market")) return CONTENT_BANKS.business;
  if (normalized.includes("science") || normalized.includes("fact") || normalized.includes("physics") || normalized.includes("bio")) return CONTENT_BANKS.science;
  if (normalized.includes("health") || normalized.includes("wellness") || normalized.includes("fitness") || normalized.includes("sleep")) return CONTENT_BANKS.health;
  if (normalized.includes("kid") || normalized.includes("child") || normalized.includes("story")) return CONTENT_BANKS.kids;
  return CONTENT_BANKS.motivation;
}

export const localProvider: AIProvider = {
  name: "local",

  async generate(opts: AIGenerateOptions): Promise<NormalizedScene[]> {
    const bank = getContentBank(opts.topic);
    const count = Math.min(opts.count, 20);
    const scenes: NormalizedScene[] = [];

    for (let i = 0; i < count; i++) {
      const item = bank[i % bank.length];
      scenes.push({
        order: i,
        text: item.text,
        voiceScript: item.voice,
        cta: i === 0 ? "Follow for more" : i === count - 1 ? "Share this" : null,
        duration: 5 + Math.random() * 4,
        animationPreset: opts.style ?? "modern",
        backgroundType: "gradient",
        subtitleMode: opts.tone === "educational" ? "word_highlight" : "sentence",
        keywords: item.keywords,
        thumbnailHint: item.text.split(".")[0],
      });
    }

    return scenes;
  },
};
