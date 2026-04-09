from pyrogram import Client, filters
import requests
import os

API_ID = int(os.environ.get("API_ID"))
API_HASH = os.environ.get("API_HASH")
BOT_TOKEN = os.environ.get("BOT_TOKEN")

app = Client(
    "downloader-bot",
    api_id=API_ID,
    api_hash=API_HASH,
    bot_token=BOT_TOKEN
)

# detect API
def get_api(url):
    if "spotify.com" in url:
        return f"https://api.nexray.web.id/downloader/v1/spotify?url={url}"
    if "facebook.com" in url:
        return f"https://api.nexray.web.id/downloader/facebook?url={url}"
    if "instagram.com/stories" in url:
        return f"https://api.nexray.web.id/downloader/v2/instagram?url={url}"
    if "instagram.com/reel" in url:
        return f"https://api.nexray.web.id/downloader/instagram?url={url}"
    if "tiktok.com" in url:
        return f"https://api.nexray.web.id/downloader/tiktok?url={url}"
    if "youtube.com" in url or "youtu.be" in url:
        return f"https://api.nexray.web.id/downloader/v1/ytmp4?url={url}&resolusi=1080"
    if "pin.it" in url:
        return f"https://api.nexray.web.id/downloader/pinterest?url={url}"
    return None

@app.on_message(filters.text)
async def downloader(client, message):
    url = message.text

    if "http" not in url:
        return await message.reply("❌ Send valid link")

    api = get_api(url)

    if not api:
        return await message.reply("❌ Unsupported link")

    msg = await message.reply("⏳ Downloading...")

    try:
        res = requests.get(api).json()

        if not res.get("result"):
            return await msg.edit("❌ Failed to fetch data")

        data = res["result"]

        # 🎵 Spotify
        if "spotify" in api:
            file_url = data["url"]
            filename = "audio.mp3"

        # 📘 Facebook
        elif "facebook" in api:
            file_url = data["video_hd"] or data["video_sd"]
            filename = "video.mp4"

        # 📸 Instagram Story
        elif "v2/instagram" in api:
            for media in data["media"]:
                file = requests.get(media["url"]).content
                name = "video.mp4" if media["type"] == "video" else "image.jpg"
                with open(name, "wb") as f:
                    f.write(file)

                if media["type"] == "video":
                    await message.reply_video(name)
                else:
                    await message.reply_photo(name)

                os.remove(name)
            return await msg.delete()

        # 🎬 Reel / TikTok / YouTube
        else:
            file_url = data.get("data") or data.get("url") or data[0]["url"]
            filename = "video.mp4"

        # download file
        file = requests.get(file_url).content

        with open(filename, "wb") as f:
            f.write(file)

        # send file (🔥 2GB support)
        if filename.endswith(".mp3"):
            await message.reply_audio(filename)
        else:
            await message.reply_video(filename)

        os.remove(filename)
        await msg.delete()

    except Exception as e:
        await msg.edit(f"❌ Error: {e}")

app.run()
