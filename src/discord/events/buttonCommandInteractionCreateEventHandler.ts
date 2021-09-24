import { Interaction, MessageEmbed } from 'discord.js';
import { Types } from 'mongoose';
import TimeBlockModel from '../../models/timeBlock.model';
export default {
    name: 'interactionCreate',

    async execute(interaction: Interaction): Promise<void> {
        if (!interaction.isButton()) return;

        if (interaction.customId.startsWith('cancel_booking|')) {
            const bookingId = interaction.customId.replace('cancel_booking|', '');
            const bookedTimeblock = await TimeBlockModel.findOne({ _id: Types.ObjectId(bookingId) });

            if (!bookedTimeblock) {
                interaction.reply({ embeds: [new MessageEmbed().setColor('RED').setDescription('This booking could not be found. Perhaps it was already deleted?')] });
                return;
            }

            if (bookedTimeblock.startsAt < new Date()) {
                interaction.reply({ embeds: [new MessageEmbed().setColor('RED').setDescription("You can't delete bookings in the past.")] });
                return;
            }

            if (bookedTimeblock.booker !== interaction.user.id) {
                interaction.reply({ embeds: [new MessageEmbed().setColor('RED').setDescription('You do not have permission to delete this booking.')] });
                return;
            }

            await TimeBlockModel.deleteOne({ _id: Types.ObjectId(bookingId) });

            interaction.update({ embeds: [new MessageEmbed().setColor('BLUE').setDescription('This booking was cancelled.')], components: [] });
        }
    },
};
