import { CommandInteraction } from 'discord.js';
import TimeblockModel from '../../models/timeBlock.model';
import { Types } from 'mongoose';

function updateUserList(currentUserIdList: string[], deletedUserId: string) {
    currentUserIdList.splice(currentUserIdList.indexOf(deletedUserId), 1);

    return currentUserIdList;
}

export default {
    name: 'delete',
    description: 'Delete a Booked Booking',
    options: [
        {
            type: 3,
            name: 'booking-id',
            description: 'ID of your booking',
            required: true,
        },
    ],
    enabled: true,

    async execute(interaction: CommandInteraction): Promise<void> {
        const bookingId = interaction.options.getString('booking-id', true);
        //Regex filters out invalid booking ID formats
        const hexRegex = /[0-9A-Fa-f]{6}/g;

        if (!hexRegex.test(bookingId)) {
            interaction.reply({ content: 'Invalid Booking ID Format: Do `/view` to see all your current bookings!', ephemeral: true });
            return;
        }

        const bookedTimeblock = await TimeblockModel.findOne({ _id: Types.ObjectId(bookingId) });

        if (!bookedTimeblock) {
            interaction.reply({ content: 'Invalid Booking ID: Do `/view` to see all your current bookings!', ephemeral: true });
            return;
        }

        if (bookedTimeblock.users.includes(interaction.user.id) && interaction.user.id !== bookedTimeblock.booker) {
            const updatedUserList = updateUserList(bookedTimeblock.users, interaction.user.id);
            await TimeblockModel.updateOne({ _id: Types.ObjectId(bookingId) }, { users: updatedUserList });
            interaction.reply({ content: "You are not the booker of this booking! However, you have been removed from this booking's users list", ephemeral: true });
        } else if (interaction.user.id !== bookedTimeblock.booker) {
            interaction.reply({ content: "You can't delete someone else's booking!", ephemeral: true });
        } else {
            await TimeblockModel.deleteOne({ _id: Types.ObjectId(bookingId) });
            interaction.reply({ content: 'Booking successfully deleted!', ephemeral: true });
        }
    },
};
