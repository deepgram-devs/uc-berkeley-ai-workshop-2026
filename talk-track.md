# UC Berkeley AI Workshop — Talk Track

40-minute presentation, 7 slides. Speaker notes drafted in Naomi's natural voice — riff and cut as needed. Time budgets per slide are targets, not hard limits; the room will tell you how fast or slow to move.

**Placeholders to fill before delivery:**
- Slide 1: actual start time
- *(Repo and companion URLs are already filled in below.)*

---

## Slide 1 — Welcome~
**Target: ~1 min** *(use while people are still settling in)*

Hey everyone~ Welcome! We're going to kick off in about a minute, so if you're just walking in, grab a seat, get your laptop open, and head over to **console.deepgram.com** to sign up if you haven't already. The signup is free, you'll get $200 in credits as soon as you register, and we're going to use that today to build a working voice agent in about 40 minutes.

*(Once seated and ready:)*

Alright, let's go~

---

## Slide 2 — Who is Naomi?
**Target: ~2 min**

Quick intro before we dive in. I'm Naomi - I'm a Community Engineer at Deepgram, which basically means I get to spend my days helping developers actually *build* with our APIs - writing the kind of guides and example code I wish had existed when I was getting started.

Outside of Deepgram I'm also the Community Manager at freeCodeCamp, which is actually where I learned to code in the first place - I'm self-taught, came up through freeCodeCamp during the pandemic and eventually ended up running their community side. And on top of that I run my own technology company called NHCarrigan.

So most of what I do, in one form or another, is building tools and writing content that lower the friction between *"I have an idea"* and *"I have a working prototype."*

The reason I love voice AI specifically - and what I want you to take away from today - is that the distance between *"voice agent sounds cool"* and *"voice agent that I built and runs on my laptop"* is way shorter than it looks. We're going to close that distance in about 40 minutes.

*(Transition:)*

Okay - let's talk about what a voice agent actually is.

---

## Slide 3 — How a Voice Agent Works
**Target: ~6 min**

A voice agent is, at its core, three things hooked together in a loop.

**First, you've got speech-to-text - STT.** That's where you take whatever audio is coming in from someone's microphone and you turn it into actual words you can work with. At Deepgram this is what we've always been known for. Our nova-3 model is what we'll use today, and it's fast enough that you don't have to wait for a transcript to come back - it just streams as you speak. Word by word, in real time.

**Then in the middle you've got an LLM or LRM** - a large language model or a large reasoning model. This is the brain. It takes the transcript of what the person said, mixes that with the conversation history and any instructions you've given it, and decides what the agent should say back. In the demo we're building today we're going to wire this up to OpenAI's `gpt-4o-mini` because it's fast and cheap, but the same pattern works with Claude, Gemini, Llama, whatever - Deepgram's Voice Agent supports a bunch of different providers, and you can swap them in and out without rewriting your code.

**And third you've got text-to-speech - TTS.** The LLM gives you back a string of text, and then TTS converts that into audio that gets streamed back to the person's speakers. Deepgram's TTS model is called Aura, and the version we'll use today - Aura-2 - has a whole bunch of different voices you can pick from. We'll start with one called Asteria.

Now - the thing that makes the Deepgram Voice Agent special is that you don't have to wire these three things up by hand. You're not writing code to take the STT transcript and feed it to the LLM and then pipe the LLM output to TTS. The Voice Agent does the orchestration for you. You give it your settings - which STT, which LLM, which TTS, what the agent's personality is - and then it hands you a WebSocket where audio bytes go in and audio bytes come out. The agent handles all the in-between, including interruptions, turn-taking, all of it.

That's the whole concept. Three components, one orchestrator, audio in, audio out.

*(Transition:)*

Let's set up your environment so we can build one.

---

## Slide 4 — Get Running in 5 Steps!
**Target: ~7 min** *(includes pause for everyone to actually get set up)*

This is the bit where I need everyone to be at the same point before we move forward, so we're going to spend a few minutes here and I'll be checking in along the way.

Five things to do, in order:

**Step 1** - go to `console.deepgram.com` and sign up. You can use Google, GitHub, or email - whatever's quickest. If you've already got an account, you're fine, just log in.

**Step 2** - once you're registered, you get $200 in free credit. You won't come close to using that today - this whole workshop will cost you maybe 50 cents in usage - but you'll have plenty left over to keep playing after we wrap.

**Step 3** - clone the starter repo: **`https://dpgr.am/ucb-ai-repo`**. Open a terminal and run `git clone` with that URL. This gives you the boilerplate we're going to build on top of. The repo has one main file in it, `main.py`, and a few config files. We're going to walk through what's in it together in a minute.

**Step 4** - once you've cloned, you'll see a `.env.example` file in there. Copy it to `.env`. Then go grab your Deepgram API key - from the console, under *API Keys*, click *Create a New API Key*, give it any name you want, and paste that key into your `.env` file as the value for `DEEPGRAM_API_KEY`.

**Step 5** - run `uv install` to set up the virtual environment and pull down the dependencies. If you don't have `uv` installed yet, it's a fast Python package manager from a company called Astral, and you can get it with `curl -LsSf https://astral.sh/uv/install.sh | sh` on Mac or Linux. There's a PowerShell one-liner for Windows that's in the companion guide.

You'll need Python 3.13 or newer for this. If `python --version` says 3.12 or older, don't stress - `uv` will actually grab the right Python version for you automatically when you install the deps.

*(Optional aside:)*

By the way - if you're on Windows running WSL, audio in WSL is a little weird out of the box. There's a short fix in the companion that bridges PulseAudio to ALSA. If you're on native Windows, macOS, or a Linux laptop, you don't need that.

The companion guide for the whole workshop is at **`https://dpgr.am/ucb-ai-guide`**. That's where every step we do today is written out, with code blocks you can copy-paste, plus little knowledge checks if you want to verify you got something right.

Okay - I'm gonna give us about three minutes here. Get signed up, get the repo cloned, get your `.env` set up. If you're stuck, raise your hand and either I or someone next to you who's done it will help.

*(Pause. Walk the room. Check for stuck people. Common blockers: Python version, `uv` not installed, API key paste typo.)*

How's everyone doing? Show of hands - does anyone need more time?

*(If yes, wait another minute or two. Resist the urge to skip people - the rest of the workshop falls apart if folks aren't set up here.)*

Alright - everyone good? Cool. Let's actually look at what we just cloned.

---

## Slide 5 — The Code Behind the Demo
**Target: ~12 min** *(the meaty middle - open `main.py` in your editor alongside the slide so people can read along)*

What's in `main.py` is - genuinely - the bare minimum. It's about 150 lines, and we're going to walk through the two most important pieces. The slide shows them side by side: on the left, the **Settings** block that describes how your agent should behave. On the right, the **on_message** handler that responds to what the agent is doing.

### Settings (left panel) — about 5 min

We're creating one big `AgentV1Settings` object that has two top-level pieces: `audio` and `agent`.

The `audio` block tells Deepgram what format your microphone is sending and what format you want the agent's voice in. We're using `linear16` - that's just raw 16-bit PCM, the simplest possible audio format - at 24 kilohertz. You configure both input and output here, and we make them the same to keep things simple.

The `agent` block is where you describe the three components I talked about earlier:

- `listen` is the STT - we're using `nova-3`.
- `think` is the LLM - we're using OpenAI's `gpt-4o-mini` with a temperature of 0.7, which keeps it from being too robotic without going off the rails.
- `speak` is the TTS - we're using `aura-2-asteria-en`, our default English voice.

There's a `prompt` field inside `think`. That's where you tell the LLM what kind of personality and behaviour you want. Right now we've got *"You are a helpful AI assistant. Keep your responses brief."* We're going to mess with that in a minute, because the prompt is honestly where most of the magic of a voice agent lives.

And the very last thing - `greeting` - is what the agent says the moment you connect, before you've said anything. It's a nice way to check that your speakers are working, and it's a nice user-experience touch for any real-world agent.

### Messages (right panel) — about 5 min

Every message Deepgram's Voice Agent sends you flows through `on_message`. Some of those messages are events - JSON-shaped things saying *"the user started speaking"* or *"I finished speaking"* or *"here's the transcript of what the user just said."* And some of them are raw audio bytes - that's the synthesised voice of the agent talking back.

The first `if` in the handler is the most important: if the message is bytes, we just write it straight to the speaker. That's it. That's how the agent talks. You don't have to decode anything, you don't have to buffer it - you give it directly to your audio output and it plays.

After that we look at `message_type` and react to each kind:

- `SettingsApplied` means our config went through and we can start the microphone.
- `ConversationText` is the transcript. Both your voice and the agent's reply come through this with a `role` field saying which one it is.
- `UserStartedSpeaking` is useful because that's when most agents would interrupt themselves if they were talking. Deepgram's Voice Agent actually handles that interruption automatically for you, but you might still want to log it.
- The rest are progress events - thinking, started speaking, audio done, errors. Use them for UI feedback or analytics.

The really nice thing here is that you can react to any of these however you want. Log them to a database, push them to a frontend over a WebSocket, send them to your observability stack - the agent doesn't care.

### The audio plumbing (not on the slide) — about 2 min

The bit that's not shown on this slide but is in your `main.py` is the audio plumbing. We open a `sounddevice.RawOutputStream` for the speaker *before* we send settings, and a `RawInputStream` for the mic right after we get `SettingsApplied`. The mic callback ships each chunk via `agent.send_media(bytes(indata))`. Mic in, settings go up, then a loop until Ctrl+C.

That's all of it.

### Now run it

Alright - go ahead and run this. In your terminal, with your `.env` set up, run `uv run python main.py`. You should hear the greeting through your speakers within a couple of seconds. Once you do, say hi to it.

*(Pause ~2 minutes. Walk the room. Listen for greetings playing out of laptops. Common blockers: mic permission on macOS, no audio on WSL without the bridge, wrong API key.)*

Anyone not getting audio? Show of hands.

*(Help any stragglers.)*

Cool. So you've now got a working voice agent. That's the bare minimum, working. Now let's make it actually yours.

---

## Slide 6 — Make it Yours!
**Target: ~8 min**

Three things you can try, and you can do them all today or just pick whichever sounds the most fun.

### 1. Modify the system prompt — about 3 min

Honestly the most fun. Right now your agent has a personality that is, generously, *"helpful AI assistant who keeps responses brief."* That's like, the most boring possible personality.

Look at the example on the slide - we've replaced that with something way more interesting. The prompt now says *"Your name is Rose, and you are a mentor for developers, and you should use the Socratic method to help them think through problems rather than just giving them the answer."* Suddenly it's a totally different agent.

Try this yourself - rewrite the prompt to whatever role you want. Make it a pirate. Make it a chef. Make it a customer service agent for a fictional company. The prompt **is** the personality. Most of the hard work in building a good voice agent is iterating on this one string until the agent behaves the way you want.

### 2. Pick a different voice — about 2 min

We're using Aura-2 Asteria, which sounds like… a calm woman in her thirties? Try a different one. The example on the slide shows `aura-2-pandora-en`, which is a totally different vibe.

We've got around fifty voices across seven languages — English, Spanish, Dutch, French, German, Italian, and Japanese — some warm, some cold, some sound young, some sound older, some are flat and informative, some are expressive. The full list is in the companion. Pick one that fits the personality you wrote in step one.

### 3. Add a tool the agent can call — about 3 min

This is the spicy one. The example on the slide adds a function called `get_current_time` that the agent can decide to call. You define it in your `think` settings under `functions`, and then in your message handler you watch for `FunctionCallRequest` messages, run whatever the function should do, and send the result back.

This is how you go from *"voice agent that talks"* to *"voice agent that does stuff"* - check the weather, query a database, send a message, whatever. Once you've got tools, you've got a real assistant.

We're not going to walk through tools in detail in the remaining time, but it's all documented in the companion. The hardest part is the JSON schema for the function parameters, and once you've done it once you've done it forever.

### Try it now

Go play. Five minutes. Try one of these, or all three. If something breaks, raise your hand.

*(Pause ~5 min - walk the room and help debug. Common issues: prompt formatting, voice model names with typos, function-call JSON schema mismatches.)*

---

## Slide 7 — Now that you have this…
**Target: ~4 min**

Quick wrap before we open it up for questions.

You've got a working voice agent. Honestly, with what you've built in 40 minutes, you can take this and build something real. A few directions to go:

**Make function calls to real APIs.** The `get_current_time` example is a toy. The same pattern lets you call your own backend, query a database, hit a third-party API. Most of the interesting voice agents people build are mostly about which tools they expose.

**Try different voices.** The voice matters more than people think for the feel of an agent. Spend an evening just listening to different Aura-2 voices with the same prompt and you'll have strong opinions by the end.

**Multilingual support.** Nova-3 listens in a bunch of languages, and Aura-2 speaks in English, Spanish, Dutch, French, German, Italian, and Japanese. If your agent needs to handle multilingual callers, you absolutely can.

For help and to keep going:

- We're at the **Deepgram booth** on the floor today - come find us
- Docs are at **docs.deepgram.com**
- There's an active **Discord** at `discord.gg/deepgram` where the team and a lot of other developers hang out
- GitHub discussions are linked from the slide

And of course - **have fun**. This stuff is genuinely fun to build, and the barrier between *"cool idea"* and *"working prototype"* has never been lower than it is right now. Go make something weird.

*(Open it up:)*

Okay - questions? What did anyone build?

---

## Pacing reference

| Slide | Min | Cumulative |
|------:|----:|-----------:|
| 1     | 1   | 1          |
| 2     | 2   | 3          |
| 3     | 6   | 9          |
| 4     | 7   | 16         |
| 5     | 12  | 28         |
| 6     | 8   | 36         |
| 7     | 4   | 40         |

If you're behind at the slide-4 check-in, the safest place to cut time is the **third "thing to try"** on slide 6 (tools) — you can defer that entirely to the companion. If you're ahead, slide 5 has natural padding where you can demo a second prompt change live.
