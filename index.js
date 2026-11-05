const mineflayer = require('mineflayer');
const express = require('express');
const minecraftData = require('minecraft-data');
const pathfinderPackage = require('mineflayer-pathfinder');
const collectBlockPackage = require('mineflayer-collectblock');

const { pathfinder, Movements, goals } = pathfinderPackage;
const { GoalNear } = goals;
const collectBlockPlugin = collectBlockPackage.plugin || collectBlockPackage;

const app = express();
const PORT = Number(process.env.PORT || 5000);

const config = {
  host: process.env.MC_HOST || 'ry9.terohost.in',
  port: Number(process.env.MC_PORT || 25866),
  username: process.env.MC_USERNAME || 'Divinewealth',
  auth: process.env.MC_AUTH || 'offline',
  version: process.env.MC_VERSION || '26.3',
  password: process.env.MC_PASSWORD || '',
  reconnect: (process.env.AUTO_RECONNECT || 'true').toLowerCase() === 'true',
  reconnectDelay: Math.max(5000, Number(process.env.RECONNECT_DELAY || 15000)),
  trustedUsers: (process.env.TRUSTED_USERS || '').split(',').map(x => x.trim().toLowerCase()).filter(Boolean)
};

let bot = null;
let connected = false;
let startedAt = Date.now();
let lastError = '';
let reconnectTimer = null;
let reconnecting = false;
let shuttingDown = false;
let collecting = false;
let movement = null;

function log(message) {
  console.log(`[Divinewealth] ${message}`);
}

app.get('/', (_req, res) => {
  res.type('html').send(`<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>Divinewealth</title>
  <style>body{margin:0;background:#0f172a;color:#e2e8f0;font:16px system-ui;display:grid;place-items:center;min-height:100vh}.card{background:#1e293b;padding:28px;border-radius:18px;width:min(88%,420px);box-shadow:0 15px 45px #0006}h1{color:#5eead4}.item{padding:12px;margin:10px 0;background:#0f172a;border-radius:10px}.label{color:#94a3b8;font-size:12px;text-transform:uppercase}.value{font-size:18px;margin-top:4px}</style></head>
  <body><main class="card"><h1>✦ Divinewealth</h1><div class="item"><div class="label">Bot status</div><div class="value">${connected ? '🟢 Online' : '🔴 Disconnected'}</div></div><div class="item"><div class="label">Minecraft server</div><div class="value">${config.host}:${config.port}</div></div><div class="item"><div class="label">Uptime</div><div class="value">${Math.floor((Date.now()-startedAt)/1000)} seconds</div></div><div class="item"><div class="label">Last error</div><div class="value">${escapeHtml(lastError || 'None')}</div></div><p style="color:#94a3b8">Health endpoint: <code>/health</code></p></main></body></html>`);
});
app.get('/health', (_req, res) => res.json({
  status: connected ? 'connected' : 'disconnected',
  username: config.username,
  server: `${config.host}:${config.port}`,
  uptimeSeconds: Math.floor((Date.now() - startedAt) / 1000),
  position: bot && bot.entity ? bot.entity.position : null,
  lastError
}));
app.get('/ping', (_req, res) => res.send('pong'));

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

app.listen(PORT, '0.0.0.0', () => log(`Web status page listening on ${PORT}`));

function scheduleReconnect() {
  if (shuttingDown || !config.reconnect || reconnectTimer || reconnecting) return;
  reconnecting = true;
  log(`Reconnecting in ${config.reconnectDelay / 1000} seconds`);
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    reconnecting = false;
    createBot();
  }, config.reconnectDelay);
}

function isTrusted(username) {
  return config.trustedUsers.length === 0 || config.trustedUsers.includes(username.toLowerCase());
}

function tell(message) {
  if (bot && connected) bot.chat(message);
}

function findNearestLog() {
  if (!bot || !bot.entity) return null;
  const logs = bot.findBlocks({
    matching: block => block && block.name && /_log$|_wood$/.test(block.name),
    maxDistance: 32,
    count: 1
  });
  return logs.length ? bot.blockAt(logs[0]) : null;
}

async function gatherWood() {
  if (!bot || !connected || collecting) return;
  if (!bot.collectBlock || typeof bot.collectBlock.collect !== 'function') {
    tell('My gathering module is unavailable right now.');
    return;
  }
  const logBlock = findNearestLog();
  if (!logBlock) {
    tell('I cannot see a tree nearby. Please bring me closer to one.');
    return;
  }
  collecting = true;
  try {
    tell('I am gathering wood.');
    await bot.collectBlock.collect(logBlock);
    tell('I collected some wood.');
  } catch (err) {
    log(`Wood gathering stopped: ${err.message}`);
    tell('I could not reach that tree.');
  } finally {
    collecting = false;
  }
}

function setupBotEvents(currentBot) {
  currentBot.once('spawn', () => {
    connected = true;
    reconnecting = false;
    log(`Spawned as ${config.username} in the server.`);
    try {
      const data = minecraftData(currentBot.version);
      movement = new Movements(currentBot, data);
      currentBot.pathfinder.setMovements(movement);
    } catch (err) {
      log(`Movement setup warning: ${err.message}`);
    }
    if (config.password) {
      setTimeout(() => {
        if (connected) currentBot.chat(`/login ${config.password}`);
      }, 1200);
    }
  });

  currentBot.on('messagestr', message => {
    const msg = String(message).toLowerCase();
    if (!config.password) return;
    if (msg.includes('/login') || msg.includes('please login')) {
      currentBot.chat(`/login ${config.password}`);
    }
  });

  currentBot.on('chat', (username, message) => {
    if (username === currentBot.username || !isTrusted(username)) return;
    const command = message.trim().toLowerCase();
    if (command === '!dw help') {
      tell('Commands: !dw status, !dw come, !dw stop, !dw wood');
    } else if (command === '!dw status') {
      tell(connected ? 'I am online and ready.' : 'I am reconnecting.');
    } else if (command === '!dw come') {
      const player = currentBot.players[username];
      if (player && player.entity) {
        currentBot.pathfinder.setGoal(new GoalNear(
          player.entity.position.x, player.entity.position.y, player.entity.position.z, 2
        ));
        tell(`Coming over, ${username}.`);
      } else {
        tell('I cannot see you right now.');
      }
    } else if (command === '!dw stop') {
      currentBot.pathfinder.setGoal(null);
      if (currentBot.collectBlock && currentBot.collectBlock.cancelTask) currentBot.collectBlock.cancelTask();
      tell('Okay, I stopped moving and gathering.');
    } else if (command === '!dw wood') {
      void gatherWood();
    }
  });

  currentBot.on('kicked', reason => log(`Kicked: ${typeof reason === 'string' ? reason : JSON.stringify(reason)}`));
  currentBot.on('error', err => {
    lastError = err.message;
    log(`Bot error: ${err.message}`);
  });
  currentBot.on('end', reason => {
    connected = false;
    collecting = false;
    log(`Disconnected: ${reason || 'connection ended'}`);
    if (bot === currentBot) bot = null;
    scheduleReconnect();
  });
}

function createBot() {
  if (shuttingDown || bot) return;
  log(`Connecting to ${config.host}:${config.port} as ${config.username} (version ${config.version})`);
  try {
    const currentBot = mineflayer.createBot({
      host: config.host,
      port: config.port,
      username: config.username,
      auth: config.auth,
      version: config.version,
      hideErrors: false
    });
    bot = currentBot;
    currentBot.loadPlugin(pathfinder);
    currentBot.loadPlugin(collectBlockPlugin);
    setupBotEvents(currentBot);
  } catch (err) {
    lastError = err.message;
    log(`Could not start bot: ${err.message}`);
    bot = null;
    scheduleReconnect();
  }
}

process.on('SIGTERM', () => {
  shuttingDown = true;
  if (reconnectTimer) clearTimeout(reconnectTimer);
  if (bot) bot.quit('Service stopping');
  process.exit(0);
});
process.on('SIGINT', () => {
  shuttingDown = true;
  if (reconnectTimer) clearTimeout(reconnectTimer);
  if (bot) bot.quit('Service stopping');
  process.exit(0);
});

createBot();
