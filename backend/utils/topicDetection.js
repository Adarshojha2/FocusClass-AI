const axios = require("axios");

const keywords = {
  CRITICAL: [
    "important",
    "remember",
    "don't forget",
    "key",
    "essential",
    "crucial",
    "must know",
    "exam",
    "definition",
    "concept",
  ],
  HIGH: [
    "note",
    "significant",
    "focus on",
    "pay attention",
    "valuable",
    "noteworthy",
  ],
};

// Simple keyword-based topic detection
const detectImportantTopics = (text) => {
  if (!text || text.length < 20) return [];

  const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
  const topics = [];
  let currentTimestamp = 0;

  sentences.forEach((sentence, index) => {
    const lowerSentence = sentence.toLowerCase();
    let importance = "Low";
    let foundKeyword = false;

    // Check for critical keywords
    for (const keyword of keywords.CRITICAL) {
      if (lowerSentence.includes(keyword)) {
        importance = "Critical";
        foundKeyword = true;
        break;
      }
    }

    // Check for high keywords if no critical found
    if (!foundKeyword) {
      for (const keyword of keywords.HIGH) {
        if (lowerSentence.includes(keyword)) {
          importance = "High";
          foundKeyword = true;
          break;
        }
      }
    }

    // If important keywords found, extract the main topic
    if (foundKeyword) {
      const words = sentence.trim().split(" ");
      const topic = words.slice(0, Math.min(8, words.length)).join(" ");
      topics.push({
        topic: topic.replace(/[^a-zA-Z0-9\s]/g, ""),
        importance,
        confidence: importance === "Critical" ? 0.95 : 0.8,
        timestamp: currentTimestamp + index * 30, // Estimate 30 sec per sentence
      });
    }
  });

  return topics;
};

// Advanced AI-based topic detection using Hugging Face
const detectTopicsWithAI = async (text) => {
  try {
    if (!text || text.length < 100) {
      return detectImportantTopics(text);
    }

    const response = await axios.post(
      "https://api-inference.huggingface.co/models/facebook/bart-large-mnli",
      {
        inputs: text,
        parameters: {
          candidate_labels: [
            "important concept",
            "definition",
            "example",
            "exam tip",
            "assignment",
          ],
        },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.HF_API_KEY}`,
        },
      }
    );

    return response.data || detectImportantTopics(text);
  } catch (error) {
    console.log("AI topic detection failed, using keyword method:", error.message);
    return detectImportantTopics(text);
  }
};

// Analyze transcript for learning patterns
const analyzeLearningPatterns = (transcript) => {
  if (!transcript) return { topics: [], sentiment: "neutral" };

  const sentences = transcript.split(/[.!?]+/);
  const topicFrequency = {};

  sentences.forEach((sentence) => {
    const words = sentence
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 5);
    words.forEach((word) => {
      topicFrequency[word] = (topicFrequency[word] || 0) + 1;
    });
  });

  // Get most frequent topics (likely important)
  const sortedTopics = Object.entries(topicFrequency)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([topic]) => topic);

  return {
    topics: sortedTopics,
    sentiment: sentences.length > 10 ? "positive" : "neutral",
    keywordCount: sentences.length,
  };
};

module.exports = {
  detectImportantTopics,
  detectTopicsWithAI,
  analyzeLearningPatterns,
};
