import { invokeLLM } from "../_core/llm";

/**
 * Translate English text to Japanese using GPT API
 * @param text - English text to translate
 * @returns Japanese translation
 */
export async function translateToJapanese(text: string): Promise<string> {
  const prompt = `以下の英文を自然な日本語に翻訳してください。段落構造を保持し、読みやすい翻訳を心がけてください。

英文:
${text}

日本語訳:`;

  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: "あなたは英語から日本語への翻訳を専門とする翻訳者です。自然で読みやすい日本語訳を提供してください。",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      maxTokens: 2000,
    });

    const firstChoice = response.choices[0];
    if (!firstChoice || !firstChoice.message) {
      throw new Error("No translation result");
    }

    const content = firstChoice.message.content;
    const translation = typeof content === "string" ? content : content[0]?.type === "text" ? content[0].text : "";
    return translation.trim();
  } catch (error) {
    console.error("Translation error:", error);
    throw new Error("Failed to translate text");
  }
}

/**
 * Translate multiple texts in batch
 * @param texts - Array of English texts to translate
 * @returns Array of Japanese translations
 */
export async function translateBatch(texts: string[]): Promise<string[]> {
  const translations: string[] = [];
  
  for (const text of texts) {
    try {
      const translation = await translateToJapanese(text);
      translations.push(translation);
    } catch (error) {
      console.error("Error translating text:", error);
      translations.push(""); // Push empty string on error
    }
  }
  
  return translations;
}
