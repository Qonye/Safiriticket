// Seed script runner
const { exec } = require('child_process');
const path = require('path');

console.log('Starting Jungle Dwellers CRM seed...');

// Run the TypeScript seed file
exec('npx tsx src/lib/seed.ts', { cwd: __dirname }, (error, stdout, stderr) => {
  if (error) {
    console.error('Error running seed script:', error);
    return;
  }
  
  if (stderr) {
    console.error('Seed script stderr:', stderr);
  }
  
  console.log('Seed script output:', stdout);
  console.log('Seed completed!');
});
