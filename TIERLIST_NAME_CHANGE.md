# NeonTiers Bot - Tierlist Name Change Command

## Overview
Added a new API endpoint to change player names on the tierlist when they change their Minecraft username.

## API Endpoint: PUT /api/tests/rename

### Authentication
The endpoint requires an admin API key for security. Set the `ADMIN_API_KEY` environment variable in your `.env` file.

### Request
```http
PUT /api/tests/rename
Authorization: Bearer YOUR_ADMIN_API_KEY
Content-Type: application/json

{
  "oldName": "OldPlayerName",
  "newName": "NewPlayerName"
}
```

### Alternative JSON keys accepted:
- `oldName`: oldName, old_name, currentName, current_name, old, previous, from
- `newName`: newName, new_name, name, new

### Response (Success)
```json
{
  "ok": true,
  "message": "Successfully renamed \"OldPlayerName\" to \"NewPlayerName\"",
  "updatedCount": 3,
  "updatedRecords": [
    {
      "id": 1,
      "username": "NewPlayerName",
      "gamemode": "UHC",
      "rank": "HT1",
      "points": 10,
      "created_at": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

### Response (Error)
- 400: Missing oldName or newName
- 401: Missing or invalid authorization header
- 403: Invalid API key
- 404: Player not found
- 500: Server error

## Setup

### 1. Add Environment Variable (Optional)
You can customize the key, but a default key is already set:
```
ADMIN_API_KEY=neontiers-admin-2024-secure
```

> **Security Note:** It's recommended to change this to your own secure key in production!

### 2. Discord Slash Command (for your bot)
In your Discord bot code, add a new slash command:

```javascript
const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('tierlistnamechange')
    .setDescription('Change a player name on the tierlist (admin only)')
    .addStringOption(option =>
      option.setName('oldname')
        .setDescription('The current name on the tierlist')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('newname')
        .setDescription('The new name to replace the old one')
        .setRequired(true)),
  
  async execute(interaction) {
    // Check if user has admin permissions
    if (!interaction.member.permissions.has('Administrator')) {
      return interaction.reply({ content: '❌ You don\'t have permission to use this command!', ephemeral: true });
    }

    const oldName = interaction.options.getString('oldname');
    const newName = interaction.options.getString('newname');

    try {
      const response = await fetch('https://your-app.vercel.app/api/tests/rename', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer neontiers-admin-2024-secure`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ oldName, newName })
      });

      const data = await response.json();

      if (!response.ok) {
        return interaction.reply({ content: `❌ Error: ${data.error}`, ephemeral: true });
      }

      await interaction.reply({ 
        content: `✅ Successfully renamed **${oldName}** to **${newName}**\nUpdated ${data.updatedCount} tierlist entries.`,
        ephemeral: false 
      });
    } catch (error) {
      await interaction.reply({ content: `❌ Failed to update name: ${error.message}`, ephemeral: true });
    }
  }
};
```

## Usage
After setting up:
1. Run `/tierlistnamechange OldName NewName` in Discord
2. The command will update all tierlist entries for that player
3. The tiers/ranks remain unchanged, only the display name is updated

## Notes
- This updates ALL tier entries for a player (across all gamemodes)
- The tiers and points remain unchanged
- Only the username display is modified
