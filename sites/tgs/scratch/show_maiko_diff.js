const { execSync } = require('child_process');

try {
  const output = execSync('git show 5a242e5', { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });
  const lines = output.split('\n');
  let found = false;
  let count = 0;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('handleSendMaikoMessage')) {
      found = true;
      console.log('--- MATCH FOUND ---');
      // Print 50 lines before and 150 lines after
      const start = Math.max(0, i - 20);
      const end = Math.min(lines.length, i + 120);
      for (let j = start; j < end; j++) {
        console.log(`${j}: ${lines[j]}`);
      }
      break;
    }
  }
  if (!found) {
    console.log('Not found in git show output.');
  }
} catch (e) {
  console.error(e);
}
