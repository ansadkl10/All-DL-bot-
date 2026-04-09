const TelegramBot = require("node-telegram-bot-api");
const axios = require("axios");

const bot = new TelegramBot(process.env.BOT_TOKEN, {
  polling: true
});

// detect API
function getApi(url) {
  if (url.includes("spotify.com")) {
    return `https://api.nexray.web.id/downloader/v1/spotify?url=${encodeURIComponent(url)}`;
  }
  if (url.includes("facebook.com")) {
    return `https://api.nexray.web.id/downloader/facebook?url=${encodeURIComponent(url)}`;
  }
  if (url.includes("instagram.com/stories")) {
    return `https://api.nexray.web.id/downloader/v2/instagram?url=${encodeURIComponent(url)}`;
  }
  if (url.includes("instagram.com/reel")) {
    return `https://api.nexray.web.id/downloader/instagram?url=${encodeURIComponent(url)}`;
  }
  if (url.includes("tiktok.com")) {
    return `https://api.nexray.web.id/downloader/tiktok?url=${encodeURIComponent(url)}`;
  }
  if (url.includes("youtube.com") || url.includes("youtu.be")) {
    return `https://api.nexray.web.id/downloader/v1/ytmp4?url=${encodeURIComponent(url)}&resolusi=1080`;
  }
  if (url.includes("pin.it") || url.includes("pinterest")) {
    return `https://api.nexray.web.id/downloader/pinterest?url=${encodeURIComponent(url)}`;
  }
  return null;
}

// start command
bot.onText(/\/start/, (msg) => {
  bot.sendMessage(
    msg.chat.id,
    "👋 Send any link (Spotify, TikTok, IG, FB, YouTube, Pinterest)\n\n⚡ I will download it!"
  );
});

// handle messages
bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  if (!text || text.startsWith("/")) return;

  const api = getApi(text);

  if (!api) {
    return bot.sendMessage(chatId, "❌ Unsupported link!");
  }

  try {
    const loading = await bot.sendMessage(chatId, "⏳ Processing...");

    const res = await axios.get(api);
    const data = res.data.result;

    // Spotify
    if (api.includes("spotify")) {
      await bot.sendAudio(chatId, data.url, {
        title: data.title,
        performer: data.artist.join(", ")
      });
    }

    // Facebook
    else if (api.includes("facebook")) {
      await bot.sendVideo(chatId, data.video_hd || data.video_sd);
    }

    // Instagram Story
    else if (api.includes("v2/instagram")) {
      for (let media of data.media) {
        if (media.type === "video") {
          await bot.sendVideo(chatId, media.url);
        } else {
          await bot.sendPhoto(chatId, media.url);
        }
      }
    }

    // Instagram Reel
    else if (api.includes("/instagram?")) {
      await bot.sendVideo(chatId, data[0].url);
    }

    // TikTok
    else if (api.includes("tiktok")) {
      await bot.sendVideo(chatId, data.data);
    }

    // YouTube
    else if (api.includes("ytmp4")) {
      await bot.sendVideo(chatId, data.url);
    }

    // Pinterest
    else if (api.includes("pinterest")) {
      await bot.sendPhoto(chatId, data.image);
    }

    // delete loading msg
    bot.deleteMessage(chatId, loading.message_id);

  } catch (err) {
    console.error(err);
    bot.sendMessage(chatId, "❌ Error processing link");
  }
});
