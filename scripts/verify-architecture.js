import { execSync } from 'node:child_process';
import dotenv from 'dotenv';
import { 
  purgeObsoleteBranchFiles, 
  readActiveVectors, 
  validateCycleSequence, 
  validateTokenGate, 
  runParallelBackgroundChecks 
} from './lib/cycle-steps.js';
import { purgeObsoleteSnapshots } from './lib/snapshots.js';
import { cleanClosedTickets } from './lib/utils.js';
import { runTsRules } from './lib/ts-rules.js';

async function main() {
  console.log('🔍 Exekverar verifiering (v9.8)...');

  // 1. Tillståndsrening vid cykelstart
  purgeObsoleteBranchFiles();
  purgeObsoleteSnapshots();

  // 2. Sekvensvalidering för linjärt/förgrenat läge
  const seq = validateCycleSequence();
  if (!seq.valid) {
    console.error(`❌ Sekvensfel: ${seq.error}`);
    process.exit(1);
  }
  console.log(`✅ Sekvens godkänd (${seq.mode}-läge, Vektorer: [${seq.vectors.join(', ')}])`);

  // 3. Parallella API-kontroller i bakgrunden
  const bg = await runParallelBackgroundChecks(seq.vectors);
  if (bg.executed) {
    console.log(`⚡ Parallella bakgrundskontroller utförda för ${bg.results.length} vektorer.`);
  }

  // 4. TypeScript-kompilation och typvalidering
  const tsOk = runTsRules();
  if (!tsOk) {
    console.error('❌ TypeScript-validering misslyckades.');
    process.exit(1);
  }

  // 5. Exekvering av enhetstester och villkorliga live-tester
  console.log('🧪 Exekverar offline-enhetstester...');
  try {
    execSync('pnpm test', { stdio: 'inherit' });
  } catch {
    console.error('❌ Enhetstester misslyckades.');
    process.exit(1);
  }

  const changedFiles = execSync('git diff --cached --name-only').toString();
  const requiresLiveTest = 
    changedFiles.includes('src/features/live_translation/') || 
    changedFiles.includes('src/server/routes.ts') || 
    changedFiles.includes('websocket') ||
    changedFiles.includes('auth');

  if (requiresLiveTest) {
    dotenv.config({ path: '.env.local' });
    if (process.env.GEMINI_API_KEY) {
      console.log('⚡ Upptäckte gränssnittsändring. Exekverar pnpm test:live...');
      try {
        execSync('pnpm test:live', { stdio: 'inherit' });
      } catch {
        console.error('❌ Skarpa live-tester misslyckades.');
        process.exit(1);
      }
    } else {
      console.log('⚠️ Ändring kräver kontraktsverifiering, men GEMINI_API_KEY saknas i .env.local. Fortsätter offline.');
    }
  }

  // 6. Automatisk biljettrening vid cykelavslut
  cleanClosedTickets();

  console.log('🚀 Verifiering fullbordad utan anmärkningar!');
}

main();