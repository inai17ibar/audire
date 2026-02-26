import { z } from "zod";
import { COOKIE_NAME } from "../shared/const.js";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { invokeLLM } from "./_core/llm";
import { transcribeAudio } from "./_core/voiceTranscription";
import { storagePut } from "./storage";
import { scrapeEngooArticles, scrapeArticleDetail } from "./lib/engoo-scraper";
import { scrapeBBCArticles, scrapeBBCArticleDetail } from "./lib/bbc-scraper";
import { scrapeVOAArticles, scrapeVOAArticleDetail } from "./lib/voa-scraper";
import { translateToJapanese } from "./lib/translator";
import { getDb } from "./db";
import { articles } from "../drizzle/schema";
import { desc, and, eq } from "drizzle-orm";
import { cronRouter } from "./routers/cron";

export const appRouter = router({
  // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  cron: cronRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // Article Distribution API
  articles: router({
    // Get articles from database
    getArticles: publicProcedure
      .input(z.object({
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
        source: z.enum(["bbc", "voa", "engoo", "all"]).default("all"),
        category: z.string().optional(),
        level: z.number().min(1).max(10).optional(),
      }))
      .query(async ({ input }) => {
        try {
          const conditions = [];
          
          if (input.source !== "all") {
            conditions.push(eq(articles.source, input.source));
          }
          
          if (input.category) {
            conditions.push(eq(articles.category, input.category));
          }
          
          if (input.level) {
            conditions.push(eq(articles.level, input.level));
          }
          
          const db = await getDb();
          if (!db) {
            throw new Error("Database not available");
          }
          
          const result = await db.query.articles.findMany({
            where: conditions.length > 0 ? and(...conditions) : undefined,
            orderBy: [desc(articles.createdAt)],
            limit: input.limit,
            offset: input.offset,
          });
          
          return result;
        } catch (error) {
          console.error("Error fetching articles from database:", error);
          throw new Error("Failed to fetch articles");
        }
      }),
  }),

  // Multi-source News Scraper (deprecated, use articles.getArticles instead)
  news: router({
    // Fetch articles from multiple sources
    fetchArticles: publicProcedure
      .input(z.object({ 
        source: z.enum(["engoo", "bbc", "voa"]).default("engoo"),
        limit: z.number().min(1).max(50).default(20) 
      }))
      .query(async ({ input }) => {
        try {
          let articles;
          switch (input.source) {
            case "bbc":
              articles = await scrapeBBCArticles(input.limit);
              break;
            case "voa":
              articles = await scrapeVOAArticles(input.limit);
              break;
            case "engoo":
            default:
              articles = await scrapeEngooArticles(input.limit);
              break;
          }
          return { articles, source: input.source };
        } catch (error) {
          console.error(`Error fetching ${input.source} articles:`, error);
          throw new Error("Failed to fetch articles");
        }
      }),
    // Fetch article detail from any source
    fetchArticleDetail: publicProcedure
      .input(z.object({ 
        url: z.string().url(),
        source: z.enum(["engoo", "bbc", "voa"]).default("engoo")
      }))
      .query(async ({ input }) => {
        try {
          let article;
          switch (input.source) {
            case "bbc":
              article = await scrapeBBCArticleDetail(input.url);
              break;
            case "voa":
              article = await scrapeVOAArticleDetail(input.url);
              break;
            case "engoo":
            default:
              article = await scrapeArticleDetail(input.url);
              break;
          }
          if (!article) {
            throw new Error("Article not found");
          }
          return { article };
        } catch (error) {
          console.error(`Error fetching ${input.source} article detail:`, error);
          throw new Error("Failed to fetch article detail");
        }
      }),
  }),

  // Legacy Engoo-only endpoints (deprecated, use news.* instead)
  engoo: router({
    fetchArticles: publicProcedure
      .input(z.object({ limit: z.number().min(1).max(50).default(20) }))
      .query(async ({ input }) => {
        try {
          const articles = await scrapeEngooArticles(input.limit);
          return { articles };
        } catch (error) {
          console.error("Error fetching Engoo articles:", error);
          throw new Error("Failed to fetch articles");
        }
      }),
    fetchArticleDetail: publicProcedure
      .input(z.object({ url: z.string().url() }))
      .query(async ({ input }) => {
        try {
          const article = await scrapeArticleDetail(input.url);
          if (!article) {
            throw new Error("Article not found");
          }
          return { article };
        } catch (error) {
          console.error("Error fetching article detail:", error);
          throw new Error("Failed to fetch article detail");
        }
      }),
  }),

  // TTS: Generate audio from text
  tts: router({
    generate: publicProcedure
      .input(
        z.object({
          text: z.string().min(1).max(4096),
          voice: z.enum(["alloy", "echo", "fable", "onyx", "nova", "shimmer"]).default("alloy"),
        })
      )
      .mutation(async ({ input }) => {
        try {
          // Call OpenAI TTS API
          const apiKey = process.env.OPENAI_API_KEY;
          if (!apiKey) {
            throw new Error('OPENAI_API_KEY is not configured');
          }
          
          const response = await fetch('https://api.openai.com/v1/audio/speech', {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
              model: "tts-1",
              voice: input.voice,
              input: input.text,
              speed: 1.0,
            }),
          });

          if (!response.ok) {
            throw new Error(`TTS API error: ${response.statusText}`);
          }

          // Get audio buffer
          const audioBuffer = await response.arrayBuffer();
          const buffer = Buffer.from(audioBuffer);

          // Upload to S3
          const timestamp = Date.now();
          const randomSuffix = Math.random().toString(36).substring(7);
          const fileKey = `audio/tts-${timestamp}-${randomSuffix}.mp3`;

          const { url } = await storagePut(fileKey, buffer, "audio/mpeg");

          return { audioUrl: url };
        } catch (error) {
          console.error("TTS generation error:", error);
          throw new Error("Failed to generate audio");
        }
      }),
  }),

  // Audio upload: Upload recorded audio to S3
  audio: router({
    upload: publicProcedure
      .input(
        z.object({
          audioData: z.string(), // Base64 encoded audio
          mimeType: z.string().default("audio/mp4"),
        })
      )
      .mutation(async ({ input }) => {
        try {
          // Decode base64 to buffer
          const buffer = Buffer.from(input.audioData, "base64");

          // Upload to S3
          const timestamp = Date.now();
          const randomSuffix = Math.random().toString(36).substring(7);
          const extension = input.mimeType.split("/")[1] || "mp4";
          const fileKey = `audio/recording-${timestamp}-${randomSuffix}.${extension}`;

          const { url } = await storagePut(fileKey, buffer, input.mimeType);

          return { url };
        } catch (error) {
          console.error("Audio upload error:", error);
          throw new Error("Failed to upload audio");
        }
      }),
  }),

  // Pronunciation review: Transcribe and analyze
  pronunciation: router({
    review: publicProcedure
      .input(
        z.object({
          audioUrl: z.string().url(),
          originalText: z.string().min(1),
          language: z.string().default("en"),
        })
      )
      .mutation(async ({ input }) => {
        try {
          // Step 1: Transcribe audio using Whisper
          const transcription = await transcribeAudio({
            audioUrl: input.audioUrl,
            language: input.language,
          });

          if (!('text' in transcription)) {
            throw new Error('Transcription failed');
          }

          const transcribedText = transcription.text;

          // Step 2: Use LLM to analyze pronunciation and provide detailed feedback
          const analysisPrompt = `あなたは経験豊富な英語の発音コーチです。以下の情報を基に、学習者の発音を詳細に評価してください。

元のテキスト:
${input.originalText}

学習者が読み上げたテキスト（音声認識結果）:
${transcribedText}

以下の形式でJSONを返してください：
{
  "overallScore": 0-100の数値,
  "pronunciation": {
    "score": 0-100の数値,
    "comment": "発音の評価コメント（具体的な音素や単語を指摘）"
  },
  "intonation": {
    "score": 0-100の数値,
    "comment": "イントネーションの評価コメント（上昇調・下降調の使い分けを指摘）"
  },
  "rhythm": {
    "score": 0-100の数値,
    "comment": "リズムの評価コメント（強勢の位置やポーズの取り方を指摘）"
  },
  "fluency": {
    "score": 0-100の数値,
    "comment": "流暢さの評価コメント（詰まりや不自然な間を指摘）"
  },
  "wordLevelAnalysis": [
    {
      "word": "問題のある単語",
      "issue": "具体的な問題点",
      "suggestion": "改善方法",
      "example": "正しい発音例（カタカナまたはIPA）"
    }
  ],
  "strengths": ["良かった点1", "良かった点2", "良かった点3"],
  "improvements": [
    {
      "area": "改善すべき領域",
      "current": "現在の状態",
      "target": "目標とする状態",
      "practice": "具体的な練習方法"
    }
  ],
  "suggestions": ["改善提案1（具体的な練習方法を含む）", "改善提案2", "改善提案3"],
  "detailedFeedback": "詳細なフィードバック（日本語で300文字程度、具体例を含む）"
}

評価基準：
- 元のテキストとの一致度（単語レベルで比較）
- 個別の音素の正確さ（母音・子音・二重母音）
- イントネーションの自然さ（文末の上昇・下降、強調の位置）
- リズムとテンポ（内容語と機能語の強弱、適切なポーズ）
- 全体的な流暢さ（詰まりや不自然な間の有無）
- 音の連結（リンキング）と脱落（リダクション）の適切さ

具体的で建設的なフィードバックを提供してください。特に：
1. 問題のある単語を3-5個特定し、具体的な改善方法を示す
2. 良かった点も必ず3つ以上挙げて学習者を励ます
3. 改善提案には具体的な練習方法を含める
4. 音声認識結果と元のテキストの差異から発音の問題を推測する`;

          const llmResponse = await invokeLLM({
            messages: [
              {
                role: "system",
                content:
                  "You are an English pronunciation coach. Analyze the transcription and provide detailed feedback in Japanese. Always respond with valid JSON.",
              },
              {
                role: "user",
                content: analysisPrompt,
              },
            ],
            response_format: { type: "json_object" },
          });

          const feedbackContent = llmResponse.choices[0].message.content;
          if (typeof feedbackContent !== 'string') {
            throw new Error('Invalid LLM response format');
          }
          const feedback = JSON.parse(feedbackContent);

          return {
            transcription: transcribedText,
            feedback,
          };
        } catch (error) {
          console.error("Pronunciation review error:", error);
          throw new Error("Failed to review pronunciation");
        }
      }),
  }),

  // Translation: Translate English text to Japanese
  translation: router({
    translate: publicProcedure
      .input(
        z.object({
          text: z.string().min(1).max(10000),
        })
      )
      .mutation(async ({ input }) => {
        try {
          const translation = await translateToJapanese(input.text);
          return { translation };
        } catch (error) {
          console.error("Translation error:", error);
          throw new Error("Failed to translate text");
        }
      }),
  }),
});

export type AppRouter = typeof appRouter;
