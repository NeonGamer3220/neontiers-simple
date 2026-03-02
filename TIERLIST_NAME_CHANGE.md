# NeonTiers Bot - Tierlist Name Change Command

## Overview
Added a new Discord slash command `/tierlistnamechange` to change player names on the tierlist when they change their Minecraft username.

## Discord Command: /tierlistnamechange

### Usage:
```
/tierlistnamechange oldname: OldPlayerName newname: NewPlayerName
```

### Parameters:
- `oldname` - The current name on the tierlist
- `newname` - The new name to replace the old one

### Requirements:
- Only staff members (admin or STAFF_ROLE_ID) can use this command

### Example:
```
/tierlistnamechange oldname: Player123 newname: NewPlayer456
```

Result: All tierlist entries for "Player123" will be updated to "NewPlayer456" across all gamemodes, while keeping their tiers/ranks unchanged.

## Implementation Details

### Changes made:

1. **Discord Bot** (`neotiers-bot/main.py`):
   - Added `api_rename_player()` function to call the website API
   - Added `/tierlistnamechange` slash command
   - Command requires staff permissions

2. **Website API** (`neontiers-simple/app/api/tests/route.js`):
   - Added PUT endpoint `/api/tests/rename`
   - Uses `BOT_API_KEY` for authentication (same key the bot uses)

### Setup:

The bot already uses `BOT_API_KEY` to authenticate with the website. The rename endpoint uses the same key, so it should work automatically once deployed.

Make sure your Vercel environment has `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and optionally `BOT_API_KEY` (or it will use a default key).
