import { ButtonInteraction, CommandInteraction, Message, MessageActionRow, MessageButton, MessageEmbed, SelectMenuInteraction } from 'discord.js';
import { Types } from 'mongoose';
import TimeblockModel from '../../models/timeBlock.model';
import SectionModel from '../../models/section.model';

function updateEmbed(userArray: string[], maxCapacity: number, manageState: string) {
    const embedTitle = manageState === 'add' ? 'Adding' : 'Removing';
    const preposition = manageState === 'add' ? 'to' : 'from';

    return new MessageEmbed()
        .setColor('#48d7fb')
        .setTitle(`Currently ${embedTitle} Collaborators`)
        .setDescription(
            `To ${manageState} collaborators ${preposition} your booking, @ their Discord username!\n\nCurrently Invited Collaborators (${
                maxCapacity - userArray.length
            } available spaces left):\n${userArray.map((user) => `<@!${user}>`).join('\n')}`
        );
}

function updateButtons(manageState: string) {
    const buttonRow = [new MessageButton().setCustomId('completeBooking').setLabel('Complete Booking').setStyle('PRIMARY')];
    const label = manageState === 'add' ? 'Remove' : 'Add';
    const style = manageState === 'add' ? 'DANGER' : 'SUCCESS';

    buttonRow.push(new MessageButton().setCustomId(`${label.toLowerCase()}Collaborators`).setLabel(`${label} Collaborators`).setStyle(style));

    return new MessageActionRow().addComponents(buttonRow);
}

async function mongoDBFilter(userArray: string[], timeblockId: string) {
    //Ensures no duplicate members are listed under users of a certain booking
    const filterArray = [];
    const currentUserArray = (await TimeblockModel.findOne({ _id: Types.ObjectId(timeblockId) }))!.users;

    for (const user of userArray) {
        if (!currentUserArray.includes(user)) {
            filterArray.push(user);
        }
    }
    return filterArray;
}

async function handleCommandInteraction(interaction: CommandInteraction) {
    const timeblockId = interaction.options.getString('booking-id', true);
    //Regex filters out invalid booking ID formats
    const hexRegex = /[0-9A-Fa-f]{6}/g;

    if (!hexRegex.test(timeblockId)) {
        interaction.reply({ content: 'Invalid Booking ID Format: Do `/view` to see all your current bookings!', ephemeral: true });
        return;
    }

    const bookedTimeblock = await TimeblockModel.findOne({ _id: Types.ObjectId(timeblockId) });

    if (!bookedTimeblock) {
        interaction.reply({ content: 'Invalid Booking ID: Do `/view` to see all your current bookings!', ephemeral: true });
        return;
    }

    const bookedSection = await SectionModel.findOne({ _id: bookedTimeblock.sectionId });

    if (!bookedSection) {
        interaction.reply({ content: 'Section not found! Please contact an admin.', ephemeral: true });
        return;
    }

    const maxCapacity = bookedSection.capacity;

    const manageState = interaction.options.getString('add-or-remove');
    const usernameArray: string[] = [];
    let bookError = false;

    for (let i = 0; i < 5; i++) {
        const username = interaction.options.getUser(`discord-username-${i + 1}`);

        if (username !== null && !usernameArray.includes(username.id)) {
            usernameArray.push(username.id);
        }
    }

    if (manageState === 'add') {
        if (bookedTimeblock.users.length + usernameArray.length > maxCapacity) {
            interaction.reply({ content: `Too many members listed. Current avaliable space: ${maxCapacity - bookedTimeblock.users.length}`, ephemeral: true });
            return;
        }

        for (const id of usernameArray) {
            if (!bookedTimeblock.users.includes(id)) {
                bookedTimeblock.users.push(id);
            }
        }
        await bookedTimeblock.save();
        interaction.reply({ content: 'User(s) successfully added.', ephemeral: true });
    }

    if (manageState === 'remove') {
        for (const id of usernameArray) {
            if (id === bookedTimeblock.booker) {
                bookError = true;
            } else if (bookedTimeblock.users.includes(id)) {
                bookedTimeblock.users.splice(bookedTimeblock.users.indexOf(id), 1);
            }
        }
        await bookedTimeblock.save();

        if (bookError && usernameArray.length > 1) {
            interaction.reply({ content: 'User(s) successfully removed.\nPS: Cannot remove the booker. Use `/delete` to delete a booking instead.', ephemeral: true });
        } else if (bookError) {
            interaction.reply({ content: 'Cannot remove the booker. Use `/delete` to delete a booking instead.', ephemeral: true });
        } else {
            interaction.reply({ content: 'User(s) successfully removed.', ephemeral: true });
        }
    }
}

export default {
    name: 'manage',
    description: 'Manage Collaborators in Booking!',
    options: [
        {
            type: 3,
            name: 'booking-id',
            description: 'ID of your booking',
            required: true,
        },
        {
            type: 3,
            name: 'add-or-remove',
            description: 'Add or remove collaborators',
            choices: [
                {
                    name: 'add',
                    value: 'add',
                },
                {
                    name: 'remove',
                    value: 'remove',
                },
            ],
            required: true,
        },
        {
            type: 6,
            name: 'discord-username-1',
            description: 'Discord username (@) of the member',
            required: true,
        },
        {
            type: 6,
            name: 'discord-username-2',
            description: 'Discord username (@) of the member',
        },
        {
            type: 6,
            name: 'discord-username-3',
            description: 'Discord username (@) of the member',
        },
        {
            type: 6,
            name: 'discord-username-4',
            description: 'Discord username (@) of the member',
        },
        {
            type: 6,
            name: 'discord-username-5',
            description: 'Discord username (@) of the member',
        },
    ],

    async execute(interaction: CommandInteraction): Promise<void> {
        await handleCommandInteraction(interaction);
        return;
    },

    async handleSelectMenu(interaction: SelectMenuInteraction, userArray: string[], maxCapacity: number, bookingId: string): Promise<void> {
        let manageState = 'add';
        let embed = updateEmbed(userArray, maxCapacity, manageState);
        let buttonRow = updateButtons(manageState);

        const message = (await interaction.reply({ content: `${interaction.user}`, embeds: [embed], components: [buttonRow], fetchReply: true })) as Message;

        const buttonCollector = message.createMessageComponentCollector({ componentType: 'BUTTON', time: 120000 });
        const mentionsCollector = interaction!.channel!.createMessageCollector({ time: 120000 });

        buttonCollector.on('collect', async (buttonInteraction: ButtonInteraction) => {
            //Temporary check as message isn't ephemeral
            if (buttonInteraction.user.id === interaction.user.id) {
                switch (buttonInteraction.customId) {
                    case 'completeBooking':
                        await TimeblockModel.updateOne({ _id: bookingId }, { $push: { users: await mongoDBFilter(userArray, bookingId) } }, { upsert: true });

                        interaction.followUp({ content: 'Booking Successfully Booked!', ephemeral: true });
                        interaction.deleteReply();
                        break;
                    case 'addCollaborators':
                    case 'removeCollaborators':
                        manageState = buttonInteraction.customId === 'addCollaborators' ? 'add' : 'remove';
                        embed = updateEmbed(userArray, maxCapacity, manageState);
                        buttonRow = updateButtons(manageState);

                        buttonInteraction.update({ embeds: [embed], components: [buttonRow] });
                        break;
                    default:
                        console.log('Button not found!');
                }
            } else {
                buttonInteraction.reply({ content: "This button isn't for you!", ephemeral: true });
            }
        });

        mentionsCollector.on('collect', (message) => {
            if (message.author.id === interaction.user.id) {
                const mentionedUsers = message.mentions.users;

                if (!mentionedUsers.size) {
                    return;
                }

                message.delete();

                for (const mentionedUser of mentionedUsers) {
                    switch (manageState) {
                        case 'add':
                            if (maxCapacity - userArray.length > 0) {
                                if (!userArray.includes(mentionedUser[0])) {
                                    userArray.push(mentionedUser[0]);
                                }
                            } else {
                                interaction.followUp({ content: 'There are no more available spaces left for additional members!', ephemeral: true });
                            }
                            break;
                        case 'remove':
                            if (userArray.includes(mentionedUser[0])) {
                                if (interaction.user.id === mentionedUser[0]) {
                                    interaction.followUp({ content: "You can't remove yourself!", ephemeral: true });
                                } else {
                                    userArray.splice(userArray.indexOf(mentionedUser[0]), 1);
                                }
                            }
                            break;
                        default:
                            console.log('manageState not found!');
                    }
                }
                const userEmbed = updateEmbed(userArray, maxCapacity, manageState);

                interaction.editReply({ embeds: [userEmbed] });
            }
        });
    },
};
