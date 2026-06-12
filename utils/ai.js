const axios = require("axios");
const crypto = require("crypto");

const generateSummary = async (text) => {
  try {
    const response = await axios.post(
      "https://api-inference.huggingface.co/models/facebook/bart-large-cnn",
      {
        inputs: text,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.HF_API_KEY}`,
        },
      }
    );

    return response.data[0]?.summary_text || "";
  } catch (error) {
    console.log(error.message);
    return "";
  }
};

module.exports = { generateSummary };

const computeImageHash = (buffer) => {
  try {
    return crypto.createHash("sha256").update(buffer).digest("hex");
  } catch (err) {
    console.error("Hash error", err.message);
    return null;
  }
};

const matchImageByHash = (storedHash, buffer) => {
  if (!storedHash || !buffer) return false;
  const h = computeImageHash(buffer);
  return h === storedHash;
};

module.exports = { generateSummary, computeImageHash, matchImageByHash };