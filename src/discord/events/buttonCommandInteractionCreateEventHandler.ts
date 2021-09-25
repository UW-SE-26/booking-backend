import { Interaction, MessageEmbed } from 'discord.js';
import { Types } from 'mongoose';
import TimeBlockModel from '../../models/timeBlock.model';
import BookCommand from '../commands/book';
import ViewCommand from '../commands/view';
export default {
    name: 'interactionCreate',

    async execute(interaction: Interaction): Promise<void> {
        if (!interaction.isButton()) return;

        if (interaction.customId.startsWith('cancel_booking|')) {
            const bookingId = interaction.customId.replace('cancel_booking|', '');
            const bookedTimeblock = await TimeBlockModel.findOne({ _id: Types.ObjectId(bookingId) });

            if (!bookedTimeblock) {
                interaction.reply({ embeds: [new MessageEmbed().setColor('RED').setDescription('This booking could not be found. Perhaps it was already deleted?')], ephemeral: true });
                return;
            }

            if (bookedTimeblock.startsAt < new Date()) {
                interaction.reply({ embeds: [new MessageEmbed().setColor('RED').setDescription("You can't delete bookings in the past.")], ephemeral: true });
                return;
            }

            if (bookedTimeblock.booker !== interaction.user.id) {
                interaction.reply({ embeds: [new MessageEmbed().setColor('RED').setDescription('You do not have permission to delete this booking.')], ephemeral: true });
                return;
            }

            await TimeBlockModel.deleteOne({ _id: Types.ObjectId(bookingId) });

            interaction.update({ embeds: [new MessageEmbed().setColor('BLUE').setDescription('This booking was cancelled.')], components: [] });
            console.log(`${interaction.user.tag} cancelled a booking with id ${bookingId}`);
        }

        if (interaction.customId === 'create_booking') {
            await BookCommand.execute(interaction);
        }

        if (interaction.customId === 'view_bookings') {
            await ViewCommand.execute(interaction);
        }
    },
};
