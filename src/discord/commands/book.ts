import { CommandInteraction, MessageEmbed, MessageActionRow, MessageSelectMenu, MessageButton, SelectMenuInteraction, Message } from 'discord.js';
import roomModel, { Room } from '../../models/room.model';
import sectionModel, { Section } from '../../models/section.model';
import { DateTime } from 'luxon';
import { Types } from 'mongoose';
import timeBlockModel from '../../models/timeBlock.model';
import manageCommand from './manage';

interface TimeblockInformation {
    booked: boolean;
    startsAt: number;
    endsAt: number;
    date: Date;
}

interface SectionInformation extends Section {
    _id?: Types.ObjectId;
}

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

function getDateOptions(selectedDate?: string) {
    const dateOptions = [];
    let currentDate = DateTime.now().setZone('America/Toronto');

    for (let i = 0; i < 14; i++) {
        dateOptions.push({
            label: `${currentDate.weekdayLong} - ${currentDate.monthLong} ${currentDate.day}${dateSuffix(currentDate.day)}`,
            value: currentDate.toISODate(),
            default: currentDate.toISODate() === selectedDate,
        });
        currentDate = currentDate.plus({ days: 1 });
    }
    return dateOptions;
}

async function parseCommandOptions(interaction: CommandInteraction): Promise<string[] | undefined> {
    //Parses the book command option parameters to return the corresponding Room's section ID
    const roomName = interaction.options.getString('room-name');
    const roomJson = await roomModel.findOne({ name: roomName !== null ? roomName : undefined });

    if (!roomJson) {
        interaction.reply({ content: 'Invalid Room: Do `/rooms` to see all avaliable rooms!', ephemeral: true });
        return undefined;
    }

    const sectionJson = await sectionModel.find({ roomId: roomJson._id });
    const specificSection = sectionJson.find((s) => s.name === interaction.options.getString('section-name'));

    if (!specificSection) {
        interaction.reply({ content: 'Invalid Section: Do `/rooms` to see all avaliable rooms and sections!', ephemeral: true });
        return undefined;
    }

    return [roomJson._id, specificSection._id];
}

async function searchTimeblocks(selectedDate: string, sectionInformation: SectionInformation, roomInformation: Room): Promise<TimeblockInformation[]> {
    //Function finds all available timeblocks for a given date

    const startDate = DateTime.fromISO(String(selectedDate));

    // Validates start and end dates
    // Retrieves room that the section corresponds to
    if (!roomInformation) {
        return [];
    }
    if (roomInformation.closed) {
        return [];
    }

    const bookedTimeBlocks = await timeBlockModel.find({
        sectionId: sectionInformation._id,
        startsAt: { $gte: startDate.toJSDate(), $lte: startDate.plus({ days: 1 }).toJSDate() },
    });

    const timeBlocks: TimeblockInformation[] = [];

    let start = 0,
        end = 23; //make compiler shut up about being uninitialized

    for (const day of roomInformation.schedule) {
        if (day.dayOfWeek === startDate.weekday) {
            start = day.start;
            end = day.end;
            break;
        }
    }

    while (start < end) {
        const bookedTimeBlock = bookedTimeBlocks.find((timeBlock) => timeBlock.startsAt.getHours() === start);
        const timeBlock = {
            booked: bookedTimeBlock != null,
            date: startDate.toJSDate(),
            startsAt: start,
            endsAt: start + 1,
        };
        timeBlocks.push(timeBlock);
        start++;
    }

    return timeBlocks;
}

function timeConversion(time: number, date: Date) {
    //Converts 24 hour time to 12 hour time with a.m. and p.m. and changes 0:00 to 12:00
    return date.toISOString() + (time > 12 ? `${time - 12}:00 PM` : `${time}:00 AM`);
}

function parseTimeblocks(timeBlocks: TimeblockInformation[]) {
    //Sets up select menu options for timeblocks
    const timeBlockOptions = [];
    for (const timeBlock of timeBlocks) {
        timeBlockOptions.push({
            label: `${timeConversion(timeBlock.startsAt, timeBlock.date)} - ${timeConversion(timeBlock.endsAt, timeBlock.date)}`,
            value: `${timeConversion(timeBlock.startsAt, timeBlock.date)} - ${timeConversion(timeBlock.endsAt, timeBlock.date)}`,
        });
    }

    if (timeBlockOptions.length === 0) {
        return new MessageButton().setCustomId('unavailable').setLabel('No currently avaliable timeblocks on selected date').setStyle('DANGER').setDisabled(true);
    }
    return new MessageSelectMenu().setCustomId('timeBlockSelectMenu').setPlaceholder('Select a Time to Book!').addOptions(timeBlockOptions);
}

export default {
    name: 'book',
    description: 'Select a Date and Time for your Room Booking',
    options: [
        {
            type: 3,
            name: 'room-name',
            description: 'Name of Room to Book',
            required: true,
        },
        {
            type: 3,
            name: 'section-name',
            description: 'Name of Section to Book',
            required: true,
        },
    ],

    async execute(interaction: CommandInteraction | SelectMenuInteraction, _roomId?: string, _sectionId?: string): Promise<void> {
        if (interaction.isCommand()) {
            await parseCommandOptions(interaction).then((response) => {
                if (response === undefined) return;
                _roomId = response[0];
                _sectionId = response[1];
            });
        }

        if (_roomId === undefined || _sectionId === undefined) return;

        const roomInformation = await roomModel.findOne({ _id: Types.ObjectId(_roomId) });
        const sectionInformation = await sectionModel.findOne({ _id: Types.ObjectId(_sectionId) });

        const embed = new MessageEmbed()
            .setColor('#48d7fb')
            .setTitle('Date and Time')
            .setDescription('Choose the date and time of your booking.ㅤㅤㅤ ㅤ ㅤ ㅤㅤㅤ\n ')
            .setFooter(`Currently Booking: ${roomInformation!.name} - ${sectionInformation!.name}`);

        let selectMenuDate = new MessageActionRow().addComponents(new MessageSelectMenu().setCustomId('dateSelectMenu').setPlaceholder('Select Date of Room Booking').addOptions(getDateOptions()));
        let menuSelectedDate: string;

        const message = (await interaction.reply({ embeds: [embed], components: [selectMenuDate], fetchReply: true })) as Message;

        const selectMenuCollector = message.createMessageComponentCollector({ componentType: 'SELECT_MENU', time: 120000 });

        selectMenuCollector.on('collect', async (menuInteraction: SelectMenuInteraction) => {
            //Temporary check as message isn't ephemeral
            if (menuInteraction.user.id === interaction.user.id) {
                switch (menuInteraction.customId) {
                    case 'dateSelectMenu': {
                        menuSelectedDate = menuInteraction.values[0];
                        selectMenuDate = new MessageActionRow().addComponents(
                            new MessageSelectMenu().setCustomId('dateSelectMenu').setPlaceholder('Select Date of Room Booking').addOptions(getDateOptions(menuSelectedDate))
                        );
                        const availableTimeblocks = new MessageActionRow().addComponents(parseTimeblocks(await searchTimeblocks(menuSelectedDate, sectionInformation!, roomInformation!)));

                        menuInteraction.update({ components: [selectMenuDate, availableTimeblocks] });
                        break;
                    }
                    case 'timeBlockSelectMenu': {
                        //ESLint disabled for next line as regex is correct at removing unicode characters. Removes hidden unicode U+200E character that invalidates parseInt()/toJSDate()
                        const selectedTimeblock = menuInteraction.values[0].split(',').map((element: string) => element.replace(/[^\x00-\x7F]/g, '')); //eslint-disable-line

                        const selectedDate = DateTime.fromFormat(menuSelectedDate, 'yyyy-MM-dd', { zone: 'America/Toronto' });
                        const _startsAt = selectedDate.set({ hour: parseInt(selectedTimeblock[0]) }).toJSDate();
                        const maxCapacity = parseInt(selectedTimeblock[2]);

                        const foundTimeblock = await timeBlockModel.findOne({ sectionId: Types.ObjectId(_sectionId), startsAt: _startsAt });
                        let bookingId;

                        const hour = selectedDate.hour;
                        const schedule = roomInformation!.schedule[selectedDate.weekday];
                        const validBooking = hour < schedule.start || hour > schedule.end;

                        if (!foundTimeblock && validBooking) {
                            const timeBlock = await timeBlockModel.create({
                                users: [interaction.user.id],
                                booker: interaction.user.id,
                                sectionId: Types.ObjectId(_sectionId),
                                startsAt: _startsAt,
                            });
                            bookingId = timeBlock._id;
                        } else {
                            await menuInteraction.reply({ content: 'This time block is already booked!', ephemeral: true });
                            break;
                        }
                        manageCommand.handleSelectMenu(menuInteraction, [interaction.user.id], maxCapacity, bookingId);

                        await interaction.deleteReply();
                        break;
                    }
                    default:
                        console.log('Selected Menu Not Found!');
                }
            } else {
                menuInteraction.reply({ content: "This select menu isn't for you!", ephemeral: true });
            }
        });
    },
};
