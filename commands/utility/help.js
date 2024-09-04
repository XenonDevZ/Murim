const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const paginate = require('../../utils/paginate');

module.exports = {
    name: 'help',
    aliases: ['h'],
    description: 'List all message commands or get information about a specific command. Also provides guidance on using slash commands.',
    category: 'Utility',
    usage: '!help [command | category | keyword]',
    run: async (client, message, args) => {
        const messagePrefix = client.config?.prefix || '!';
        const ownerID = client.config?.ownerId;

        // Separate message commands, excluding commands without categories
        const categories = {
            MessageCommands: {},
        };

        // Categorize message commands
        client.commands.forEach(command => {
            const category = command.category;
            if (!category) return; // Exclude commands without a category
            if (!categories.MessageCommands[category]) categories.MessageCommands[category] = [];
            categories.MessageCommands[category].push(command);
        });

        const commandsPerPage = 5;
        const pages = [];

        if (!args.length) {
            // First page: Help command overview
            const helpEmbed = new EmbedBuilder()
                .setTitle('Help Command Overview')
                .setDescription(
                    `Welcome to the help section! Use \`${messagePrefix}help [command | keyword]\` to get details about specific message commands.\n\nHere are some examples of how to use the help command:\n` +
                    `\`${messagePrefix}help imagesearch\` - Get details about the \`imagesearch\` command.\n` +
                    `\`${messagePrefix}help Utility\` - Get a list of all commands in the Utility category.\n\n` +
                    `Message commands are triggered using the prefix \`${messagePrefix}\`. For example, \`${messagePrefix}ping\`.\n\n` +
                    `Slash commands are triggered by typing \`/\` in the chat.`
                )
                .setColor(0x3498DB);

            pages.push(helpEmbed);

            // Process the categories and commands for message commands
            Object.keys(categories.MessageCommands).forEach(category => {
                const categoryCommands = categories.MessageCommands[category];

                for (let i = 0; i < categoryCommands.length; i += commandsPerPage) {
                    const currentCommands = categoryCommands.slice(i, i + commandsPerPage);

                    const embed = new EmbedBuilder()
                        .setTitle(`Message Commands - ${category}`)
                        .setColor(0x3498DB)
                        .setDescription(`Here are the message commands available in the ${category} category:`);

                    currentCommands.forEach(command => {
                        const commandName = command.name || command.data.name;
                        const description = command.description || 'No description provided.';
                        const usage = command.usage
                            ? command.usage.includes(commandName)
                                ? `\`${command.usage}\``
                                : `\`${messagePrefix}${command.usage}\``
                            : `\`${messagePrefix}${commandName}\``;
                        const aliases = command.aliases ? `\nAliases: ${command.aliases.map(alias => `\`${alias}\``).join(', ')}` : '';

                        embed.addFields(
                            { name: `\`${messagePrefix}${commandName}\``, value: `${description}${aliases}`, inline: false },
                            { name: 'Usage', value: usage, inline: true }
                        );
                    });

                    pages.push(embed);
                }
            });

            // Pagination buttons
            const paginationRow = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('back')
                    .setEmoji('◀️')
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(true),
                new ButtonBuilder()
                    .setCustomId('delete')
                    .setEmoji('🗑️')
                    .setStyle(ButtonStyle.Danger),
                new ButtonBuilder()
                    .setCustomId('next')
                    .setEmoji('▶️')
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(pages.length <= 1)
            );

            let currentPageIndex = 0;

            const initialMessage = await message.channel.send({
                embeds: [pages[currentPageIndex]],
                components: [paginationRow],
            });

            const filter = (interaction) => interaction.user.id === message.author.id;
            const collector = initialMessage.createMessageComponentCollector({
                filter,
                time: 60000,
            });

            collector.on('collect', async (interaction) => {
                if (interaction.isButton()) {
                    if (interaction.customId === 'back') {
                        currentPageIndex--;
                    } else if (interaction.customId === 'next') {
                        currentPageIndex++;
                    } else if (interaction.customId === 'delete') {
                        collector.stop();
                        return await initialMessage.delete();
                    }

                    paginationRow.components[0].setDisabled(currentPageIndex <= 0);
                    paginationRow.components[2].setDisabled(currentPageIndex >= pages.length - 1);

                    await interaction.update({
                        embeds: [pages[currentPageIndex]],
                        components: [paginationRow],
                    });
                }
            });

            collector.on('end', () => {
                if (!initialMessage.deleted) {
                    const disabledRow = new ActionRowBuilder().addComponents(
                        paginationRow.components[0].setDisabled(true),
                        paginationRow.components[1].setDisabled(true),
                        paginationRow.components[2].setDisabled(true)
                    );
                    initialMessage.edit({ components: [disabledRow] });
                }
            });
        } else {
            const searchTerm = args.join(' ').toLowerCase();

            // First, try to find a command by name or alias
            const command =
                client.commands.get(searchTerm) ||
                client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(searchTerm));

            if (command) {
                const commandName = command.name || command.data.name;
                const description = command.description || 'No description provided.';
                const usage = command.usage
                    ? command.usage.includes(commandName)
                        ? `\`${command.usage}\``
                        : `\`${messagePrefix}${command.usage}\``
                    : `\`${messagePrefix}${commandName}\``;
                const aliases = command.aliases ? `\nAliases: ${command.aliases.map(alias => `\`${alias}\``).join(', ')}` : '';

                const embed = new EmbedBuilder()
                    .setTitle(`Command: ${commandName}`)
                    .setDescription(description)
                    .addFields(
                        { name: 'Usage', value: usage, inline: false },
                        { name: 'Category', value: command.category || 'No category', inline: false }
                    )
                    .setColor(0x3498DB);

                if (aliases) {
                    embed.addFields({ name: 'Aliases', value: aliases });
                }

                return message.channel.send({ embeds: [embed] });
            }

            // If no exact command found, search message commands by keyword
            const matchedCategory = Object.keys(categories.MessageCommands).find(category => category.toLowerCase() === searchTerm);

            if (matchedCategory) {
                const categoryCommands = categories.MessageCommands[matchedCategory];
                const embed = new EmbedBuilder()
                    .setTitle(`Message Commands - ${matchedCategory}`)
                    .setColor(0x3498DB)
                    .setDescription(`Here are the message commands available in the ${matchedCategory} category:`);

                categoryCommands.forEach(command => {
                    const commandName = command.name || command.data.name;
                    const description = command.description || 'No description provided.';
                    const usage = command.usage
                        ? command.usage.includes(commandName)
                            ? `\`${command.usage}\``
                            : `\`${messagePrefix}${commandName} ${command.usage}\``
                        : `\`${messagePrefix}${commandName}\``;
                    const aliases = command.aliases ? `\nAliases: ${command.aliases.map(alias => `\`${alias}\``).join(', ')}` : '';

                    embed.addFields(
                        { name: `\`${messagePrefix}${commandName}\``, value: `${description}${aliases}`, inline: false },
                        { name: 'Usage', value: usage, inline: true }
                    );
                });

                return message.channel.send({ embeds: [embed] });
            }

            // Search message commands by keyword
            const matchedCommands = client.commands.filter(cmd => cmd.description && cmd.description.toLowerCase().includes(searchTerm));

            if (matchedCommands.size > 0) {
                const embed = new EmbedBuilder()
                    .setTitle(`Commands matching "${searchTerm}"`)
                    .setColor(0x3498DB);

                matchedCommands.forEach(cmd => {
                    const commandName = cmd.name || cmd.data.name;
                    const description = cmd.description || 'No description provided.';
                    const usage = cmd.usage
                        ? cmd.usage.includes(commandName)
                            ? `\`${cmd.usage}\``
                            : `\`${messagePrefix}${commandName} ${cmd.usage}\``
                        : `\`${messagePrefix}${commandName}\``;
                    const aliases = cmd.aliases ? `\nAliases: ${cmd.aliases.map(alias => `\`${alias}\``).join(', ')}` : '';

                    embed.addFields(
                        { name: `\`${messagePrefix}${commandName}\``, value: `${description}${aliases}`, inline: false },
                        { name: 'Usage', value: usage, inline: true }
                    );
                });

                return message.channel.send({ embeds: [embed] });
            } else {
                return message.reply(`No message commands found matching "${searchTerm}".`);
            }
        }
    },
};
