// Verify the RAG chatbot with 3 test questions
// Run: npx tsx test_chat_rag.ts
import 'dotenv/config';

async function login(): Promise<string> {
  // Try trainee first, then admin
  for (const creds of [
    { identifier: 'rameshwar.pacs@gmail.com', password: 'Demo@1234' },
    { identifier: 'superadmin@ncct.gov.in', password: 'Super@1234' },
    { identifier: 'admin.vamnicom@ncct.gov.in', password: 'Admin@1234' },
  ]) {
    try {
      const r = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(creds),
      });
      const data = await r.json() as any;
      if (data.token) {
        console.log(`✅ Logged in as: ${creds.identifier}`);
        return data.token;
      }
    } catch {}
  }
  throw new Error('Could not obtain JWT — check backend is running and credentials are seeded');
}

async function askChat(token: string, question: string): Promise<void> {
  console.log('\n' + '─'.repeat(60));
  console.log(`Q: ${question}`);
  const r = await fetch('http://localhost:5000/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ message: question }),
  });
  const data = await r.json() as any;
  console.log(`A: ${data.message}`);
  if (data._debug) {
    console.log(`   [debug] snippets retrieved: ${data._debug.snippetsRetrieved}`);
    data._debug.snippetTopics?.forEach((t: string) => console.log(`    • ${t}`));
  }
}

async function main() {
  const token = await login();

  // Test 1: Should retrieve PMEGP snippet → grounded answer
  await askChat(token, 'What is PMEGP and who is eligible for it?');

  // Test 2: Should retrieve PACS/KCC/NCCT snippets → grounded answer
  await askChat(token, 'How does PACS computerization help cooperative trainees get jobs?');

  // Test 3: Off-topic — no snippet matches → honest "I don't have info"
  await askChat(token, 'What is the weather forecast for Delhi tomorrow?');
}

main().catch(console.error);
