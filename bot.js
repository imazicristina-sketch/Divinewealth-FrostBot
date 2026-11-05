const mineflayer = require('./index.js')

const bot = mineflayer.createBot({
  host: 'ry9.terohost.in',
  port: 25866,
  username: 'YourMinecraftName',
  auth: 'offline'
})

bot.on('login', () => console.log('Bot connected!'))
bot.on('error', err => console.log('Bot error:', err))
bot.on('end', () => console.log('Bot disconnected'))
