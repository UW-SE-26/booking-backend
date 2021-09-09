import { CommandInteraction, MessageButton, MessageEmbed, MessageActionRow, MessageSelectMenu, Message, SelectMenuInteraction } from 'discord.js';
import TimeblockModel from '../../models/timeBlock.model';
import SectionModel from '../../models/section.model';
import RoomModel from '../../models/room.model';
import { DateTime } from 'luxon';
import { Types } from 'mongoose';

function dateSuffix(day: number) {
    if (day > 3 && day < 21) return 'th';
    switch (day % 10) {
        case 1:
            return 'st';
        case 2:
            return 'nd';
        case 3:
            return 'rd';
        default:
            return 'th';
    }
}

function timeConversion(timeObject: DateTime) {
    //Converts 24 hour time to 12 hour time with a.m. and p.m. and changes 0:00 to 12:00
    return timeObject.setZone('America/Toronto').toFormat('h:mm a');
}

async function getBookingInformation(timeBlockId: string) {
    const bookedBooking = await TimeblockModel.findOne({ _id: Types.ObjectId(timeBlockId) });

    if (!bookedBooking) {
        return undefined;
    }

    const bookedSection = await SectionModel.findOne({ _id: bookedBooking.sectionId });

    if (!bookedSection) {
        return undefined;
    }

    const bookedRoom = await RoomModel.findOne({ _id: bookedSection.roomId });

    if (!bookedRoom) {
        return undefined;
    }

    const _startDate = DateTime.fromJSDate(bookedBooking.startsAt).setZone('America/Toronto');

    return {
        roomName: bookedRoom.name,
        sectionName: bookedSection.name,
        startDate: _startDate,
        endDate: _startDate.plus({ hours: 1 }),
        bookingUsers: bookedBooking.users,
        booker: bookedBooking.booker,
        bookingId: bookedBooking._id,
    };
}

async function getUserBookings(userId: string) {
    const bookingOptions = [];
    const bookedBookings = await TimeblockModel.find({ users: { $in: [userId] } });

    for (const booking of bookedBookings) {
        const label = booking.booker === userId ? 'Booked' : 'Invited';
        const bookingInformation = await getBookingInformation(booking._id);

        if (!bookingInformation) {
            return undefined;
        }

        bookingOptions.push({
            label: `${label}: ${bookingInformation.roomName} - ${bookingInformation.sectionName}`,
            description: `${bookingInformation.startDate.weekdayLong} - ${bookingInformation.startDate.monthLong} ${bookingInformation.startDate.day}${dateSuffix(
                bookingInformation.startDate.day
            )}: ${timeConversion(bookingInformation.startDate)} - ${timeConversion(bookingInformation.endDate)}`,
            value: `${bookingInformation.bookingId}`,
        });
    }

    if (!bookingOptions.length) {
        return new MessageActionRow().addComponents(new MessageButton().setCustomId('unavailable').setLabel('No Registered Bookings Found!').setStyle('DANGER').setDisabled(true));
    }

    return new MessageActionRow().addComponents(new MessageSelectMenu().setCustomId('bookingSelectMenu').setPlaceholder('Select your Bookings').addOptions(bookingOptions));
}

export default {
    name: 'view',
    description: 'View all your current bookings',
    options: [],

    async execute(interaction: CommandInteraction): Promise<void> {
        const titleEmbed = new MessageEmbed().setColor('#48d7fb').setTitle('Your Current Bookings').setDescription('Select a certain booking to see more information.ㅤㅤㅤ ㅤ ㅤ ㅤㅤㅤ\n ');
        const bookingResponse = await getUserBookings(interaction.user.id);

        if (!bookingResponse) {
            interaction.reply('Error retrieving booked bookings. Please contact an admin.');
            return;
        }

        const message = (await interaction.reply({ embeds: [titleEmbed], components: [bookingResponse], fetchReply: true })) as Message;
        const selectMenuCollector = message.createMessageComponentCollector({ componentType: 'SELECT_MENU', time: 120000 });

        selectMenuCollector.on('collect', async (selectMenuInteraction: SelectMenuInteraction) => {
            if (selectMenuInteraction.user.id === interaction.user.id) {
                const bookingInformation = await getBookingInformation(selectMenuInteraction.values[0]);

                if (!bookingInformation) {
                    interaction.reply('Error retrieving booking information. Please contact an admin.');
                    return;
                }

                const authorUsername = message!.guild!.members.cache.get(bookingInformation.booker)?.user.username;

                const informationEmbed = new MessageEmbed()
                    .setColor('#48d7fb')
                    .setAuthor(`Booked by: @${authorUsername}`) //Author field does not accept Discord ID to Mention conversion
                    .setTitle(`${bookingInformation.roomName} - ${bookingInformation.sectionName}`)
                    .addField('Day of Week:', `${bookingInformation.startDate.weekdayLong}`, true)
                    .addField('Date:', `${bookingInformation.startDate.monthLong} ${bookingInformation.startDate.day}${dateSuffix(bookingInformation.startDate.day)}`, true)
                    .addField('Time:', `${timeConversion(bookingInformation.startDate)} - ${timeConversion(bookingInformation.endDate)}`)
                    .addField('Invited Collaborators:', `${bookingInformation.bookingUsers.map((user) => `<@!${user}>`).join('\n')}`)
                    .setFooter(`Booking ID: ${bookingInformation.bookingId}`);

                selectMenuInteraction.reply({ embeds: [informationEmbed], ephemeral: true });
            } else {
                selectMenuInteraction.reply({ content: "This select menu isn't for you!", ephemeral: true });
            }
        });
    },
};
