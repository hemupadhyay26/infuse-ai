export const PROMPT_TEMPLATE = `
Human: Answer the question based only on the following context

Context:
{context}

---

Question: {question}

Answer appropriate, format your response using markdown for better readability.
\nAssistant:
`;