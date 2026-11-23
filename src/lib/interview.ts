import { z } from "zod";

// Original non-clinical prompts. Clinical/emergency banks require professional content review.
export const communicationPrompts = {
  general: [
    {
      prompt: "Introduce yourself and explain your motivation for a public service dental role.",
      outline:
        "Briefly cover your training, a relevant experience, your motivation and the contribution you hope to make. Use examples you can support.",
    },
    {
      prompt: "Describe a time you worked with a team under pressure.",
      outline:
        "Use Situation, Task, Action and Result. Be specific about your own role, communication and what you learned.",
    },
    {
      prompt: "How would you communicate respectfully with someone who disagrees with you?",
      outline:
        "Explain how you would listen, clarify the concern, state your reasoning respectfully and agree on a constructive next step.",
    },
    {
      prompt: "What would you do if asked a question outside your knowledge during an interview?",
      outline:
        "Acknowledge the limit honestly. Explain what you do know and how you would check the information without guessing.",
    },
    {
      prompt: "Describe one professional learning goal for the coming year.",
      outline:
        "Choose a concrete skill, explain its relevance and describe an achievable plan and how you will assess progress.",
    },
  ],
  english: [
    {
      prompt: "Give a clear 60-second introduction in English.",
      outline:
        "Use short sentences: your background, one strength with an example, and your professional goal. Clarity matters more than complex vocabulary.",
    },
    {
      prompt: "Explain a complex topic from your studies to a non-specialist, without jargon.",
      outline:
        "Start with a simple definition, give one familiar example, then check understanding. This exercise does not assess clinical accuracy.",
    },
    {
      prompt: "Summarize a recent learning experience in three sentences.",
      outline:
        "State what happened, what you learned and how you will apply it. Keep each sentence focused on one idea.",
    },
  ],
};
export type CommunicationMode = "general" | "english" | "full_mock";
export function promptsFor(mode: string) {
  if (mode === "english") return communicationPrompts.english;
  if (mode === "full_mock")
    return [...communicationPrompts.general.slice(0, 3), ...communicationPrompts.english.slice(1)];
  return communicationPrompts.general;
}
export const transcriptSchema = z
  .array(
    z.object({
      prompt: z.string().max(2000),
      answer: z.string().max(10000),
      reflection: z.string().max(2000).default(""),
    }),
  )
  .max(30);
export type InterviewEntry = z.infer<typeof transcriptSchema>[number];

export function communicationFeedback(answer: string) {
  const words = answer.trim().split(/\s+/).filter(Boolean).length;
  return {
    words,
    suggestion:
      words === 0
        ? "Write your answer before reviewing."
        : words < 40
          ? "Consider adding one concrete example and a clear takeaway."
          : words > 250
            ? "Try a shorter version with your main point first."
            : "Review whether your main point, example and takeaway are easy to follow.",
  };
}
