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
        GatewayIntentBits.GuildModeration,
        GatewayIntentBits.GuildBans,
        GatewayIntentBits.GuildPresences
    ],
    partials: [Partials.Message, Partials.Channel, Partials.GuildMember]
});

// Channel ID for logging moderation actions
const LOG_CHANNEL_ID = process.env.LOG_CHANNEL_ID

// Function to send logs to the log channel
async function sendModLog(guild, action, moderator, target, reason, duration = null) {
    try {
        // First check if the log channel exists in this guild
        const guildChannels = Array.from(guild.channels.cache.values());
        const logChannelInGuild = guildChannels.some(channel => channel.id === LOG_CHANNEL_ID);

        if (!logChannelInGuild) {
            return console.error(`Log channel (ID: ${LOG_CHANNEL_ID}) does not belong to this guild (${guild.name})`);
        }

        const logChannel = await guild.channels.fetch(LOG_CHANNEL_ID);
        if (!logChannel) return console.error('Log channel not found');

        let color;
        let emoji;

        switch (action) {
            case 'mute':
                color = 0xFFA500; // Orange
                emoji = '<a:bonk:1348931006152839228>';
                break;
            case 'unmute':
                color = 0x00FF00; // Green
                emoji = '<:yessir:1348944055605661767>';
                break;
            case 'ban':
                color = 0xFF0000; // Red
                emoji = '<:ban:1348945066542104697>';
                break;
            case 'unban':
                color = 0x00FF00; // Green
                emoji = '<:yessir:1348944055605661767>';
                break;
            case 'info':
                color = 0x3498DB; // Blue
                emoji = '📊';
                break;
            default:
                color = 0xe983d8; // Default pink
                emoji = '📝';
        }

        const embed = {
            color: color,
            title: `${emoji} Moderation Action: ${action.charAt(0).toUpperCase() + action.slice(1)}`,
            fields: [
                { name: 'Moderator', value: `${moderator.tag}`, inline: true },
                { name: 'User', value: target.toString(), inline: true },
                { name: 'Reason', value: reason || 'No reason provided' }
            ],
            timestamp: new Date().toISOString(),
            footer: {
                text: `User ID: ${typeof target === 'string' ? target : target.id}`
            }
        };

        // Add duration field for mutes
        if (duration) {
            embed.fields.push({ name: 'Duration', value: duration, inline: true });
        }

        await logChannel.send({ embeds: [embed] });
    } catch (error) {
        console.error('Error sending mod log:', error);
    }
}

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
            color: 0xe983d8,
            title: 'Kozeki Bot Information',
            description: 'A Discord moderation bot that I hope will reduce a lot of manual labor.',
            fields: [
                { name: 'Version', value: version, inline: true },
                { name: 'Uptime', value: uptimeString, inline: true },
                { name: 'Commands', value: '```\nkm @user [duration] [reason] - Mute user\nki @user - Show user info and history\nkum @user - Unmute user\nkb @user [reason] - Ban user\nkub @user - Unban user\n/info - Show this info\n```' }
            ],
            timestamp: new Date().toISOString(),
            footer: {
                text: 'Made with 🤍 by Samrat'
            }
        };

        try {
            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Error replying to interaction:', error);
            // If the interaction has already been acknowledged, try to follow up instead
            if (error.code === 40060) {
                try {
                    await interaction.followUp({ embeds: [embed] });
                } catch (followUpError) {
                    console.error('Error sending follow-up:', followUpError);
                }
            }
        }
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

    // Check for introduce command
    if (message.mentions.has(client.user) &&
        content.toLowerCase().includes('introduce yourself') &&
        message.mentions.members.size === 1) {
        const embed = {
            color: 0xe983d8, // Pink color
            // color: 0xFF69B4, // Pink color
            title: '✨ Hewwo! I\'m Kozeki! ✨',
            description: 'Konnichiwa! (｡♥‿♥｡) I\'m your friendly neighborhood moderation assistant built by Samrat! 🌸\n\nI\'m here to help keep this server safe and comfy for everyone! I can timeout naughty users, give timeouts when needed, and even handle bans if someone\'s being really mean! >_<\n\nJust use these commands and I\'ll take care of it~\n\n• `km @user [time] [reason]` - Time someone out (⋟﹏⋞)\n• `ki @user` - Show user info and history (✧ω✧)\n• `kum @user` - Remove timeout (ﾉ◕ヮ◕)ﾉ*:･ﾟ✧\n• `kb @user [reason]` - Ban someone (｡•́︿•̀｡)\n• `kub userId` - Unban someone ╰(*°▽°*)╯\n\nLeave it to me to keep things peaceful! (◕‿◕✿)',
            footer: {
                text: '💕 Made with love by Samrat'
            }
        };

        await message.channel.send({ embeds: [embed] });
        return;
    }

    // Handle user info command: ki @User
    if (command === 'ki') {
        const mentionedUser = message.mentions.members.first();
        if (!mentionedUser) return;

        // Check if bot has permission to view audit logs
        if (!message.guild.members.me.permissions.has(PermissionFlagsBits.ViewAuditLog)) {
            return message.channel.send('I don\'t have permission to view audit logs. Please make sure I have the "View Audit Log" permission in the server settings.');
        }

        try {
            // Send a loading message
            const loadingMsg = await message.channel.send('📊 Fetching user information...');

            // Get user join date
            const joinDate = mentionedUser.joinedAt;
            const creationDate = mentionedUser.user.createdAt;
            const daysSinceCreation = Math.floor((Date.now() - creationDate) / (1000 * 60 * 60 * 24));
            const daysSinceJoin = Math.floor((Date.now() - joinDate) / (1000 * 60 * 60 * 24));

            // Check if account is suspicious (created recently)
            const isNewAccount = daysSinceCreation < 30;

            // Get ban history from audit logs
            const banLogs = await message.guild.fetchAuditLogs({
                type: 22, // BAN_ADD
                limit: 100
            });

            // Filter logs for this user
            const userBanLogs = banLogs.entries.filter(entry => entry.target.id === mentionedUser.id);

            // Get unban history
            const unbanLogs = await message.guild.fetchAuditLogs({
                type: 23, // BAN_REMOVE
                limit: 100
            });

            // Filter logs for this user
            const userUnbanLogs = unbanLogs.entries.filter(entry => entry.target.id === mentionedUser.id);

            // Get timeout history
            const timeoutLogs = await message.guild.fetchAuditLogs({
                type: 24, // MEMBER_UPDATE (includes timeouts)
                limit: 100
            });

            // Filter logs for this user's timeouts
            const userTimeoutLogs = timeoutLogs.entries.filter(entry =>
                entry.target.id === mentionedUser.id &&
                entry.changes.some(change => change.key === 'communication_disabled_until')
            );

            // Create embed for user info
            const embed = {
                color: 0xe983d8,
                title: `📊 User Information: ${mentionedUser.user.tag}`,
                thumbnail: {
                    url: mentionedUser.user.displayAvatarURL({ dynamic: true })
                },
                fields: [
                    { name: '👤 User', value: `${mentionedUser.toString()} (${mentionedUser.user.tag})`, inline: false },
                    { name: '🆔 User ID', value: mentionedUser.id, inline: true },
                    { name: '📆 Account Created', value: `<t:${Math.floor(creationDate.getTime() / 1000)}:R> (${daysSinceCreation} days ago)`, inline: true },
                    { name: '📥 Joined Server', value: `<t:${Math.floor(joinDate.getTime() / 1000)}:R> (${daysSinceJoin} days ago)`, inline: true },
                    { name: '🚩 Suspicious Account', value: isNewAccount ? '⚠️ Yes - Account less than 30 days old' : '✅ No', inline: false },
                    {
                        name: '🔨 Ban History', value: userBanLogs.size > 0 ?
                            userBanLogs.map(entry => `<t:${Math.floor(entry.createdAt.getTime() / 1000)}:R> by ${entry.executor.tag} for: ${entry.reason || 'No reason provided'}`).join('\n') :
                            'No ban history found', inline: false
                    },
                    {
                        name: '🔓 Unban History', value: userUnbanLogs.size > 0 ?
                            userUnbanLogs.map(entry => `<t:${Math.floor(entry.createdAt.getTime() / 1000)}:R> by ${entry.executor.tag}`).join('\n') :
                            'No unban history found', inline: false
                    },
                    {
                        name: '⏱️ Timeout History', value: userTimeoutLogs.size > 0 ?
                            userTimeoutLogs.map(entry => {
                                const timeoutEndValue = entry.changes.find(change => change.key === 'communication_disabled_until')?.new;
                                return timeoutEndValue ?
                                    `<t:${Math.floor(entry.createdAt.getTime() / 1000)}:R> by ${entry.executor.tag} until ${timeoutEndValue}` :
                                    `<t:${Math.floor(entry.createdAt.getTime() / 1000)}:R> by ${entry.executor.tag}`;
                            }).join('\n') :
                            'No timeout history found', inline: false
                    },
                    {
                        name: '🎭 Roles', value: mentionedUser.roles.cache.size > 1 ?
                            mentionedUser.roles.cache.filter(role => role.id !== message.guild.id).map(role => role.toString()).join(', ') :
                            'No roles', inline: false
                    }
                ],
                timestamp: new Date().toISOString(),
                footer: {
                    text: `Requested by ${message.author.tag}`
                }
            };

            // Edit the loading message with the embed
            await loadingMsg.edit({ content: null, embeds: [embed] });

            // Log the info action
            await sendModLog(message.guild, 'info', message.author, mentionedUser, 'User information requested');
        } catch (error) {
            console.error('Error fetching user info:', error);
            message.channel.send('Failed to fetch user information. Make sure I have the correct permissions.');
        }
    }

    // Handle mute command: km @User [duration] [reason]
    else if (command === 'km') {
        const mentionedUser = message.mentions.members.first();
        if (!mentionedUser) return;

        // Regular mute command continues below
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

            // Log the mute action
            await sendModLog(message.guild, 'mute', message.author, mentionedUser, reason, duration);
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

            // Log the unmute action
            await sendModLog(message.guild, 'unmute', message.author, mentionedUser, 'Timeout removed');
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

            // Log the ban action
            await sendModLog(message.guild, 'ban', message.author, mentionedUser, reason);
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

            // Log the unban action
            await sendModLog(message.guild, 'unban', message.author, userId, 'User unbanned');
        } catch (error) {
            console.error('Error unbanning user:', error);
            message.channel.send('Failed to unban user. The user may not be banned or I don\'t have the correct permissions.');
        }
    }
});

// Login to Discord with your client's token
client.login(process.env.DISCORD_TOKEN);