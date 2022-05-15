const ytdl = require("discord-ytdl-core");
const youtubeScraper = require("yt-search");
const yt = require("ytdl-core");
const { MessageEmbed, Util } = require("discord.js");
const forHumans = require("../utils/forhumans.js");

exports.run = async (client, message, args) => {
  const channel = message.member.voice.channel;

  const error = (err) => message.channel.send(err);
  const send = (content) => message.channel.send(content);
  const setqueue = (id, obj) => message.client.queue.set(id, obj);
  const deletequeue = (id) => message.client.queue.delete(id);
  var song;

  if (!channel) return error("Bạn cần vào voice để bật nhạc!");

  if (!channel.permissionsFor(message.client.user).has("CONNECT"))
    return error("Tui không có quyền vào room này");

  if (!channel.permissionsFor(message.client.user).has("SPEAK"))
    return error("Tui không có quyền nói ở room này!");

  const query = args.join(" ");

  if (!query) return error("Bạn cần nhập tên bài hát!");

  if (query.includes("www.youtube.com")) {
    try {
      const ytdata = await await yt.getBasicInfo(query);
      if (!ytdata) return error("Không tìm thấy!");
      song = {
        name: Util.escapeMarkdown(ytdata.videoDetails.title),
        thumbnail:
          ytdata.player_response.videoDetails.thumbnail.thumbnails[0].url,
        requested: message.author,
        videoId: ytdata.videoDetails.videoId,
        duration: forHumans(ytdata.videoDetails.lengthSeconds),
        url: ytdata.videoDetails.video_url,
        views: ytdata.videoDetails.viewCount,
      };
    } catch (e) {
      console.log(e);
      return error("Erro, check log!");
    }
  } else {
    try {
      const fetched = await (await youtubeScraper(query)).videos;
      if (fetched.length === 0 || !fetched)
        return error("Không tìm thấy bài hát!'");
      const data = fetched[0];
      song = {
        name: Util.escapeMarkdown(data.title),
        thumbnail: data.image,
        requested: message.author,
        videoId: data.videoId,
        duration: data.duration.toString(),
        url: data.url,
        views: data.views,
      };
    } catch (err) {
      console.log(err);
      return error("Erro, check log!");
    }
  }

  var list = message.client.queue.get(message.guild.id);

  if (list) {
    list.queue.push(song);
    return send(
      new MessageEmbed()
        .setAuthor(
          "Bài hát đã được thêm vào hàng chờ",
          "https://img.icons8.com/color/2x/cd--v3.gif"
        )
        .setColor("F93CCA")
        .setThumbnail(song.thumbnail)
        .addField("Tên bài hát", song.name, false)
        .addField("Views", song.views, false)
        .addField("Độ dài", song.duration, false)
        .addField("Yêu cầu bởi", song.requested.tag, false)
        .setFooter("Thứ " + list.queue.length + " trong hàng chờ")
    );
  }

  const structure = {
    channel: message.channel,
    vc: channel,
    volume: 85,
    playing: true,
    queue: [],
    connection: null,
  };

  setqueue(message.guild.id, structure);
  structure.queue.push(song);

  try {
    const join = await channel.join();
    structure.connection = join;
    play(structure.queue[0]);
  } catch (e) {
    console.log(e);
    deletequeue(message.guild.id);
    return error("I couldn't join the voice channel, Please check console");
  }

  async function play(track) {
    try {
      const data = message.client.queue.get(message.guild.id);
      if (!track) {
        data.channel.send("hàng chờ trống, leaving room!");
        message.guild.me.voice.channel.leave();
        return deletequeue(message.guild.id);
      }
      data.connection.on("disconnect", () => deletequeue(message.guild.id));
      const source = await ytdl(track.url, {
        filter: "audioonly",
        quality: "highestaudio",
        highWaterMark: 1 << 25,
        opusEncoded: true,
      });
      const player = data.connection
        .play(source, { type: "opus" })
        .on("finish", () => {
          var removed = data.queue.shift();
          if(data.loop == true){
            data.queue.push(removed)
          }
          play(data.queue[0]);
        });
      player.setVolumeLogarithmic(data.volume / 100);
      data.channel.send(
        new MessageEmbed()
          .setAuthor(
            "Bắt đầu chơi",
            "https://img.icons8.com/color/2x/cd--v3.gif"
          )
          .setColor("9D5CFF")
          .setThumbnail(track.thumbnail)
          .addField("Tên bài hát", track.name, false)
          .addField("Views", track.views, false)
          .addField("Độ dài", track.duration, false)
          .addField("Yêu cầu bởi", track.requested, false)
          .setFooter("Youtube Music Player")
      );
    } catch (e) {
      console.error(e);
    }
  }
};
