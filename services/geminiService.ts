import { GoogleGenAI, Type, Modality } from "@google/genai";
import type { TarotAnalysis } from '../types';
import { majorArcana } from './tarotData';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const tarotCardListText = majorArcana.map(card => `- ${card.name}: ${card.keywords}`).join('\n');

export async function getTarotCardSuggestion(base64ImageData: string, mimeType: string): Promise<TarotAnalysis> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          {
            inlineData: {
              data: base64ImageData,
              mimeType: mimeType,
            },
          },
          {
            text: `Analyze the person in this image (their expression, attire, and overall aura). Provide a concise, one-sentence description of the person. Then, from the following list of 22 Major Arcana Tarot cards, choose the ONE that best represents them. Provide the exact card name and a brief, insightful explanation for your choice (max two sentences). Return ONLY the JSON object.\n\nHere is the list of cards and their meanings:\n${tarotCardListText}`,
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            personDescription: {
              type: Type.STRING,
              description: "A concise, one-sentence description of the person in the image."
            },
            cardName: {
              type: Type.STRING,
              description: "The name of the Major Arcana Tarot card (e.g., 'The Magician')."
            },
            explanation: {
              type: Type.STRING,
              description: "A brief, insightful explanation (max two sentences) for why this card was chosen."
            },
          },
          required: ["personDescription", "cardName", "explanation"],
        },
      },
    });

    const jsonString = response.text.trim();
    const result: TarotAnalysis = JSON.parse(jsonString);
    return result;

  } catch (error) {
    console.error("Error in getTarotCardSuggestion:", error);
    throw new Error("Failed to analyze the image and suggest a Tarot card.");
  }
}

export async function getSecondCardExplanation(base64ImageData: string, mimeType: string, firstCardAnalysis: TarotAnalysis, chosenCardName: string): Promise<{ explanation: string }> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          {
             inlineData: {
              data: base64ImageData,
              mimeType: mimeType,
            },
          },
          {
            text: `The person in the image has been identified as embodying '${firstCardAnalysis.cardName}'. The user has now actively chosen '${chosenCardName}' as their second card.

Based on the person in the image and their primary card, provide a brief, insightful explanation (max two sentences) for the significance of this choice. How does '${chosenCardName}' represent a path, challenge, or hidden aspect for them?

Return ONLY the JSON object.`,
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            explanation: {
              type: Type.STRING,
              description: "A brief, insightful explanation (max two sentences) for why this chosen card is relevant to the person."
            },
          },
          required: ["explanation"],
        },
      },
    });

    const jsonString = response.text.trim();
    const result: { explanation: string } = JSON.parse(jsonString);
    return result;

  } catch (error) {
    console.error("Error in getSecondCardExplanation:", error);
    throw new Error("Failed to generate an explanation for the chosen card.");
  }
}


export async function generateTarotImage(base64ImageData: string, mimeType: string, cardName: string): Promise<string> {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image-preview',
      contents: {
        parts: [
          {
            inlineData: {
              data: base64ImageData,
              mimeType: mimeType,
            },
          },
          {
            text: `Create a beautiful and artistic Tarot Card illustration for '${cardName}'. The main character of the card must be the person from the provided photograph.

**Key instructions:**
1. **Facial Likeness & Style:** Render the person's face in a detailed, illustrative style that harmonizes with the rest of the artwork. It is crucial that the facial features are clearly recognizable and true to the person in the photo, but they should be artistically interpreted, not photorealistically pasted. The goal is a seamless, natural-looking illustration.
2. **Mood & Color Matching:** Analyze the mood, lighting, and color palette of the original photograph. Incorporate these elements into the tarot card's overall aesthetic to create a cohesive feeling between the source image and the final artwork.
3. **Tarot Theming:** Weave in the traditional symbols, themes, and iconography associated with the '${cardName}' card into the background, clothing, and overall composition.
4. **Format:** The final image must be a vertical, portrait-oriented tarot card.`,
          },
        ],
      },
      config: {
          responseModalities: [Modality.IMAGE, Modality.TEXT],
      },
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        const imageBytes = part.inlineData.data;
        const imageMimeType = part.inlineData.mimeType;
        return `data:${imageMimeType};base64,${imageBytes}`;
      }
    }

    throw new Error("No image was generated by the model.");
  } catch (error) {
    console.error("Error in generateTarotImage:", error);
    throw new Error("Failed to generate the Tarot card image.");
  }
}
