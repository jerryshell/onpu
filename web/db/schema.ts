import { relations } from "drizzle-orm";
import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  real,
  primaryKey,
} from "drizzle-orm/pg-core";

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  credits: integer("credits").default(3).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const song = pgTable("song", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  s3Key: text("s3_key"),
  thumbnailS3Key: text("thumbnail_s3_key"),
  status: text("status").default("queued").notNull(),
  instrumental: boolean("instrumental").default(false).notNull(),
  prompt: text("prompt"),
  lyrics: text("lyrics"),
  fullDescribedSong: text("full_described_song"),
  describedLyrics: text("described_lyrics"),
  guidanceScale: real("guidance_scale"),
  inferStep: real("infer_step"),
  audioDuration: real("audio_duration"),
  seed: real("seed"),
  published: boolean("published").default(false).notNull(),
  listenCount: integer("listen_count").default(0).notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const category = pgTable("category", {
  id: text("id").primaryKey(),
  name: text("name").notNull().unique(),
});

export const songCategory = pgTable(
  "song_category",
  {
    songId: text("song_id")
      .notNull()
      .references(() => song.id, { onDelete: "cascade" }),
    categoryId: text("category_id")
      .notNull()
      .references(() => category.id, { onDelete: "cascade" }),
  },
  (table) => [primaryKey({ columns: [table.songId, table.categoryId] })],
);

export const like = pgTable(
  "like",
  {
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    songId: text("song_id")
      .notNull()
      .references(() => song.id, { onDelete: "cascade" }),
  },
  (table) => [primaryKey({ columns: [table.userId, table.songId] })],
);

// Relations

export const userRelations = relations(user, ({ many }) => ({}));

export const songRelations = relations(song, ({ one, many }) => ({
  user: one(user, {
    fields: [song.userId],
    references: [user.id],
  }),
}));

export const categoryRelations = relations(category, ({ many }) => ({}));

export const likeRelations = relations(like, ({ one }) => ({}));

export const songCategoryRelations = relations(songCategory, ({ one }) => ({}));

// Types

export type User = typeof user.$inferSelect;
export type Song = typeof song.$inferSelect;
export type Category = typeof category.$inferSelect;
export type Like = typeof like.$inferSelect;
