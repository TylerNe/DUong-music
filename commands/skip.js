const { MessageEmbed } = require("discord.js");

exports.run = async (client, message) => {
  const channel = message.member.voice.channel;
  if (!channel)
    return message.channel.send(
      "Bạn phải ở trong voice để sài lệnh này!"
    );
  let queue = message.client.queue.get(message.guild.id);
  if (!queue)
    return message.channel.send(
      new MessageEmbed()
        .setDescription(":x: Không bài hát nào để thực hiện yêu cầu!")
        .setColor("RED")
    );
  queue.connection.dispatcher.end('skipped');
  return message.channel.send(
    new MessageEmbed()
      .setDescription("**Skipped the music :white_check_mark: **")
      .setColor("BLUE")
  );
};
