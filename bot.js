require('dotenv').config();
const { Client, GatewayIntentBits, Partials, PermissionFlagsBits, REST, Routes, SlashCommandBuilder } = require('discord.js');
const path = require('path');
const { version } = require('./package.json');

// Create a new client instance
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildModeration
    ],
    partials: [Partials.Message, Partials.Channel, Partials.GuildMember]
});

// Parse duration string to milliseconds
function parseDuration(durationStr) {
    if (!durationStr) return 10 * 60 * 1000; // Default: 10 minutes

    const unit = durationStr.slice(-1);
    const value = parseInt(durationStr.slice(0, -1));

    switch (unit) {
        case 's': return value * 1000; // seconds
        case 'm': return value * 60 * 1000; // minutes
        case 'h': return value * 60 * 60 * 1000; // hours
        case 'd': return value * 24 * 60 * 60 * 1000; // days
        case 'w': return value * 7 * 24 * 60 * 60 * 1000; // weeks
        default: return 10 * 60 * 1000; // Default: 10 minutes
    }
}

// Check if user has moderator permissions
function hasModPermissions(member) {
    return member.permissions.has(PermissionFlagsBits.ModerateMembers) ||
        member.permissions.has(PermissionFlagsBits.Administrator);
}

// Create slash commands
const commands = [
    new SlashCommandBuilder()
        .setName('info')
        .setDescription('Get information about the bot')
];

// When the client is ready, run this code (only once)
client.once('ready', async () => {
    console.log(`Logged in as ${client.user.tag}`);

    try {
        const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
        await rest.put(
            Routes.applicationCommands(client.user.id),
            { body: commands }
        );
        console.log('Successfully registered application commands.');
    } catch (error) {
        console.error('Error registering application commands:', error);
    }
});

// Handle slash command interactions
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === 'info') {
        const uptime = Math.floor(process.uptime());
        const days = Math.floor(uptime / 86400);
        const hours = Math.floor((uptime % 86400) / 3600);
        const minutes = Math.floor((uptime % 3600) / 60);
        const seconds = uptime % 60;

        const uptimeString = `${days}d ${hours}h ${minutes}m ${seconds}s`;

        const embed = {
            color: 0x0099ff,
            title: 'Kozeki Bot Information',
            description: 'A Discord moderation bot with timeout and ban management capabilities.',
            fields: [
                { name: 'Version', value: version, inline: true },
                { name: 'Uptime', value: uptimeString, inline: true },
                { name: 'Commands', value: '```\nkm @user [duration] [reason] - Mute user\nkum @user - Unmute user\nkb @user [reason] - Ban user\nkub @user - Unban user\n/info - Show this info\n```' }
            ],
            timestamp: new Date().toISOString(),
            footer: {
                text: 'Made with ❤️ by Samrat'
            }
        };

        await interaction.reply({ embeds: [embed] });
    }
});

// Listen for messages
client.on('messageCreate', async message => {
    // Ignore messages from bots
    if (message.author.bot) return;

    // Check if user has moderator permissions
    if (!hasModPermissions(message.member)) return;

    const content = message.content.trim();
    const args = content.split(' ');
    const command = args[0].toLowerCase();

    // Handle mute command: km @User [duration] [reason]
    if (command === 'km') {
        const mentionedUser = message.mentions.members.first();
        if (!mentionedUser) return;

        // Check if bot has permission to timeout members
        if (!message.guild.members.me.permissions.has(PermissionFlagsBits.ModerateMembers)) {
            return message.channel.send('I don\'t have permission to timeout members.');
        }

        // Check if the bot's role is higher than the target user's role (role hierarchy)
        if (mentionedUser.roles.highest.position >= message.guild.members.me.roles.highest.position) {
            return message.channel.send('I cannot moderate this user because they have a role equal to or higher than mine.');
        }

        // Parse arguments
        let duration, reason;

        // If there are arguments after the mention
        if (args.length > 2) {
            // Check if the next argument is a duration
            const durationRegex = /^\d+[smhdw]$/;
            if (durationRegex.test(args[2])) {
                duration = args[2];
                reason = args.slice(3).join(' ') || 'reason not provided';
            } else {
                duration = '10m'; // Default duration
                reason = args.slice(2).join(' ');
            }
        } else {
            duration = '10m'; // Default duration
            reason = 'reason not provided';
        }

        // Convert duration string to milliseconds
        const durationMs = parseDuration(duration);

        try {
            await mentionedUser.timeout(durationMs, reason);
            message.channel.send(`<a:bonk:1348931006152839228> Done! Muted ${mentionedUser} for ${duration}. Reason: ${reason}`);
        } catch (error) {
            console.error('Error muting user:', error);
            message.channel.send('Failed to mute user. Make sure I have the correct permissions.');
        }
    }

    // Handle unmute command: kum @User
    else if (command === 'kum') {
        const mentionedUser = message.mentions.members.first();
        if (!mentionedUser) return;

        // Check if bot has permission to timeout members
        if (!message.guild.members.me.permissions.has(PermissionFlagsBits.ModerateMembers)) {
            return message.channel.send('I don\'t have permission to remove timeouts.');
        }

        try {
            await mentionedUser.timeout(null); // Remove timeout
            message.channel.send(`<:yessir:1348944055605661767> Done! Unmuted ${mentionedUser}`);
        } catch (error) {
            console.error('Error unmuting user:', error);
            message.channel.send('Failed to unmute user. Make sure I have the correct permissions.');
        }
    }

    // Handle ban command: kb @User [reason]
    else if (command === 'kb') {
        const mentionedUser = message.mentions.members.first();
        if (!mentionedUser) return;

        // Check if bot has permission to ban members
        if (!message.guild.members.me.permissions.has(PermissionFlagsBits.BanMembers)) {
            return message.channel.send('I don\'t have permission to ban members.');
        }

        // Parse reason
        const reason = args.slice(2).join(' ') || 'reason not provided';

        try {
            await mentionedUser.ban({ reason });
            message.channel.send(`<:ban:1348945066542104697> Done! Banned ${mentionedUser}. Reason: ${reason}`);
        } catch (error) {
            console.error('Error banning user:', error);
            message.channel.send('Failed to ban user. Make sure I have the correct permissions.');
        }
    }

    // Handle unban command: kub @User
    else if (command === 'kub') {
        // Since we can't directly mention banned users, we'll extract the user ID
        // Format expected: kub @User or kub UserID
        let userId;

        if (message.mentions.users.size > 0) {
            userId = message.mentions.users.first().id;
        } else if (args.length > 1) {
            // Try to extract user ID from the second argument
            // It could be a raw ID or a mention format like <@123456789>
            const idMatch = args[1].match(/\d+/);
            userId = idMatch ? idMatch[0] : null;
        }

        if (!userId) return;

        // Check if bot has permission to ban members (which includes unbanning)
        if (!message.guild.members.me.permissions.has(PermissionFlagsBits.BanMembers)) {
            return message.channel.send('I don\'t have permission to unban members.');
        }

        try {
            await message.guild.members.unban(userId);
            message.channel.send(`<:yessir:1348944055605661767> Done! Unbanned <@${userId}>`);
        } catch (error) {
            console.error('Error unbanning user:', error);
            message.channel.send('Failed to unban user. The user may not be banned or I don\'t have the correct permissions.');
        }
    }
});

// Login to Discord with your client's token
client.login(process.env.DISCORD_TOKEN);