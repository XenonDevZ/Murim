const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');

module.exports = async (interactionOrMessage, pages, timeout = 120000) => {
  if (!pages || pages.length === 0) return;

  let page = 0;

  // Determine if pagination is needed
  const isSinglePage = pages.length === 1;

  // Create the button components with emojis
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('back')
      .setEmoji('◀️') // Back emoji
      .setStyle(ButtonStyle.Primary)
      .setDisabled(true), // Always start with back button disabled
    new ButtonBuilder()
      .setCustomId('delete')
      .setEmoji('🗑️') // Delete emoji
      .setStyle(ButtonStyle.Danger), // Delete button in red
    new ButtonBuilder()
      .setCustomId('next')
      .setEmoji('▶️') // Next emoji
      .setStyle(ButtonStyle.Primary)
      .setDisabled(isSinglePage) // Disable next button if only one page
  );

  // Send the initial embed page
  const currentPage = await (interactionOrMessage.isCommand?.()
    ? interactionOrMessage.reply({
        embeds: [pages[page]],
        components: [row],
        fetchReply: true,
      })
    : interactionOrMessage.channel.send({
        embeds: [pages[page]],
        components: [row],
      }));

  const collector = currentPage.createMessageComponentCollector({
    time: timeout,
  });

  collector.on('collect', async (interaction) => {
    const userId = interactionOrMessage.user?.id || interactionOrMessage.author.id;

    if (interaction.user.id !== userId) {
      return interaction.reply({
        content: "This is not for you!",
        ephemeral: true,
      });
    }

    if (interaction.customId === 'back') {
      page--;
    } else if (interaction.customId === 'next') {
      page++;
    } else if (interaction.customId === 'delete') {
      collector.stop();
      return currentPage.delete();
    }

    // Manage button states
    row.components[0].setDisabled(page <= 0); // Disable back button if on first page
    row.components[2].setDisabled(page >= pages.length - 1); // Disable next button if on last page

    await interaction.update({ embeds: [pages[page]], components: [row] });
  });

  collector.on('end', () => {
    if (!currentPage.deleted) {
      const disabledRow = new ActionRowBuilder().addComponents(
        row.components[0].setDisabled(true),
        row.components[1].setDisabled(true),
        row.components[2].setDisabled(true)
      );
      currentPage.edit({ components: [disabledRow] });
    }
  });
};
