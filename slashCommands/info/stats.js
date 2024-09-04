const { SlashCommandBuilder, AttachmentBuilder } = require('discord.js');
const Canvas = require('canvas');
const path = require('path');

module.exports = {
    name: 'mystats',
    description: 'Shows your server statistics as an image',
    type: 1, // Slash command type

    run: async (client, interaction) => {
        const username = interaction.user.tag;
        const joinedAt = interaction.member.joinedAt.toDateString();
        const createdAt = interaction.user.createdAt.toDateString();
        const messages = '1500'; // Replace with actual data
        const voiceMinutes = '120'; // Replace with actual data
        const topChannel = '#general'; // Replace with actual data

        // Load the background image you provided
        const backgroundImagePath = path.join(__dirname, '../../assets/stats.png');
        const canvas = Canvas.createCanvas(900, 450);
        const context = canvas.getContext('2d');
        
        const background = await Canvas.loadImage(backgroundImagePath);
        context.drawImage(background, 0, 0, canvas.width, canvas.height);

        // Draw user info
        context.font = '34px Arial';
        context.fillStyle = '#ffffff';
        context.fillText(username, 250, 60);
        
        context.font = '24px Arial';
        context.fillStyle = '#dddddd';
        context.fillText(`Joined: ${joinedAt}`, 250, 130);
        context.fillText(`Created: ${createdAt}`, 250, 170);

        // Draw stat boxes
        context.fillStyle = '#32353B';
        context.fillRect(250, 210, 150, 100);
        context.fillRect(450, 210, 150, 100);
        context.fillRect(650, 210, 150, 100);

        context.font = '20px Arial';
        context.fillStyle = '#aaaaaa';
        context.fillText('Messages', 260, 240);
        context.fillText('Voice', 460, 240);
        context.fillText('Top Channel', 660, 240);

        context.font = '24px Arial';
        context.fillStyle = '#ffffff';
        context.fillText(messages, 260, 280);
        context.fillText(`${voiceMinutes} mins`, 460, 280);
        context.fillText(topChannel, 660, 280);

        // Create the attachment
        const attachment = new AttachmentBuilder(canvas.toBuffer(), { name: 'stats.png' });

        // Send the image in an embed
        const embed = {
            title: 'Your Server Stats',
            description: 'Here is a summary of your stats in the server:',
            image: {
                url: 'attachment://stats.png',
            },
        };

        await interaction.reply({ embeds: [embed], files: [attachment] });
    },
};
