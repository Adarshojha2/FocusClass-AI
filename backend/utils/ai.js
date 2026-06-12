const axios = require("axios");
const crypto = require("crypto");

const HUGGINGFACE_API_KEY = process.env.HF_API_KEY;

const fallbackSummary = (text) => {
  const sentences = text
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?])\s+/)
    .filter(Boolean);

  if (sentences.length === 0) return text;
  return sentences.slice(0, 2).join(" ");
};

const fallbackExplanation = (text, question) => {
  const simpleSummary = fallbackSummary(text);
  return `AI Explanation:\n${simpleSummary}\n\nQuestion: ${question} \nAnswer: This note is about the key points from your lecture. Use the summary above to understand the main concept clearly.`;
};

const generateSummary = async (text) => {
  if (!text) return "";

  if (!HUGGINGFACE_API_KEY) {
    return fallbackSummary(text);
  }

  try {
    const response = await axios.post(
      "https://api-inference.huggingface.co/models/facebook/bart-large-cnn",
      {
        inputs: text,
        parameters: { min_length: 40, max_length: 120 },
      },
      {
        headers: {
          Authorization: `Bearer ${HUGGINGFACE_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (response?.data?.summary_text) {
      return response.data.summary_text;
    }

    if (Array.isArray(response.data) && response.data[0]?.summary_text) {
      return response.data[0].summary_text;
    }

    return fallbackSummary(text);
  } catch (error) {
    console.error("Summary generation failed:", error.message);
    return fallbackSummary(text);
  }
};

const generateExplanation = async (text, question) => {
  if (!text || !question) {
    return "Please provide both the note content and a question for explanation.";
  }

  const prompt = `You are a helpful classroom assistant. Answer the user's question about the note in a simple and easy-to-understand way. The note content is below:\n\n${text}\n\nQuestion: ${question}`;

  if (!HUGGINGFACE_API_KEY) {
    return fallbackExplanation(text, question);
  }

  try {
    const response = await axios.post(
      "https://api-inference.huggingface.co/models/google/flan-t5-small",
      {
        inputs: prompt,
        parameters: { max_new_tokens: 150 },
      },
      {
        headers: {
          Authorization: `Bearer ${HUGGINGFACE_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (typeof response.data === "string") {
      return response.data;
    }

    if (Array.isArray(response.data) && response.data[0]?.generated_text) {
      return response.data[0].generated_text;
    }

    if (response.data?.generated_text) {
      return response.data.generated_text;
    }

    return fallbackExplanation(text, question);
  } catch (error) {
    console.error("Explanation generation failed:", error.message);
    return fallbackExplanation(text, question);
  }
};

const computeImageHash = (buffer) => {
  if (!buffer) return null;
  return crypto.createHash("sha256").update(buffer).digest("hex");
};

const matchImageByHash = (storedHash, buffer) => {
  if (!storedHash || !buffer) return false;
  const hash = computeImageHash(buffer);
  return hash === storedHash;
};

module.exports = {
  generateSummary,
  generateExplanation,
  computeImageHash,
  matchImageByHash,
};
