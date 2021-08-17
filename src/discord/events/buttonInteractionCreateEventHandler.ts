import { Interaction } from 'discord.js';

//Temporary event handler that calls the booking embed once it is created.
export default {
    name: 'interactionCreate',

    async execute(interaction: Interaction): Promise<void> {
        if (!interaction.isButton()) return;

        interaction.reply(`${interaction.customId} supposedly selected!`);
    },
};
