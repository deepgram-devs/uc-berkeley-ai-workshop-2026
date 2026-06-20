const SAMPLE_RATE = 24000;

const audio = {
  input:  { encoding: "linear16", sample_rate: SAMPLE_RATE },
  output: { encoding: "linear16", sample_rate: SAMPLE_RATE },
};

const agent = {
  listen: {
    provider: {
      type:  "deepgram",
      model: "nova-3",
    },
  },
  think: {
    provider: {
      type:        "open_ai",
      model:       "gpt-4o-mini",
      temperature: 0.7,
    },
    prompt: "You are a helpful AI assistant. Keep your responses brief.",
  },
  speak: {
    provider: {
      type:  "deepgram",
      model: "aura-2-asteria-en",
    },
  },
  greeting: "Hello! I'm a Deepgram voice agent. What would you like to talk about?",
};

const SETTINGS = { type: "Settings", audio, agent };