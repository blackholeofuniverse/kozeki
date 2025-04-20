# Kozeki Discord Moderation Bot


A simple yet powerful Discord moderation bot designed to help server administrators and moderators manage their communities effectively.

## Features

- **User Moderation**: Mute, unmute, ban, and unban users with simple commands
- **Customizable Timeouts**: Set custom durations for mutes (from seconds to weeks)
- **Reason Tracking**: Add reasons for moderation actions for better record-keeping
- **Admin-Only Commands**: Ensures only authorized users can perform moderation actions

## Setup Guide

### Prerequisites

- Node.js (v16.9.0 or higher)
- A Discord Bot Token
- Proper bot permissions in your Discord server (including VIEW_AUDIT_LOG permission)

### Installation

1. Clone this repository or download the source code
2. Install dependencies:
   ```
   npm install
   ```
3. Create a `.env` file in the root directory with your Discord bot token and log channel ID:
   ```
   DISCORD_TOKEN=your_bot_token_here
   LOG_CHANNEL_ID=your_log_channel_id_here
   ```
   
   Note: The LOG_CHANNEL_ID must be a text channel ID from the same server where the bot is being used.
4. Start the bot:
   ```
   node index.js
   ```

### Required Bot Permissions

Ensure your bot has the following permissions in your Discord server:

- **Timeout Members** (For muting/unmuting)
- **Ban Members** (For banning/unbanning)
- **Manage Messages** (For message moderation if needed)

## Command Guide

> **Note**: This bot uses keyword detection instead of traditional prefix commands.

### Mute a User

```
km @User [duration] [reason]
```

**Examples:**
- `km @John 7d promotion` - Mutes John for 7 days with reason "promotion"
- `km @John 7d` - Mutes John for 7 days with no reason
- `km @John` - Mutes John for the default 10 minutes

**Duration Format:**
- `s` - Seconds (e.g., `30s`)
- `m` - Minutes (e.g., `10m`)
- `h` - Hours (e.g., `2h`)
- `d` - Days (e.g., `7d`)
- `w` - Weeks (e.g., `2w`)

### Unmute a User

```
kum @User
```

**Example:** `kum @John` - Unmutes John immediately

### Ban a User

```
kb @User [reason]
```

**Examples:**
- `kb @John spamming` - Bans John with reason "spamming"
- `kb @John` - Bans John with no reason provided

### Unban a User

```
kub @User
```

**Example:** `kub @John` - Unbans John

### Bot Information

```
/info
```

Use this slash command to get detailed information about the bot, including:
- Current version
- Available commands
- Bot status
- Support information

**Example:** `/info` - Displays an embedded message with comprehensive bot information

## Important Notes

- **Admin/Mod Only**: Only moderators and administrators can use these commands
- **Timeout System**: The mute function uses Discord's timeout system
- **Confirmation Messages**: The bot sends a confirmation message after executing commands
- **No Command Prefix**: The bot detects specific keywords rather than using traditional prefix commands

## Troubleshooting

- Ensure the bot has the correct permissions in your server, especially the "View Audit Log" permission
- Verify that your bot token is correctly set in the `.env` file
- Make sure the LOG_CHANNEL_ID in your `.env` file is a valid channel ID from the server where you're using the bot
- If you see "Log channel does not belong to this guild" error, check that you're using the correct channel ID for the current server
- Check that the bot's role is positioned higher than the roles of users you want to moderate

## Detailed Documentation

For more detailed information about command usage and examples, please refer to the [instructions.md](instructions.md) file included in this repository.

## License

ISC License

## Author

### Samrat Bandre