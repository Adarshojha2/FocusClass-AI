const axios = require("axios");

const HUGGINGFACE_API_KEY = process.env.HF_API_KEY;

const askProblem = async (req, res) => {
  try {
    const { question } = req.body;
    if (!question) {
      return res.status(400).json({ message: "Please provide a question." });
    }

    const lowerQ = question.toLowerCase();
    let answer = "";

    // Professional rule-based responses for high reliability on classroom topics
    if (lowerQ.includes("attendance")) {
      answer = "FocusClass AI marks your attendance automatically when you join a class session. Your face verification photo is matched with your registered profile photo to prevent attendance fraud.";
    } else if (lowerQ.includes("assignment") || lowerQ.includes("task")) {
      answer = "Teachers can create assignments in the Assignment panel. You can view deadlines, descriptions, and submit your homework directly from your Student Dashboard.";
    } else if (lowerQ.includes("distract") || lowerQ.includes("app block") || lowerQ.includes("lock")) {
      answer = "The Focus tracker monitors if you open social media apps (like YouTube, TikTok, Instagram) during active classes. Switching tabs or opening blocked apps will lower your Focus Score and might auto-mark you as absent.";
    } else if (lowerQ.includes("principal") || lowerQ.includes("message")) {
      answer = "You can send direct messages to the Principal using the 'Message Principal' box. The Principal can also broadcast messages specifically to students or teachers.";
    } else if (lowerQ.includes("otp") || lowerQ.includes("login") || lowerQ.includes("gmail")) {
      answer = "Students must verify their login with a 6-digit OTP sent to their Gmail. Additionally, your student dashboard must be activated by a Teacher or Principal before you can access all features.";
    } else if (lowerQ.includes("absent") || lowerQ.includes("screen switched") || lowerQ.includes("webcam")) {
      answer = "If you switch tabs, leave the window, or go offline while a class is active, the system automatically marks you as absent. Furthermore, the webcam periodic check verifies if you are sitting on the screen during the live class session.";
    }

    // If we didn't match a quick local QA rule and have an API key, call Hugging Face
    if (!answer) {
      if (HUGGINGFACE_API_KEY) {
        try {
          const prompt = `You are a helpful classroom assistant called FocusClass AI. Answer this question concisely:\n\nQuestion: ${question}`;
          const response = await axios.post(
            "https://api-inference.huggingface.co/models/google/flan-t5-small",
            {
              inputs: prompt,
              parameters: { max_new_tokens: 120 },
            },
            {
              headers: {
                Authorization: `Bearer ${HUGGINGFACE_API_KEY}`,
                "Content-Type": "application/json",
              },
            }
          );

          if (response.data?.[0]?.generated_text) {
            answer = response.data[0].generated_text;
          } else if (response.data?.generated_text) {
            answer = response.data.generated_text;
          }
        } catch (error) {
          console.error("HF API Chat error:", error.message);
        }
      }

      // Final fallback if no API key or API call failed
      if (!answer) {
        answer = `FocusClass AI Assistant:\nThis is a smart helper. To solve '${question}': Try checking your class materials, lecture notes, or syllabus. For specific inquiries, you can also ask your teacher or send a direct message to the principal.`;
      }
    }

    res.json({ answer });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  askProblem,
};
