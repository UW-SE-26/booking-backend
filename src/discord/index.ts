import { Client, Intents } from 'discord.js';

const intents = new Intents();
intents.add('GUILDS', 'GUILD_MEMBERS', 'GUILD_MESSAGES', 'GUILD_MESSAGE_REACTIONS', 'DIRECT_MESSAGES', 'DIRECT_MESSAGE_REACTIONS');

const client = new Client({ intents: intents });

export function init(): void {
    client.login(process.env.DISCORD_TOKEN);
}

client.on('ready', () => {
    console.log(`Logged in as ${client.user!.tag}`);
});
