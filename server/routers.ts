import { z } from "zod";
import { nanoid } from "nanoid";
import { TRPCError } from "@trpc/server";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { invokeLLM } from "./_core/llm";
import { publicProcedure, router } from "./_core/trpc";
import { storagePut } from "./storage";
import { systemRouter } from "./_core/systemRouter";
import { clampNormalizedBBox } from "@shared/geo";
import { createSharedAnalysis, getSharedAnalysisByToken } from "./db";

const regionSchema = z.object({
  label: z.string(),
  bbox: z.tuple([z.number(), z.number(), z.number(), z.number()]),
});

const resultSchema = z.object({
  answer: z.string(),
  confidence: z.number().min(0).max(1),
  regions: z.array(regionSchema).optional(),
});

const sharePayloadSchema = z.object({
  imageUrl: z.string().max(250_000),
  answer: z.string().max(20_000),
  confidence: z.number().min(0).max(1),
  regions: z.array(regionSchema).optional(),
  mode: z.string().max(80).optional(),
  query: z.string().max(500).optional(),
});

function messageText(content: unknown): string {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .map((item) => (typeof item === "string" ? item : (item as { text?: string })?.text ?? ""))
      .join("\n");
  }
  return "";
}

export function parseVlmResult(raw: string) {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("The VLM returned an unreadable result. Please retry with a more specific query.");
  }
  const validated = resultSchema.parse(parsed);
  return {
    ...validated,
    regions: validated.regions?.map((region) => ({ ...region, bbox: clampNormalizedBBox(region.bbox) })),
  };
}

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  share: router({
    create: publicProcedure
      .input(sharePayloadSchema)
      .mutation(async ({ input }) => {
        const token = nanoid(21);
        await createSharedAnalysis({ token, payload: JSON.stringify(input) });
        return { token };
      }),
    get: publicProcedure
      .input(z.object({ token: z.string().min(10).max(32) }))
      .query(async ({ input }) => {
        const shared = await getSharedAnalysisByToken(input.token);
        if (!shared) throw new TRPCError({ code: "NOT_FOUND", message: "Shared analysis not found." });
        try {
          return sharePayloadSchema.parse(JSON.parse(shared.payload));
        } catch {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Shared analysis is unreadable." });
        }
      }),
  }),
  pipeline2: router({
    analyze: publicProcedure
      .input(z.object({
        imageData: z.string().min(32),
        fileName: z.string().min(1).max(160),
        mimeType: z.string().regex(/^image\/(jpeg|png|webp|gif)$/),
        query: z.string().min(3).max(500),
      }))
      .mutation(async ({ input }) => {
        const base64 = input.imageData.replace(/^data:[^;]+;base64,/, "");
        const buffer = Buffer.from(base64, "base64");
        const safeName = input.fileName.replace(/[^a-zA-Z0-9._-]/g, "-");
        const stored = await storagePut(`vlm-demo/${Date.now()}-${safeName}`, buffer, input.mimeType);
        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content: "You analyze geospatial imagery. Return only JSON matching the requested schema. Bounding boxes must be normalized fractions in [x_min, y_min, x_max, y_max] relative to image width and height.",
            },
            {
              role: "user",
              content: [
                { type: "text", text: `Query: ${input.query}` },
                { type: "image_url", image_url: { url: stored.url, detail: "high" } },
              ],
            },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "geo_query_result",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  answer: { type: "string" },
                  confidence: { type: "number", minimum: 0, maximum: 1 },
                  regions: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        label: { type: "string" },
                        bbox: { type: "array", items: { type: "number", minimum: 0, maximum: 1 }, minItems: 4, maxItems: 4 },
                      },
                      required: ["label", "bbox"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["answer", "confidence", "regions"],
                additionalProperties: false,
              },
            },
          },
        });
        const raw = messageText(response.choices?.[0]?.message?.content);
        const validated = parseVlmResult(raw);
        return {
          imageUrl: stored.url,
          answer: validated.answer,
          confidence: validated.confidence,
          regions: validated.regions,
        };
      }),
  }),
});

export type AppRouter = typeof appRouter;
