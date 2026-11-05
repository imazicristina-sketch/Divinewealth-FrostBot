const mineflayer = require('mineflayer');

const bot = mineflayer.createBot({
  host: process.env.MC_SERVER_HOST,
  port: Number(process.env.MC_SERVER_PORT || 25866),
  username: 'FrostBot',
  auth: 'offline'
});

bot.on('login', () => console.log('Bot joined server!'));
bot.on('error', err => console.log(err));
bot.on('end', () => console.log('Bot disconnected'));
