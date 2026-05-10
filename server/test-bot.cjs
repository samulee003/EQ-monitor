const http = require('http');

function sendWebhook(text, replyToken = 'test_token') {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: 'localhost',
      port: 3000,
      path: '/webhook',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    req.on('error', e => reject(e));
    req.write(JSON.stringify({
      events: [{
        type: 'message',
        message: { type: 'text', text },
        source: { type: 'user', userId: 'test_user_demo' },
        replyToken,
        timestamp: Date.now()
      }]
    }));
    req.end();
  });
}

async function run() {
  console.log('=== 今心 Bot 端到端測試 ===\n');
  const steps = [
    '我今天很焦慮',
    '胸口',
    '焦慮',
    '安全感',
    '我好累不想管了',
    '呼吸',
    '好多了'
  ];
  for (let i = 0; i < steps.length; i++) {
    console.log(`[用戶] ${steps[i]}`);
    const res = await sendWebhook(steps[i], `token_${i}`);
    console.log(`[HTTP] ${res.status}\n`);
    await new Promise(r => setTimeout(r, 100));
  }
  console.log('=== 測試完成 ===');
}

run().catch(e => console.error('Error:', e.message));
