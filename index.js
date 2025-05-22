// Entry point for the Discord bot
// This file loads the bot implementation from bot.js
require('./bot.js');
// Express server for uptime monitoring
const express = require('express');
const app = express();
const port = 3000;
app.get('/', (req, res) => res.json({ message: 'Kozeki is online!' }));
console.log('Starting Kozeki Discord moderation bot...');
app.listen(port, () => console.log(`Kozeki listening on port ${port}!`));