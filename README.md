# Divinewealth FrostBot 1.0.2

This update fixes the CommonJS/ESM import error from `mineflayer-pathfinder` by importing the package as a default object and reading `pathfinder`, `Movements`, and `goals` from it.

## GitHub root files
Upload `index.js`, `package.json`, `railway.json`, `.env.example`, `.gitignore`, and `README.md` directly into the repository root. Replace the previous versions.

## Railway
Set Custom Start Command to `node index.js` (or leave it blank if Railway uses `npm start` from package.json). Commit the updated files to `main`, then deploy the latest commit.

## Railway Variables
- `MC_HOST=ry9.terohost.in`
- `MC_PORT=25866`
- `MC_USERNAME=Divinewealth`
- `MC_AUTH=offline` (only if your server is in offline/cracked mode; use the appropriate auth setting for your server)
- `MC_VERSION=26.3`
- `AUTO_RECONNECT=true`

## Chat commands
- `divinewealth come`
- `divinewealth status`
- `divinewealth stop`

The bot attempts to eat suitable food from its inventory when its food level is low. Minecraft 26.3 protocol compatibility still depends on the Mineflayer fork supporting the server's exact protocol; a separate version error after startup means the protocol library needs updating.
