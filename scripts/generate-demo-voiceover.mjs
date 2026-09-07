import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const apiKey = process.env.ELEVENLABS_API_KEY;

if (!apiKey) {
  throw new Error("ELEVENLABS_API_KEY is missing.");
}

const voiceId = "pNInz6obpgDQGcFmaJgB";
const text = (await readFile(resolve("docs/windowguard-voiceover.txt"), "utf8")).trim();
const outputDirectory = resolve("demo-output");
const outputPath = resolve(outputDirectory, "windowguard-adam-voiceover.mp3");

const response = await fetch(
  `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`,
  {
    method: "POST",
    headers: {
      accept: "audio/mpeg",
      "content-type": "application/json",
      "xi-api-key": apiKey,
    },
    body: JSON.stringify({
      text,
      model_id: "eleven_multilingual_v2",
      voice_settings: {
        stability: 0.58,
        similarity_boost: 0.78,
        style: 0.12,
        use_speaker_boost: true,
        speed: 1.12,
      },
    }),
  },
);

if (!response.ok) {
  const details = (await response.text()).slice(0, 1_000);
  throw new Error(`ElevenLabs request failed (${response.status}): ${details}`);
}

const audio = Buffer.from(await response.arrayBuffer());
await mkdir(outputDirectory, { recursive: true });
await writeFile(outputPath, audio);
console.log(`Generated ${outputPath} (${audio.length} bytes)`);
