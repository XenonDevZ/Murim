const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const fetch = require('node-fetch');

module.exports = {
    name: 'meme',
    description: 'Sends a random meme from meme-api.com with an option to reload a new meme.',
    category: "Fun",
    aliases: [], // Add any command aliases here
    run: async (client, message, args) => {
        let lastMemeUrl = null; // Variable to store the last meme URL

        const fetchMeme = async () => {
            try {
                // Add a cache-busting query parameter to the API request
                const response = await fetch(`https://meme-api.com/gimme?${new Date().getTime()}`);

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();

                // Check if the meme is different from the last one
                if (data.url === lastMemeUrl) {
                    return fetchMeme(); // Recursively fetch a new meme if the same
                }

                lastMemeUrl = data.url;
                return data;
            } catch (error) {
                console.error('Error fetching meme:', error);
                return null;
            }
        };

        const memeData = await fetchMeme();
        if (!memeData) {
            return message.channel.send({ content: 'Failed to fetch a meme. Please try again later.' });
        }

        const memeEmbed = new EmbedBuilder()
            .setTitle(memeData.title)
            .setImage(memeData.url)
            .setFooter({ text: `Meme from ${memeData.subreddit}` });

        const reloadButton = new ButtonBuilder()
            .setCustomId('reload_meme')
            .setLabel('Reload')
            .setStyle(ButtonStyle.Primary);

        const row = new ActionRowBuilder().addComponents(reloadButton);

        const sentMessage = await message.channel.send({
            embeds: [memeEmbed],
            components: [row]
        });

        const filter = i => i.customId === 'reload_meme' && i.user.id === message.author.id;
        const collector = sentMessage.createMessageComponentCollector({ filter, time: 60000 });

        collector.on('collect', async i => {
            if (i.customId === 'reload_meme') {
                const newMemeData = await fetchMeme();
                if (!newMemeData) {
                    return i.update({ content: 'Failed to fetch a meme. Please try again later.', components: [] });
                }

                const newMemeEmbed = new EmbedBuilder()
                    .setTitle(newMemeData.title)
                    .setImage(newMemeData.url)
                    .setFooter({ text: `Meme from ${newMemeData.subreddit}` });

                await i.update({ embeds: [newMemeEmbed], components: [row] });
            }
        });

        collector.on('end', () => {
            // Disable the button after collector ends
            const disabledRow = new ActionRowBuilder().addComponents(
                reloadButton.setDisabled(true)
            );
            sentMessage.edit({ components: [disabledRow] });
        });
    }
};
