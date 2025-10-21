import { createClient } from "next-sanity";

export const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!;
export const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET!;
export const apiVersion =
  process.env.NEXT_PUBLIC_SANITY_API_VERSION || "2025-01-01";

// Opcjonalnie przyda się klient do zapytań (GROQ itp.)
export const client = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: true,
});
