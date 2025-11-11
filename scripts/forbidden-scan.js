const fs = require('fs');
const path = require('path');

// Only block OLD BRAND terms, not the clinical word "overdose"
const needles = [
  /ODC Tracker/i,
  /Overdose Tracker/i,
  // block bare ODC unless followed by " Log"
  /\bODC\b(?!\s*Log)/i,
];
const skip = new Set([
  'node_modules', '.git', 'dist', 'build', '.expo', '.gradle', 
  'ios/Pods', 'android/build', 'android/.cxx', '.cxx',
  '.env', '.env.local', '.env.example' // Skip env files - they're not in the app
]);

// Ignore patterns for files we don't need to scan
const IGNORE_PARTS = [
  '__tests__/',
  'supabase/migrations/',
  'package-lock.json',
  'scripts/forbidden-scan.js', // don't flag our own patterns
  'rebrand-safe.ps1',          // rebrand helper contains old text intentionally
  'TESTFLIGHT_SETUP.md',       // docs examples
  '.env',                      // not bundled in app
  'test-', // test scripts
  'debug-', // debug scripts
  'check-', // check scripts
  'fix-', // fix scripts
  'apply-', // apply scripts
  'create-', // create scripts
  'analyze-', // analyze scripts
  'diagnose-', // diagnose scripts
  'disable-', // disable scripts
  'final-', // final scripts
  'find-', // find scripts
  'nuclear-', // nuclear scripts
  'permanent-', // permanent scripts
  'complete-', // complete scripts
];

function shouldIgnore(filePath) {
  const normalized = filePath.replace(/\\/g, '/');
  return IGNORE_PARTS.some(p => normalized.includes(p));
}

let errors = 0;

function walk(dir) {
  try {
    for (const f of fs.readdirSync(dir)) {
      const p = path.join(dir, f);
      const st = fs.statSync(p);
      
      if (st.isDirectory()) { 
        // Skip if folder name matches or if path contains skip patterns
        const shouldSkip = skip.has(f) || Array.from(skip).some(pattern => p.includes(pattern));
        if (!shouldSkip) walk(p); 
        continue; 
      }
      
      if (!st.isFile()) continue;
      
      // Skip ignored files
      if (shouldIgnore(p)) continue;
      
      // Skip binary files and large files
      if (st.size > 1024 * 1024) continue; // Skip files > 1MB
      if (path.extname(f).match(/\.(png|jpg|jpeg|gif|ico|ttf|woff|woff2|eot|zip|jar|so|dylib|a)$/i)) continue;
      
      try {
        const txt = fs.readFileSync(p, 'utf8');
        needles.forEach(rx => {
          if (rx.test(txt)) {
            console.log(`[HIT] ${p} :: ${rx}`);
            errors++;
          }
        });
      } catch (e) {
        // Skip files that can't be read as text
      }
    }
  } catch (e) {
    // Skip directories that can't be read
  }
}

console.log('🔍 Scanning for brand references...');
walk(process.cwd());

if (errors) {
  console.error(`\n❌ Forbidden string hits: ${errors}`);
  console.log('\n💡 Review the hits above and update as needed for brand compliance.');
  process.exit(1);
} else {
  console.log('\n✅ No forbidden brand references found!');
}