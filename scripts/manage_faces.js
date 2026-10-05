/**
 * scripts/manage_faces.js
 *
 * Manage enrolled biometric face identities on Render or Localhost.
 *
 * Usage:
 *   node scripts/manage_faces.js list
 *   node scripts/manage_faces.js delete <identity_name>
 *   node scripts/manage_faces.js list --local
 *   node scripts/manage_faces.js delete <identity_name> --local
 */

const targetIsLocal = process.argv.includes('--local');
const BASE_URL = targetIsLocal
  ? 'http://127.0.0.1:8000'
  : (process.env.FACE_SERVICE_URL || 'https://sahakar-face-service.onrender.com').replace(/\/+$/, '');

const command = process.argv[2] || 'list';
const identityName = process.argv[3] && !process.argv[3].startsWith('--') ? process.argv[3] : null;

async function run() {
  console.log(`\n🔍 Target Service: ${BASE_URL} (${targetIsLocal ? 'Localhost' : 'Render'})\n`);

  if (command === 'list') {
    try {
      const res = await fetch(`${BASE_URL}/identities`, {
        headers: { 'Connection': 'close' },
        signal: AbortSignal.timeout(30000),
      });

      if (!res.ok) {
        throw new Error(`Service returned HTTP ${res.status}: ${await res.text()}`);
      }

      const data = await res.json();
      const list = data.identities || [];
      console.log(`📋 Total Enrolled Faces: ${list.length}`);
      if (list.length === 0) {
        console.log('   (No face identities enrolled)');
      } else {
        list.forEach((id, idx) => console.log(`   ${idx + 1}. ${id}`));
      }
      console.log('');
    } catch (err) {
      console.error('❌ Failed to list identities:', err.message);
    }
  } else if (command === 'delete' || command === 'remove') {
    if (!identityName) {
      console.error('❌ Please specify the identity name to delete.');
      console.log('   Example: node scripts/manage_faces.js delete rameshwar');
      process.exit(1);
    }

    try {
      const res = await fetch(`${BASE_URL}/identities/${encodeURIComponent(identityName)}`, {
        method: 'DELETE',
        headers: { 'Connection': 'close' },
        signal: AbortSignal.timeout(30000),
      });

      const data = await res.json();
      if (data.success) {
        console.log(`✅ Success: ${data.message || `Deleted identity "${identityName}"`}`);
      } else {
        console.warn(`⚠️ Warning: ${data.message || `Could not delete "${identityName}"`}`);
      }

      // Show remaining
      const listRes = await fetch(`${BASE_URL}/identities`, { headers: { 'Connection': 'close' } });
      if (listRes.ok) {
        const remaining = await listRes.json();
        console.log(`\n📋 Remaining Enrolled Faces (${remaining.identities?.length || 0}):`, remaining.identities);
      }
    } catch (err) {
      console.error(`❌ Failed to delete "${identityName}":`, err.message);
    }
  } else {
    console.log('Unknown command. Available commands:');
    console.log('  node scripts/manage_faces.js list');
    console.log('  node scripts/manage_faces.js delete <name>');
  }
}

run();
