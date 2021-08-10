import { Client, Intents } from 'discord.js';
import commands from './commands/index';

const intents = new Intents();
intents.add('GUILDS', 'GUILD_MEMBERS', 'GUILD_MESSAGES', 'GUILD_MESSAGE_REACTIONS', 'DIRECT_MESSAGES', 'DIRECT_MESSAGE_REACTIONS');

const client = new Client({ intents: intents });

export function init(): void {
    client.login(process.env.DISCORD_TOKEN);
}

client.on('ready', () => {
    console.log(`Logged in as ${client.user!.tag}`);
});

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isCommand()) return;

    const command = commands.find((c) => c.name === interaction.commandName);

    if (command) {
        command.execute(interaction);
    }
});
