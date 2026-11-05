const mineflayer = require('./index.js')

const bot = mineflayer.createBot({
  host: 'ry9.terohost.in',
  port: 25866,
  username: 'Mira',
  auth: 'offline'
})

bot.on('login', () => {
  console.log('SUCCESS: Mira logged in!')
})

bot.on('kicked', reason => {
  console.log('KICKED:', reason)
})

bot.on('error', err => {
  console.log('ERROR:', err)
})

bot.on('end', reason => {
  console.log('DISCONNECTED:', reason)
})
