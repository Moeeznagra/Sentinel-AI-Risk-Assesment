import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Initialize Gemini
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

app.use(express.json());

// API Routes
app.post("/api/analyze-policy", async (req, res) => {
  const { policyText } = req.body;

  if (!policyText) {
    return res.status(400).json({ error: "No policy text provided" });
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analyze the following security policy and map it to the NIST Cybersecurity Framework (CSF) 2.0 functions: Identify (ID), Protect (PR), Detect (DE), Respond (RS), and Recover (RC). 
      
      For each function, provide:
      1. A completion percentage (0-100) based on how well the policy covers the requirements for that category.
      2. Key mapped controls found in the text.
      3. Critical gaps where the policy is lacking.
      
      Policy Text:
      ${policyText}
      
      Return the analysis in a structured JSON format.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            assessment: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  function: { type: Type.STRING, description: "NIST CSF Function name (e.g. Identify)" },
                  code: { type: Type.STRING, description: "Function code (e.g. ID)" },
                  percentage: { type: Type.NUMBER, description: "Coverage percentage 0-100" },
                  findings: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Specific controls found" },
                  gaps: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Missing elements" }
                },
                required: ["function", "code", "percentage", "findings", "gaps"]
              }
            },
            summary: { type: Type.STRING, description: "High level executive summary" }
          },
          required: ["assessment", "summary"]
        }
      }
    });

    res.json(JSON.parse(response.text));
  } catch (error: any) {
    console.error("Gemini Error:", error);
    res.status(500).json({ error: "Failed to analyze policy", details: error.message });
  }
});

app.post("/api/chat", async (req, res) => {
  const { message, context } = req.body;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `You are an expert Cybersecurity Risk Assessor. Use the following policy context to answer the user's question. Be professional and technical.
      
      Context:
      ${context}
      
      User Question:
      ${message}`,
    });

    res.json({ text: response.text });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to chat", details: error.message });
  }
});

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
