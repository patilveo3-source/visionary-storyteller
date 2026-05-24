import { GoogleGenAI, Type, GenerateContentResponse, Modality } from "@google/genai";

export interface StoryData {
  script: string;
  characterDescription: string;
  scenes: {
    timestamp: string;
    narration: string;
    imagePrompt: string;
    videoPrompt: string;
  }[];
}

export async function generateStory(topic: string, aspectRatio: "16:9" | "9:16"): Promise<StoryData> {
  const apiKey = process.env.GEMINI_API_KEY!;
  const ai = new GoogleGenAI({ apiKey });
  
  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: `Generate a 2-minute voice-over script about "${topic}". 
    The visual style for all scenes MUST be "vector-style art" in a "whiteboard visual style".
    The aspect ratio for all scenes is ${aspectRatio}.
    
    The output must be a JSON object with:
    1. "script": The full 2-minute script.
    2. "characterDescription": A detailed physical description of a consistent main character for the story, optimized for vector whiteboard art.
    3. "scenes": An array of scenes, each with:
       - "timestamp": When this scene occurs (e.g., "0:15").
       - "narration": The specific lines spoken in this scene.
       - "imagePrompt": A detailed prompt for a high-quality vector whiteboard style image of this scene, including the character and the ${aspectRatio} aspect ratio.
       - "videoPrompt": A detailed prompt for a 5-second video animation of this scene in vector whiteboard style.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          script: { type: Type.STRING },
          characterDescription: { type: Type.STRING },
          scenes: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                timestamp: { type: Type.STRING },
                narration: { type: Type.STRING },
                imagePrompt: { type: Type.STRING },
                videoPrompt: { type: Type.STRING },
              },
              required: ["timestamp", "narration", "imagePrompt", "videoPrompt"]
            }
          }
        },
        required: ["script", "characterDescription", "scenes"]
      }
    }
  });

  return JSON.parse(response.text || "{}");
}

export async function generateImage(prompt: string, aspectRatio: "16:9" | "9:16" = "16:9"): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY!;
  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({
    model: 'gemini-3.1-flash-image-preview',
    contents: {
      parts: [{ text: prompt }],
    },
    config: {
      imageConfig: {
        aspectRatio: aspectRatio,
        imageSize: "1K"
      }
    },
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  throw new Error("No image generated");
}
