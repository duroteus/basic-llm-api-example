const API_KEY = process.env.OPENAI_API_KEY;

async function askLLM(question) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4.1-nano",
        temperature: 0.3,
        max_tokens: 300,
        messages: [
          {
            role: "system",
            content:
              "You are a helpful assistant that can answer questions about the user's input.",
          },
          {
            role: "user",
            content: question,
          },
        ],
      }),
    });

    if (!response.ok) {
      const text = await response.text();

      throw new Error(`LLM API error: ${text}`);
    }

    const data = await response.json();

    return data.choices[0].message.content;
  } finally {
    clearTimeout(timeout);
  }
}

async function streamLLM(question, onToken) {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4.1-nano",
      temperature: 0.3,
      max_tokens: 300,
      stream: true,
      messages: [
        {
          role: "system",
          content:
            "You are a helpful assistant that can answer questions about the user's input.",
        },
        {
          role: "system",
          content: "Always answer in the same language as the user's input.",
        },
        {
          role: "user",
          content: question,
        },
      ],
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();

    if (done) break;

    const chunk = decoder.decode(value);
    const lines = chunk.split("\n");

    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;

      const data = line.replace("data: ", "").trim();

      if (data === "[DONE]") return;

      try {
        const parsed = JSON.parse(data);
        const token = parsed.choices?.[0]?.delta?.content;

        if (token) {
          onToken(token);
        }
      } catch (error) {
        console.error(`Error parsing LLM response: ${error.message}`);
      }
    }
  }
}

module.exports = {
  askLLM,
  streamLLM,
};
