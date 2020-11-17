import { App, LogLevel } from "@slack/bolt";
import { ChatPostMessageArguments } from "@slack/web-api";
import dotenv from "dotenv";
import * as middleware from "./customMiddleware";
import * as blocKit from "./block";
import * as reaction from "./reaction";
import { ReactionEvent } from "./types/reaction";

dotenv.config();

Object.keys(dotenv).forEach((key) => {
  process.env[key] = dotenv[key];
});

// Initializes your app with your bot token and signing secret
const app = new App({
  logLevel: LogLevel.DEBUG,
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
});

// custom middleware's
app.use(middleware.notBotMessages);
app.use(middleware.noThreadMessages);
app.use(middleware.getTeamInfo);
app.use(middleware.addUsersInfoContext);
app.use(middleware.getFileInfo);

app.message(
  middleware.getChannelInfo,
  /^(.*)/ as any,
  async ({ client, context, message }) => {
    const msgOption: ChatPostMessageArguments = {
      token: client.token,
      channel: process.env.CHANNEL_NAME,
      text: message.text,
      unfurl_links: true,
      link_names: true,
      unfurl_media: true,
      icon_url: context.profile.image_original,
      username: context.profile.display_name || context.profile.real_name,
      blocks: await blocKit.dealBlock({ context, message }),
    };

    console.log("1回目", JSON.stringify(msgOption, null, 4));

    await app.client.chat
      .postMessage(msgOption)
      .then((res) => {
        if (res.ok) console.log("msg: ok ✅");
      })
      .catch((err) => {
        console.error({ err });
        console.log(err.data.response_metadata);
      });

    console.log(JSON.stringify(context.files, null, 4));

    if (context.files && context.files.files.length) {
      // snippet, POST がある場合は blocks があると送信できないので本文投稿後に再度ファイルだけ投稿
      // icon_url, usernameもpayloadに存在するとattachmentの展開がされないので削除
      delete msgOption.blocks;
      delete msgOption.icon_url;
      delete msgOption.username;
      await Promise.all(
        context.files.files.map(async (file) => {
          return await new Promise<string>((resolve, reject) => {
            if (file.permalink) {
              resolve(file.permalink);
            } else {
              reject("error");
            }
          });
        })
      )
        .then(async (result) => {
          // console.log({ result });
          await result.forEach((value) => {
            msgOption.text = value as string;
          });
        })
        .catch((e) => {
          console.log({ e });
        });
      console.log("2回目", JSON.stringify(msgOption, null, 4));
      await app.client.chat
        .postMessage(msgOption)
        .then((res) => {
          if (res.ok) console.log("msg: ok ✅");
        })
        .catch((err) => {
          console.error({ err });
          console.log(err.data.response_metadata);
        });
    }
  }
);

// -----------------------------
// reaction added
// -----------------------------
app.event("reaction_added", async ({ body, client }) => {
  const event = body.event as ReactionEvent;

  console.log({ event });
  if (event.item["type"] !== "message") {
    return;
  }
  const channel = event.item["channel"];
  const timestamp = event.item["ts"];
  // TL => Users'Post は ts だけでいい
  //   => めんどいから こっちも ts, channel で統一したがいいかも？
  // Users'Post => TL は ts, channel がいる

  // TODO: DBできたらここを差し替え

  // const bindedPost = mongo.get(timestamp, channel)
  // const emoji = reaction.get(event);

  // // TODO: #30 image
  // const options = {
  //   name: emoji,
  //   // 紐づくもう一つの channel, ts
  //   channel: bindedPost.channel,
  //   timestamp: bindedPost.timestamp
  // }
  // client.reactions.add(options).then(result => {
  //   console.log({result})
  // });
});

// -----------------------------
// reaction deleted
// -----------------------------
app.event("reaction_removed", async ({ body, client }) => {
  const event = body.event as ReactionEvent;

  if (event.item["type"] !== "message") {
    return;
  }
  const channel = event.item["channel"];
  const timestamp = event.item["ts"];
  // TL => Users'Post は ts だけでいい
  //   => めんどいから こっちも ts, channel で統一したがいいかも？
  // Users'Post => TL は ts, channel がいる

  // TODO: DBできたらここを差し替え

  // const bindedPost = mongo.get(timestamp, channel)
  // const emoji = reaction.get(event);

  // // TODO: #30 image
  // const options = {
  //   name: emoji,
  //   // 紐づくもう一つの channel, ts
  //   channel: bindedPost.channel,
  //   timestamp: bindedPost.timestamp
  // }
  // client.reactions.remove(options).then(result => {
  //   console.log({result})
  // });
});

(async () => {
  // Start your app
  await app.start(process.env.PORT || 3000);

  console.log("⚡️ Bolt app is running!");
})();
