/**
 * Runs the full pipeline once for a single mode, without pushing to git.
 * Usage: node src/run-mode.ts <osu|taiko|fruits|mania> [--debug]
 */
import { modes, type ModeName } from './modes.ts';
import { runPipelineForMode } from './update-job.ts';

const modeName = process.argv[2];
if (!modeName || !(modeName in modes)) {
  console.error(`Usage: node src/run-mode.ts <${Object.keys(modes).join('|')}> [--debug]`);
  process.exit(1);
}
const mode = modes[modeName as ModeName];

await runPipelineForMode(mode);
console.log(`Done updating ${mode.text}`);
