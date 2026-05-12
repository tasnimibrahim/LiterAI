import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { feedback } from "../../drizzle/schema";
import { notifyOwner } from "../_core/notification";
import { eq } from "drizzle-orm";

export const feedbackRouter = router({
  submit: protectedProcedure
    .input(
      z.object({
        rating: z.number().min(1).max(5),
        comment: z.string().optional(),
        category: z.enum(["bug", "feature", "general"]).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const result = await db.insert(feedback).values({
        userId: ctx.user.id,
        rating: input.rating,
        comment: input.comment,
        feedbackType: input.category,
        createdAt: new Date(),
      });

      // Notify owner
      await notifyOwner({
        title: "New Feedback Received",
        content: `${ctx.user.name || ctx.user.email} left a ${input.rating}-star review: "${input.comment || "No comment"}"`,
      });

      return { success: true };
    }),

  list: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const result = await db
      .select()
      .from(feedback)
      .where(eq(feedback.userId, ctx.user.id))
      .orderBy((f) => f.createdAt);

    return result;
  }),

  getStats: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const result = await db
      .select()
      .from(feedback)
      .where(eq(feedback.userId, ctx.user.id));

    const ratings = result.map((r) => r.rating).filter((r) => r !== null) as number[];
    const avgRating = ratings.length > 0 ? ratings.reduce((a, b) => (a || 0) + (b || 0), 0) / ratings.length : 0;

    return {
      totalFeedback: result.length,
      averageRating: avgRating,
      ratingDistribution: {
        5: result.filter((r) => r.rating === 5).length,
        4: result.filter((r) => r.rating === 4).length,
        3: result.filter((r) => r.rating === 3).length,
        2: result.filter((r) => r.rating === 2).length,
        1: result.filter((r) => r.rating === 1).length,
      },
    };
  }),
});
