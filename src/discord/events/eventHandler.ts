import { Client } from 'discord.js';

export interface EventHandler {
    readonly eventName: string;
    readonly client: Client;

    execute(...args: any[]): Promise<void>;
}