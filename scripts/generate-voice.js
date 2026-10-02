/**
 * Generates the pre-recorded male voice pack (Azure Neural TTS, th-TH-NiwatNeural)
 * for every line the in-app reader speaks. Pay once at generation time; the app then
 * plays the files offline and falls back to the device voice for anything missing.
 *
 * Setup: put these in .env (never commit it)
 *   AZURE_SPEECH_KEY=...
 *   AZURE_SPEECH_REGION=southeastasia
 *
 * Usage:
 *   node scripts/generate-voice.js --dry-run            # count lines/characters, estimate cost & size
 *   node scripts/generate-voice.js --prayer <id>        # generate one prayer only (listen before buying all)
 *   node scripts/generate-voice.js --limit 20           # generate at most 20 new clips
 *   node scripts/generate-voice.js                      # generate everything missing (resumable)
 *   node scripts/generate-voice.js --prune              # also delete clips no longer used by any prayer
 *
 * Options: --voice th-TH-NiwatNeural  --rate -10%  --format audio-24khz-48kbitrate-mono-mp3  --concurrency 4
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DEFAULT_PRAYERS } from '../src/js/default-prayers.js';
import { DhammaTTSEngine, voiceClipKey, VOICE_PACK_BASE_URL } from '../src/js/tts-engine.js';

const rootDir = process.cwd();
const outDir = path.join(rootDir, VOICE_PACK_BASE_URL);

// Azure neural TTS list price (USD per 1M characters); first 0.5M chars/month are free on the F0 tier
const USD_PER_MILLION_CHARS = 15;
// Rough Thai speaking speed at the calm cadence below, used only for the size estimate
const CHARS_PER_SECOND = 12;

function parseArgs(argv) {
  const args = { dryRun: false, prune: false, limit: Infinity, prayer: null, voice: 'th-TH-NiwatNeural', rate: '-10%', format: 'audio-24khz-48kbitrate-mono-mp3', concurrency: 4 };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--dry-run') args.dryRun = true;
    else if (a === '--prune') args.prune = true;
    else if (a === '--limit') args.limit = parseInt(argv[++i], 10);
    else if (a === '--prayer') args.prayer = argv[++i];
    else if (a === '--voice') args.voice = argv[++i];
    else if (a === '--rate') args.rate = argv[++i];
    else if (a === '--format') args.format = argv[++i];
    else if (a === '--concurrency') args.concurrency = Math.max(1, parseInt(argv[++i], 10) || 1);
    else throw new Error(`Unknown option: ${a}`);
  }
  return args;
}

function loadEnv() {
  const envPath = path.join(rootDir, '.env');
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^(['"])(.*)\1$/, '$2');
  }
}

/** Every distinct text the reader can speak, built with the same queue logic the app uses. */
export function collectSpokenTexts(prayers) {
  const engine = new DhammaTTSEngine();
  engine.setMode('both'); // 'both' covers every line spoken in 'pali' and 'thai' modes too
  const texts = new Map(); // key -> text
  for (const prayer of prayers) {
    engine.prepareQueue(prayer);
    for (const chunk of engine.queue) {
      if (chunk.text) texts.set(voiceClipKey(chunk.text), chunk.text);
    }
  }
  return texts;
}

const escapeXml = (s) => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[c]));

async function synthesize(text, { voice, rate, format, key, region }) {
  const ssml = `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="th-TH">`
    + `<voice name="${voice}"><prosody rate="${rate}">${escapeXml(text)}</prosody></voice></speak>`;
  for (let attempt = 1; ; attempt++) {
    const res = await fetch(`https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': key,
        'Content-Type': 'application/ssml+xml',
        'X-Microsoft-OutputFormat': format,
        'User-Agent': 'tamma-voice-generator'
      },
      body: ssml
    });
    if (res.ok) return Buffer.from(await res.arrayBuffer());
    const retryable = res.status === 429 || res.status >= 500;
    if (!retryable || attempt >= 5) {
      throw new Error(`Azure TTS ${res.status}: ${(await res.text()).slice(0, 200)}`);
    }
    await new Promise(r => setTimeout(r, 1000 * 2 ** attempt));
  }
}

function writeManifest(voice, ext) {
  const clips = fs.readdirSync(outDir)
    .filter(f => f.endsWith('.' + ext))
    .map(f => f.slice(0, -(ext.length + 1)))
    .sort();
  fs.writeFileSync(path.join(outDir, 'manifest.json'), JSON.stringify({ voiceName: voice, ext, clips }) + '\n', 'utf8');
  return clips.length;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const ext = args.format.endsWith('mp3') ? 'mp3' : args.format.includes('opus') ? 'ogg' : 'wav';

  const allTexts = collectSpokenTexts(DEFAULT_PRAYERS);
  let wanted = allTexts;
  if (args.prayer) {
    const prayer = DEFAULT_PRAYERS.find(p => p.id === args.prayer);
    if (!prayer) throw new Error(`No prayer with id "${args.prayer}"`);
    wanted = collectSpokenTexts([prayer]);
  }

  fs.mkdirSync(outDir, { recursive: true });
  const existing = new Set(fs.readdirSync(outDir).filter(f => f.endsWith('.' + ext)).map(f => f.slice(0, -(ext.length + 1))));
  const missing = [...wanted].filter(([k]) => !existing.has(k));
  const todo = missing.slice(0, args.limit);

  const chars = (list) => list.reduce((n, [, t]) => n + t.length, 0);
  const totalChars = chars([...allTexts]);
  const todoChars = chars(todo);
  const kbps = parseInt((args.format.match(/(\d+)kbitrate/) || [])[1] || '48', 10);
  const estMB = (c) => (c / CHARS_PER_SECOND) * kbps / 8 / 1024;
  const estHours = totalChars / CHARS_PER_SECOND / 3600;

  console.log(`Voice: ${args.voice}  rate ${args.rate}  format ${args.format}`);
  console.log(`All prayers: ${allTexts.size} unique lines, ${totalChars.toLocaleString()} chars (~${estHours.toFixed(1)} h audio, ~${estMB(totalChars).toFixed(0)} MB)`);
  console.log(`Already generated: ${existing.size}   To generate now: ${todo.length} lines, ${todoChars.toLocaleString()} chars`);
  console.log(`Estimated cost now: ~$${(todoChars / 1e6 * USD_PER_MILLION_CHARS).toFixed(2)} (free if within the F0 tier's 500k chars/month)`);

  if (args.prune) {
    const stale = [...existing].filter(k => !allTexts.has(k));
    stale.forEach(k => fs.unlinkSync(path.join(outDir, `${k}.${ext}`)));
    console.log(`Pruned ${stale.length} unused clips`);
  }

  if (args.dryRun || todo.length === 0) {
    if (!args.dryRun) console.log(`Manifest: ${writeManifest(args.voice, ext)} clips`);
    return;
  }

  loadEnv();
  const key = process.env.AZURE_SPEECH_KEY;
  const region = process.env.AZURE_SPEECH_REGION;
  if (!key || !region) {
    throw new Error('Set AZURE_SPEECH_KEY and AZURE_SPEECH_REGION in .env (see the header of this script).');
  }

  let done = 0, failed = 0, next = 0;
  const worker = async () => {
    while (next < todo.length) {
      const [clipKey, text] = todo[next++];
      try {
        const audio = await synthesize(text, { ...args, key, region });
        fs.writeFileSync(path.join(outDir, `${clipKey}.${ext}`), audio);
        done++;
      } catch (e) {
        failed++;
        console.error(`\n✗ ${clipKey} "${text.slice(0, 40)}": ${e.message}`);
        if (/ 401| 403/.test(e.message)) process.exit(1); // bad key: stop instead of failing every line
      }
      process.stdout.write(`\r  ${done + failed}/${todo.length} (failed ${failed})`);
    }
  };
  await Promise.all(Array.from({ length: args.concurrency }, worker));
  console.log(`\nGenerated ${done}, failed ${failed}. Manifest: ${writeManifest(args.voice, ext)} clips in ${path.relative(rootDir, outDir)}`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(e => { console.error(e.message); process.exit(1); });
}
