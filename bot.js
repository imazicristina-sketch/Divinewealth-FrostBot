const mineflayer = require('./index.js')

const bot = mineflayer.createBot({
  host: 'ry9.terohost.in',
  port: 25866,
  username: 'FrostBot',
  auth: 'offline'
})

bot.on('login', () => console.log('Bot connected!'))
bot.on('error', console.log)
bot.on('end', () => console.log('Bot disconnected'))
