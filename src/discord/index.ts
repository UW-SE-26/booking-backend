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

//Temporary method to run slash commands until event handlers are set up
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isCommand()) return;

    const command = commands.find((c) => c.name === interaction.commandName);

    if (command) {
        command.execute(interaction);
    }
});

//Temporary method to initially set up the deploy slash command / run other message commands until event handlers are set up
client.on('messageCreate', async (message) => {
    if (!message.content.startsWith('$') || message.author.bot) return;

    const messageContent = message.content.slice(1).replace(/\s+/g, ' ').trim().split(/ (.+)/);
    const commandName = messageContent.shift()?.toLowerCase();

    if (commandName === 'deploy') {
        const data = {
            name: 'deploy',
            description: 'Deploys slash commands in current guild - meant for testing.',
            options: [],
        };

        await message.guild!.commands.create(data);
        message.reply('Deploy command created! Do `/deploy` to deploy the remainder of the commands.');
    }
});
