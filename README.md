# Divinewealth FrostBot

A Railway-hosted Mineflayer survival-bot starter for a Minecraft Java server.

## Important compatibility note
This starter pins the community `@wp2508/mineflayer` fork (4.42.7), which advertises Minecraft 26.3 / protocol 777 support. This is not the upstream PrismarineJS release. Compatibility still needs a real connection test against your exact Paper build; successful installation alone does not prove the bot can spawn or pathfind correctly.

## Deploy on Railway
1. Push this folder to a new GitHub repository (or merge it into your existing bot repo).
2. Create a Railway project from that GitHub repository.
3. Add these Variables in Railway:
   - `MC_HOST` = `ry9.terohost.in`
   - `MC_PORT` = `25866`
   - `MC_USERNAME` = `Divinewealth`
   - `MC_AUTH` = `offline`
   - `MC_VERSION` = `26.3`
4. Deploy. View logs to confirm the protocol handshake and `Spawned` message.

## Current starter features
- Offline-mode connection configuration
- Railway start/restart configuration
- Automatic reconnect after disconnect
- Pathfinder plugin loaded
- Basic chat commands: `!dw stop`, `!dw follow`, `!dw status`
- Basic hunger management using food already in inventory

## Not implemented yet
This is **not yet** the full autonomous-survival player requested. Wood gathering, full crafting progression, mining, building a base, chest logistics, farming, exploration planning, animal hunting, and nuanced player interaction require additional task-planner modules and in-game testing. The starter intentionally does not attack players or modify other players' builds.

## Security
Offline-mode servers do not authenticate the username with Microsoft. Anyone who can connect may be able to impersonate a username unless your server has suitable authentication/whitelist protections. Use a dedicated bot username and protect admin permissions. Never put passwords, tokens, or Railway secrets in GitHub.
