require('dotenv').config();

const {
    Client,
    GatewayIntentBits,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    StringSelectMenuBuilder,
    PermissionsBitField,
    ChannelType
} = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

client.once('ready', () => {
    console.log(`${client.user.tag} is online!`);
});


// ====================================
// VERIFY PANEL
// ====================================

client.on('messageCreate', async message => {
    if (message.author.bot) return;

    if (message.content === '!verifysetup') {

        const embed = new EmbedBuilder()
            .setColor('#7F00FF')
            .setTitle('🔰 EXE AUTH SYSTEM 🔰')
            .setDescription(`To gain full access to the server, you must complete verification.  

📌 Click the Verify button below to unlock all channels and features.
📌 This helps us keep the community safe and secure.  
✅ Once verified, enjoy full access!.`)
            .setThumbnail('https://cdn.discordapp.com/attachments/1259856192969113600/1518363715316093048/0622_1.gif')
            .setImage('https://cdn.discordapp.com/attachments/1259856192969113600/1518365172031291402/0622_1.gif');

        const button = new ButtonBuilder()
            .setCustomId('verify_button')
            .setLabel('Verify Me')
            .setEmoji('✅')
            .setStyle(ButtonStyle.Success);

        const row = new ActionRowBuilder().addComponents(button);

        message.channel.send({ embeds: [embed], components: [row] });
    }
});


// ====================================
// TICKET PANEL
// ====================================

client.on('messageCreate', async message => {
    if (message.author.bot) return;

    if (message.content === '!ticketsetup') {

        const embed = new EmbedBuilder()
            .setColor('#7F00FF')
            .setTitle('🎫 EXE SUPPORT — TICKETS')
            .setDescription(
                `❓ **Important Rules:**\n\n` +
                `**1.** Tickets without a clear message (e.g. \`hi\`, \`help\`, or blank) will be **closed automatically**.\n` +
                `**2.** Please explain your issue **clearly and in detail** so staff can assist you faster.\n` +
                `**3.** Do **not** open multiple tickets for the same issue — duplicates will be closed.\n` +
                `**4.** No pinging or rushing staff — patience is required.\n` +
                `**5.** All server rules apply inside tickets.\n` +
                `**6.** Always select the correct ticket category to avoid delays or closure.\n\n` +
                `❗ **Failure to follow these rules may result in:**\n` +
                `• Ticket closure without response\n` +
                `• A timeout\n` +
                `• Or a permanent ban, depending on severity\n\n` +
                `Thank you for your cooperation, we're here to help! 💙`
            )
            .setThumbnail('https://cdn.discordapp.com/attachments/1259856192969113600/1518363715316093048/0622_1.gif')
            .setImage('https://media.discordapp.net/attachments/1259856192969113600/1518371090873847929/0622_1.gif')
            .setFooter({ text: 'Powered by EXE' });

        const ticketSelect = new StringSelectMenuBuilder()
            .setCustomId('ticket_select')
            .setPlaceholder('Select a topic...')
            .addOptions(
                {
                    label: 'Buy Ticket',
                    description: 'Open a ticket to purchase something',
                    value: 'buy_ticket',
                    emoji: '💰'
                },
                {
                    label: 'Support Ticket',
                    description: 'Open a ticket for general support',
                    value: 'support_ticket',
                    emoji: '✉️'
                }
            );

        const row = new ActionRowBuilder().addComponents(ticketSelect);

        message.channel.send({ embeds: [embed], components: [row] });
    }
});


// ====================================
// BUTTON SYSTEM
// ====================================

client.on('interactionCreate', async interaction => {

    // VERIFY BUTTON
    if (interaction.isButton() && interaction.customId === 'verify_button') {

        const verifiedRole = interaction.guild.roles.cache.get(process.env.VERIFIED_ROLE_ID);
        const unverifiedRole = interaction.guild.roles.cache.get(process.env.UNVERIFIED_ROLE_ID);

        if (!verifiedRole) {
            return interaction.reply({ content: 'Verified role not found.', ephemeral: true });
        }

        if (unverifiedRole) {
            await interaction.member.roles.remove(unverifiedRole);
        }

        await interaction.member.roles.add(verifiedRole);

        interaction.reply({ content: 'EXE AUTH SUCCESS ✅', ephemeral: true });
    }


    // TICKET TOPIC SELECT MENU
    if (interaction.isStringSelectMenu() && interaction.customId === 'ticket_select') {

        const selected = interaction.values[0]; // 'buy_ticket' or 'support_ticket'
        const ticketPrefix = selected === 'buy_ticket' ? 'buy' : 'support';

        const existing = interaction.guild.channels.cache.find(
            c => c.name === `${ticketPrefix}-${interaction.user.id}`
        );

        if (existing) {
            return interaction.reply({
                content: `❌ You already have a ticket: ${existing}`,
                ephemeral: true
            });
        }

        const categoryId = selected === 'buy_ticket'
            ? process.env.BUY_TICKET_CATEGORY_ID
            : process.env.TICKET_CATEGORY_ID;

        const channel = await interaction.guild.channels.create({
            name: `${ticketPrefix}-${interaction.user.username}`,
            type: ChannelType.GuildText,
            parent: categoryId,

            permissionOverwrites: [
                {
                    id: interaction.guild.id,
                    deny: [PermissionsBitField.Flags.ViewChannel]
                },
                {
                    id: interaction.user.id,
                    allow: [
                        PermissionsBitField.Flags.ViewChannel,
                        PermissionsBitField.Flags.SendMessages,
                        PermissionsBitField.Flags.ReadMessageHistory
                    ]
                }
            ]
        });

        const closeButton = new ButtonBuilder()
            .setCustomId('close_ticket')
            .setLabel('Close Ticket')
            .setEmoji('🔒')
            .setStyle(ButtonStyle.Danger);

        const row = new ActionRowBuilder().addComponents(closeButton);

        const embed = new EmbedBuilder()
            .setColor('#9d00ff')
            .setTitle(selected === 'buy_ticket' ? '💰 Buy Ticket' : '✉️ Support Ticket')
            .setDescription(`Welcome ${interaction.user}  
Explain your issue and wait for support.`)
            .setThumbnail('https://cdn.discordapp.com/attachments/1259856192969113600/1518363715316093048/0622_1.gif');

        channel.send({ embeds: [embed], components: [row] });

        interaction.reply({
            content: `✅ Ticket created: ${channel}`,
            ephemeral: true
        });
    }


    // CLOSE TICKET
    if (interaction.isButton() && interaction.customId === 'close_ticket') {

        await interaction.reply({
            content: '🔒 Closing ticket in 20 seconds...'
        });

        setTimeout(() => {
            interaction.channel.delete();
        }, 20000);
    }
});


client.login(process.env.TOKEN);
