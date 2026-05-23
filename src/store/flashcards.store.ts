"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { FlashcardDeck } from "@/lib/types";
import { DUMMY_DECKS } from "@/lib/dummy-data";
import { uid } from "@/lib/utils";
import { applyRating, Rating } from "@/lib/srs";

export interface ReviewLog {
  deckId: string;
  cardId: string;
  rating: Rating;
  timestamp: string;
}

interface FlashcardsState {
  decks: FlashcardDeck[];
  reviewLog: ReviewLog[];
  createDeck: (name: string, subject: FlashcardDeck["subject"]) => void;
  deleteDeck: (id: string) => void;
  rateCard: (deckId: string, cardId: string, rating: Rating) => void;
  updateCardMastery: (deckId: string, cardId: string, knew: boolean) => void;
  getDueCards: (deckId: string) => number;
  getMistakeReviewCards: (deckId: string) => string[];
}

export const useFlashcardsStore = create<FlashcardsState>()(
  persist(
    (set, get) => ({
      decks: DUMMY_DECKS,
      reviewLog: [],
      createDeck: (name, subject) =>
        set((s) => ({
          decks: [
            ...s.decks,
            {
              id: uid(),
              name,
              subject,
              description: `0 cards • ${subject}`,
              gradient: "from-purple-500 to-pink-500",
              cards: [],
              createdAt: new Date().toISOString(),
            },
          ],
        })),
      deleteDeck: (id) => set((s) => ({ decks: s.decks.filter((d) => d.id !== id) })),
      rateCard: (deckId, cardId, rating) =>
        set((s) => ({
          decks: s.decks.map((d) =>
            d.id === deckId
              ? {
                  ...d,
                  cards: d.cards.map((c) => {
                    if (c.id !== cardId) return c;
                    const r = applyRating(c.interval || 0, c.easeFactor || 2.5, c.mastery, rating);
                    return { ...c, ...r };
                  }),
                }
              : d
          ),
          reviewLog: [
            ...s.reviewLog,
            { deckId, cardId, rating, timestamp: new Date().toISOString() },
          ].slice(-500),
        })),
      updateCardMastery: (deckId, cardId, knew) =>
        get().rateCard(deckId, cardId, knew ? "good" : "again"),
      getDueCards: (deckId) => {
        const deck = get().decks.find((d) => d.id === deckId);
        if (!deck) return 0;
        const now = Date.now();
        return deck.cards.filter((c) => !c.dueAt || new Date(c.dueAt).getTime() <= now).length;
      },
      getMistakeReviewCards: (deckId) => {
        const log = get().reviewLog;
        const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
        return Array.from(
          new Set(
            log
              .filter(
                (l) =>
                  l.deckId === deckId &&
                  (l.rating === "again" || l.rating === "hard") &&
                  new Date(l.timestamp).getTime() > cutoff
              )
              .map((l) => l.cardId)
          )
        );
      },
    }),
    { name: "vyronotes-flashcards" }
  )
);
