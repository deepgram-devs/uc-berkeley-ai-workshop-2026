import "dotenv/config";
import { execSync } from "node:child_process";
import micFactory from "mic";
import Speaker from "speaker";
import { DeepgramClient } from "@deepgram/sdk";

const SAMPLE_RATE = 24000;
const CHANNELS = 1;
const BIT_DEPTH = 16;

const audio = {
  input:  { encoding: "linear16", sample_rate: SAMPLE_RATE },
  output: { encoding: "linear16", sample_rate: SAMPLE_RATE },
};

const agentSettings = {
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

const SETTINGS = { type: "Settings", audio, agent: agentSettings };

let resolveSettingsApplied;
const settingsApplied = new Promise((resolve) => {
  resolveSettingsApplied = resolve;
});

const logAgentMessage = (message) => {
  switch (message.type) {
    case "SettingsApplied":
      console.log(">> Settings applied");
      resolveSettingsApplied();
      break;
    case "ConversationText":
      console.log(`[${message.role ?? "unknown"}] ${message.content ?? ""}`);
      break;
    case "UserStartedSpeaking":
      console.log(">> User started speaking");
      break;
    case "AgentThinking":
      console.log(">> Agent thinking...");
      break;
    case "AgentStartedSpeaking":
      console.log(">> Agent started speaking");
      break;
    case "AgentAudioDone":
      console.log(">> Agent finished speaking");
      break;
    case "Error":
      console.log(`>> Agent error: ${message.code ?? "unknown"} - ${message.description ?? "unknown error"}`);
      break;
    default:
      console.log(`>> ${message.type}`);
  }
};

const main = async () => {
  console.log("Connecting to Deepgram agent...");
  const client = new DeepgramClient({ apiKey: process.env.DEEPGRAM_API_KEY });
  const agent = await client.agent.v1.connect();
  agent.socket.binaryType = "nodebuffer";

  const speaker = new Speaker({
    channels: CHANNELS,
    bitDepth: BIT_DEPTH,
    sampleRate: SAMPLE_RATE,
    signed: true,
  });

  let connected = true;

  const shutdown = () => {
    if (!connected) return;
    connected = false;
    console.log("\nShutting down...");
    microphone?.stop();
    speaker.end();
    process.exit(0);
  };

  agent.on("open", () => console.log(">> Connection opened"));
  agent.on("close", () => {
    console.log(">> Connection closed");
    shutdown();
  });
  agent.on("error", (error) => console.log(`>> Error: ${error?.message ?? error}`));
  agent.on("message", (message) => {
    if (Buffer.isBuffer(message)) {
      speaker.write(message);
      return;
    }
    if (message instanceof ArrayBuffer) {
      speaker.write(Buffer.from(message));
      return;
    }

    logAgentMessage(message);
  });

  console.log("Waiting for connection to open...");
  agent.connect();
  await agent.waitForOpen();

  console.log("Sending agent settings...");
  agent.sendSettings(SETTINGS);

  const settingsTimeout = new Promise((_, reject) => {
    setTimeout(() => reject(new Error("Timed out waiting for agent settings to apply.")), 10000);
  });
  await Promise.race([settingsApplied, settingsTimeout]);

  try {
    execSync("command -v rec", { stdio: "ignore" });
  } catch {
    throw new Error(
      "Microphone capture requires sox (provides the `rec` command). Install it with: brew install sox"
    );
  }

  const microphone = micFactory({
    rate: String(SAMPLE_RATE),
    channels: String(CHANNELS),
    bitwidth: String(BIT_DEPTH),
    encoding: "signed-integer",
    endian: "little",
    device: "default",
  });

  const micStream = microphone.getAudioStream();
  micStream.on("data", (chunk) => {
    if (!connected) return;
    agent.sendMedia(chunk);
  });
  micStream.on("error", (error) => console.error(`>> Microphone error: ${error}`));

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);

  microphone.start();

  console.log("\nListening... press Ctrl+C to exit.\n");
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
