const mineflayer = require('@wp2508/mineflayer')

const bot = mineflayer.createBot({
  host: 'ry9.terohost.in',
  port: 25866,
  username: 'Mira',
  auth: 'offline',
  version: '26.3'
})

bot.on('login', () => console.log('MIRA LOGGED IN!'))
bot.on('kicked', reason => console.log('KICKED:', reason))
bot.on('error', err => console.log('ERROR:', err))
bot.on('end', reason => console.log('DISCONNECTED:', reason))
