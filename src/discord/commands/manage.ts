import { ButtonInteraction, CommandInteraction, MessageEmbed, MessageActionRow, MessageButton, Message, SelectMenuInteraction } from 'discord.js';
import Timeblock from '../../models/timeBlock.model';

function updateEmbed(userArray: string[], maxCapacity: number, manageState: string) {
    const embedTitle = manageState === 'add' ? 'Adding' : 'Removing';
    const preposition = manageState === 'add' ? 'to' : 'from';

    const embed = new MessageEmbed()
        .setColor('#48d7fb')
        .setTitle(`Currently ${embedTitle} Collaborators`)
        .setDescription(
            `To ${manageState} collaborators ${preposition} your booking, @ their Discord username!\n\nCurrently Invited Collaborators (${
                maxCapacity! - userArray!.length
            } available spaces left):\n<@!${userArray?.join('>\n<@!')}>`
        );

    return embed;
}

function updateButtons(manageState: string) {
    const buttonRow = [new MessageButton().setCustomId('completeBooking').setLabel('Complete Booking').setStyle('PRIMARY')];
    const label = manageState === 'add' ? 'Remove' : 'Add';
    const style = manageState === 'add' ? 'DANGER' : 'SUCCESS';

    buttonRow.push(new MessageButton().setCustomId(`${label.toLowerCase()}Collaborators`).setLabel(`${label} Collaborators`).setStyle(style));

    return new MessageActionRow().addComponents(buttonRow);
}

async function mongoDBFilter(userArray: string[], bookingId: string) {
    //Ensures no duplicate members are listed under users of a certain timeblock (might need to alter this after updates)
    const filterArray = [];
    const currentUserArray = (await Timeblock.findOne({ _id: bookingId }))!.users;

    for (const user of userArray) {
        if (!currentUserArray.includes(user)) {
            filterArray.push(user);
        }
    }
    return filterArray;
}

async function parseCommandOptions(interaction: CommandInteraction) {
    const bookingId = interaction.options.getString('booking-id');
    const bookedTimeblock = await Timeblock.findOne({ _id: bookingId });

    if (bookedTimeblock === null) {
        interaction.reply({ content: 'Invalid Booking ID: Do `/bookings` to see all your current bookings!', ephemeral: true });
        return undefined;
    }

    //TODO: Finish This after updates to the timeblock model
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
            type: 3,
            name: 'discord-mentions',
            description: "@'s of the collaborators' discord usernames",
            required: true,
        },
    ],

    async execute(interaction: CommandInteraction | SelectMenuInteraction, userArray?: string[], maxCapacity?: number, bookingId?: string): Promise<void> {
        if (interaction.isCommand()) {
            //TODO: Finish this after updates
            await parseCommandOptions(interaction);
            return;
        }

        let manageState = 'add';
        let embed = updateEmbed(userArray!, maxCapacity!, manageState);
        let buttonRow = updateButtons(manageState);

        const message = (await interaction.reply({ embeds: [embed], components: [buttonRow], fetchReply: true })) as Message;

        const buttonCollector = message.createMessageComponentCollector({ componentType: 'BUTTON', time: 120000 });
        const mentionsCollector = interaction!.channel!.createMessageCollector({ time: 120000 });

        buttonCollector.on('collect', async (buttonInteraction: ButtonInteraction) => {
            //Temporary check as message isn't ephemeral
            if (buttonInteraction.user.id === interaction.user.id) {
                switch (buttonInteraction.customId) {
                    case 'completeBooking':
                        //TODO: Adjust this to fit the new users format under timeblock model
                        await Timeblock.updateOne({ _id: bookingId }, { $push: { users: await mongoDBFilter(userArray!, bookingId!) } }, { upsert: true });

                        interaction.followUp({ content: 'Booking Successfully Booked!', ephemeral: true });
                        interaction.deleteReply();
                        break;
                    case 'addCollaborators':
                    case 'removeCollaborators':
                        manageState = buttonInteraction.customId === 'addCollaborators' ? 'add' : 'remove';
                        embed = updateEmbed(userArray!, maxCapacity!, manageState);
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

                if (mentionedUsers.size === 0) return;

                message.delete();

                for (const mentionedUser of mentionedUsers) {
                    switch (manageState) {
                        case 'add':
                            if (!userArray!.includes(mentionedUser[0])) {
                                userArray!.push(mentionedUser[0]);
                            }
                            break;
                        case 'remove':
                            if (userArray!.includes(mentionedUser[0])) {
                                if (interaction.user.id === mentionedUser[0]) {
                                    interaction.followUp({ content: "You can't remove yourself!", ephemeral: true });
                                } else {
                                    userArray!.splice(userArray!.indexOf(mentionedUser[0]), 1);
                                }
                            }
                            break;
                        default:
                            console.log('manageState not found!');
                    }
                }
                const userEmbed = updateEmbed(userArray!, maxCapacity!, manageState);

                interaction.editReply({ embeds: [userEmbed] });
            }
        });
    },
};
