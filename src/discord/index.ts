import { Client, Intents } from 'discord.js';
import events from './events/index';

const intents = new Intents();
intents.add('GUILDS', 'GUILD_MEMBERS', 'GUILD_MESSAGES', 'GUILD_MESSAGE_REACTIONS', 'DIRECT_MESSAGES', 'DIRECT_MESSAGE_REACTIONS');

const client = new Client({ intents: intents, partials: ['CHANNEL'] });

export function init(): void {
    client.login(process.env.DISCORD_TOKEN);
    loadEvents();
}

function loadEvents(): void {
    for (const event of events) {
        // @ts-expect-error: Spread operator doesn't seem to want to work with typescript?
        client.on(event.name, (...arg) => event.execute(...arg));
    }
}
