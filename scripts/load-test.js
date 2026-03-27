#!/usr/bin/env node
/**
 * Load Test per IotaPolis
 *
 * Genera post, reply, voti in parallelo per testare il comportamento
 * sotto carico. Usa l'identità dell'utente corrente da localStorage
 * oppure genera una nuova identità RSA-2048.
 *
 * Usage:
 *   node scripts/load-test.js [options]
 *
 * Options:
 *   --posts N       Numero di post top-level (default: 50)
 *   --replies N     Numero di reply per post (default: 3)
 *   --votes N       Numero di voti casuali (default: 20)
 *   --parallel N    Concorrenza (default: 5)
 *   --thread ID     Thread ID esistente (default: cerca il primo disponibile)
 *   --base-url URL  URL del server (default: http://localhost:1337)
 *   --delay MS      Delay tra batch in ms (default: 500)
 */

const crypto = require('crypto');

// ── Config ──────────────────────────────────────────────────────────

const args = process.argv.slice(2);
function getArg(name, def) {
  const idx = args.indexOf(`--${name}`);
  if (idx === -1) return def;
  return args[idx + 1] || def;
}

const NUM_POSTS = parseInt(getArg('posts', '50'), 10);
const REPLIES_PER_POST = parseInt(getArg('replies', '3'), 10);
const NUM_VOTES = parseInt(getArg('votes', '20'), 10);
const PARALLEL = parseInt(getArg('parallel', '5'), 10);
const THREAD_ID = getArg('thread', null);
const BASE_URL = getArg('base-url', 'http://localhost:1337');
const DELAY_MS = parseInt(getArg('delay', '500'), 10);

// ── RSA Key Generation ──────────────────────────────────────────────

function generateKeypair() {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  });
  return { publicKey, privateKey };
}

function deriveUserId(publicKeyPem) {
  const hash = crypto.createHash('sha256').update(publicKeyPem).digest('hex');
  return 'USR_' + hash.substring(0, 16).toUpperCase();
}

function signPayload(privateKeyPem, payload) {
  const cleaned = { ...payload };
  delete cleaned.signature;
  delete cleaned.publicKey;
  const sortedKeys = Object.keys(cleaned).sort();
  const sorted = {};
  for (const key of sortedKeys) sorted[key] = cleaned[key];
  const canonical = JSON.stringify(sorted);

  const signer = crypto.createSign('RSA-SHA256');
  signer.update(canonical);
  return signer.sign(privateKeyPem, 'base64');
}

// ── API Helpers ─────────────────────────────────────────────────────

async function apiCall(method, path, data, identity) {
  const payload = {
    ...data,
    authorId: identity.userId,
    nonce: crypto.randomUUID(),
    createdAt: Date.now(),
  };

  const signature = signPayload(identity.privateKey, payload);

  const body = {
    ...payload,
    signature,
    publicKey: identity.publicKey,
  };

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const json = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, ...json };
}

// ── Stats ───────────────────────────────────────────────────────────

const stats = {
  registrations: { ok: 0, fail: 0 },
  posts: { ok: 0, fail: 0, times: [] },
  replies: { ok: 0, fail: 0, times: [] },
  votes: { ok: 0, fail: 0, times: [] },
  startTime: 0,
};

function avg(arr) {
  if (arr.length === 0) return 0;
  return Math.round(arr.reduce((a, b) => a + b, 0) / arr.length);
}

function p95(arr) {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length * 0.95)];
}

function printStats() {
  const elapsed = ((Date.now() - stats.startTime) / 1000).toFixed(1);
  const total = stats.posts.ok + stats.replies.ok + stats.votes.ok;
  const totalFail = stats.posts.fail + stats.replies.fail + stats.votes.fail;
  const tps = (total / (elapsed || 1)).toFixed(1);

  console.log('\n═══════════════════════════════════════════════');
  console.log('  LOAD TEST RESULTS');
  console.log('═══════════════════════════════════════════════');
  console.log(`  Duration:       ${elapsed}s`);
  console.log(`  Total TX:       ${total} ok / ${totalFail} fail`);
  console.log(`  Throughput:     ${tps} tx/s`);
  console.log('');
  console.log(`  Posts:          ${stats.posts.ok} ok / ${stats.posts.fail} fail`);
  console.log(`    avg: ${avg(stats.posts.times)}ms  p95: ${p95(stats.posts.times)}ms`);
  console.log(`  Replies:        ${stats.replies.ok} ok / ${stats.replies.fail} fail`);
  console.log(`    avg: ${avg(stats.replies.times)}ms  p95: ${p95(stats.replies.times)}ms`);
  console.log(`  Votes:          ${stats.votes.ok} ok / ${stats.votes.fail} fail`);
  console.log(`    avg: ${avg(stats.votes.times)}ms  p95: ${p95(stats.votes.times)}ms`);
  console.log('═══════════════════════════════════════════════\n');
}

// ── Parallel Runner ─────────────────────────────────────────────────

async function runBatch(tasks, concurrency) {
  const results = [];
  let idx = 0;

  async function worker() {
    while (idx < tasks.length) {
      const taskIdx = idx++;
      const task = tasks[taskIdx];
      try {
        results[taskIdx] = await task();
      } catch (err) {
        results[taskIdx] = { ok: false, error: err.message };
      }
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, tasks.length) }, () => worker());
  await Promise.all(workers);
  return results;
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

// ── Main ────────────────────────────────────────────────────────────

async function main() {
  console.log('IotaPolis — Load Test');
  console.log(`Config: ${NUM_POSTS} posts, ${REPLIES_PER_POST} replies/post, ${NUM_VOTES} votes, parallel=${PARALLEL}`);
  console.log(`Server: ${BASE_URL}\n`);

  // 1. Generate identity
  console.log('[1/6] Generating test identity...');
  const { publicKey, privateKey } = generateKeypair();
  const userId = deriveUserId(publicKey);
  const identity = { publicKey, privateKey, userId };
  console.log(`  userId: ${userId}`);

  // 2. Register
  console.log('[2/6] Registering user...');
  const regResult = await apiCall('POST', '/api/v1/register', {
    username: `loadtest_${Date.now().toString(36)}`,
  }, identity);
  if (regResult.ok || regResult.success) {
    stats.registrations.ok++;
    console.log('  Registered OK');
  } else {
    stats.registrations.fail++;
    console.log('  Registration failed:', regResult.error || regResult.status);
    // Potrebbe essere gia registrato, continuiamo
  }

  // 3. Find thread
  let threadId = THREAD_ID;
  if (!threadId) {
    console.log('[3/6] Finding thread...');
    const threadsRes = await fetch(`${BASE_URL}/api/v1/threads?page=1`);
    const threadsData = await threadsRes.json();
    const threads = threadsData.threads || threadsData.data || (Array.isArray(threadsData) ? threadsData : []);
    if (threads.length > 0) {
      threadId = threads[0].id;
      console.log(`  Using existing thread: ${threadId}`);
    } else {
      console.log('  No threads found. You need at least one thread. Create one manually first.');
      process.exit(1);
    }
  } else {
    console.log(`[3/6] Using provided thread: ${threadId}`);
  }

  stats.startTime = Date.now();

  // 4. Flood posts
  console.log(`[4/6] Creating ${NUM_POSTS} posts (parallel=${PARALLEL})...`);
  const postIds = [];
  const postTasks = Array.from({ length: NUM_POSTS }, (_, i) => async () => {
    const t0 = Date.now();
    const res = await apiCall('POST', '/api/v1/posts', {
      threadId,
      parentId: null,
      content: `Load test post #${i + 1} — ${crypto.randomBytes(16).toString('hex')}\n\nLorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.`,
    }, identity);
    const elapsed = Date.now() - t0;

    if (res.success) {
      stats.posts.ok++;
      stats.posts.times.push(elapsed);
      postIds.push(res.post?.id || `POST_unknown_${i}`);
      if (stats.posts.ok % 10 === 0) process.stdout.write(`  ${stats.posts.ok}/${NUM_POSTS} posts...\r`);
    } else {
      stats.posts.fail++;
      if (stats.posts.fail <= 3) console.log(`  Post #${i + 1} failed: ${res.error}`);
    }
    return res;
  });

  // Run in batches to avoid overwhelming the TX queue
  for (let i = 0; i < postTasks.length; i += PARALLEL) {
    const batch = postTasks.slice(i, i + PARALLEL);
    await runBatch(batch, PARALLEL);
    if (DELAY_MS > 0 && i + PARALLEL < postTasks.length) await sleep(DELAY_MS);
  }
  console.log(`  Posts done: ${stats.posts.ok} ok / ${stats.posts.fail} fail`);

  // 5. Flood replies
  const totalReplies = Math.min(postIds.length, NUM_POSTS) * REPLIES_PER_POST;
  console.log(`[5/6] Creating ${totalReplies} replies (parallel=${PARALLEL})...`);
  const replyTasks = [];
  for (const parentId of postIds.slice(0, NUM_POSTS)) {
    for (let r = 0; r < REPLIES_PER_POST; r++) {
      replyTasks.push(async () => {
        const t0 = Date.now();
        const res = await apiCall('POST', '/api/v1/posts', {
          threadId,
          parentId,
          content: `Reply ${r + 1} to ${parentId} — ${crypto.randomBytes(8).toString('hex')}`,
        }, identity);
        const elapsed = Date.now() - t0;

        if (res.success) {
          stats.replies.ok++;
          stats.replies.times.push(elapsed);
          if (stats.replies.ok % 20 === 0) process.stdout.write(`  ${stats.replies.ok}/${totalReplies} replies...\r`);
        } else {
          stats.replies.fail++;
        }
        return res;
      });
    }
  }

  for (let i = 0; i < replyTasks.length; i += PARALLEL) {
    const batch = replyTasks.slice(i, i + PARALLEL);
    await runBatch(batch, PARALLEL);
    if (DELAY_MS > 0 && i + PARALLEL < replyTasks.length) await sleep(DELAY_MS);
  }
  console.log(`  Replies done: ${stats.replies.ok} ok / ${stats.replies.fail} fail`);

  // 6. Flood votes
  console.log(`[6/6] Casting ${NUM_VOTES} votes (parallel=${PARALLEL})...`);
  const allPostIds = [...postIds];
  const voteTasks = Array.from({ length: NUM_VOTES }, (_, i) => async () => {
    const targetPost = allPostIds[i % allPostIds.length];
    if (!targetPost) return { ok: false };
    const t0 = Date.now();
    const res = await apiCall('POST', '/api/v1/vote', {
      postId: targetPost,
      vote: Math.random() > 0.3 ? 1 : -1,
    }, identity);
    const elapsed = Date.now() - t0;

    if (res.success) {
      stats.votes.ok++;
      stats.votes.times.push(elapsed);
    } else {
      stats.votes.fail++;
    }
    return res;
  });

  for (let i = 0; i < voteTasks.length; i += PARALLEL) {
    const batch = voteTasks.slice(i, i + PARALLEL);
    await runBatch(batch, PARALLEL);
    if (DELAY_MS > 0 && i + PARALLEL < voteTasks.length) await sleep(DELAY_MS);
  }
  console.log(`  Votes done: ${stats.votes.ok} ok / ${stats.votes.fail} fail`);

  // Results
  printStats();

  // Integrity check
  console.log('Running integrity check...');
  try {
    const res = await fetch(`${BASE_URL}/api/v1/integrity-check`);
    const data = await res.json();
    console.log(`Integrity: ${data.synced ? 'SYNCED' : 'MISMATCH'}`);
    console.log(`  Local:  users=${data.local?.users} cats=${data.local?.categories} threads=${data.local?.threads} posts=${data.local?.posts} votes=${data.local?.votes}`);
    console.log(`  Chain:  users=${data.chain?.users} cats=${data.chain?.categories} threads=${data.chain?.threads} posts=${data.chain?.posts} votes=${data.chain?.votes}`);
    if (data.mismatches) {
      for (const m of data.mismatches) {
        console.log(`  MISMATCH: ${m.entity} — local=${m.local} chain=${m.chain} diff=${m.diff}`);
      }
    }
  } catch (err) {
    console.log('Integrity check failed:', err.message);
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
