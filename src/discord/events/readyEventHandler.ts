import { EventHandler } from './eventHandler';
import { Client } from 'discord.js';

export class ReadyEventHandler implements EventHandler {
    readonly eventName = 'ready';
    readonly client: Client;

    constructor(client: Client) {
        this.client = client;
    }

    async execute(): Promise<void> {
        console.log(`Client is now ready!`);
        console.log(`Logged in as ${this.client.user!.tag}`);
    }
}