const mineflayer = require('mineflayer');

const bot = mineflayer.createBot({
  host: 'ry9.terohost.in',
  port: 25866,
  username: 'FrostBot',
  auth: 'offline'
});

bot.on('login', () => console.log('FrostBot connected!'));
bot.on('error', err => console.log(err));
bot.on('end', () => console.log('Bot disconnected'));
