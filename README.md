# Divinewealth FrostBot — Fixed starter

This project uses **CommonJS** consistently, so `mineflayer-pathfinder` is loaded using `require()` rather than incompatible ES-module named imports.

## Railway setup
1. Upload these files to the **root** of your GitHub repository (same level as `package.json`).
2. In Railway, connect that repository and branch `main`.
3. In Railway → Settings → Deploy, leave the custom Build Command and Custom Start Command empty. Railway should detect `npm start` from `package.json`.
4. In Railway → Variables, add the values from `.env.example`.
5. Deploy the latest commit.

## Variables
- `MC_HOST`: Minecraft server hostname
- `MC_PORT`: Minecraft server port
- `MC_USERNAME`: bot username (default `Divinewealth`)
- `MC_AUTH`: `offline` for offline-mode servers, or the supported auth mode for your account
- `MC_VERSION`: server version; use `26.3` only if the installed Mineflayer fork supports it
- `MC_PASSWORD`: optional server `/login` password. Prefer a server-specific password and do not share it.
- `AUTO_RECONNECT`: `true` or `false`
- `TRUSTED_USERS`: optional comma-separated usernames allowed to use `!dw` commands

## Commands
- `!dw help`
- `!dw status`
- `!dw come`
- `!dw stop`
- `!dw wood` — gathers a nearby tree when reachable.

## Important compatibility note
This is a clean starter, not a guarantee that every Minecraft version is supported by the Mineflayer fork. If the bot reports a protocol/version error for `26.3`, the Mineflayer package must be updated to a release/fork that explicitly supports that server protocol. The code also does not grant itself OP or Creative mode.
