const fs = require("fs");
const Config = require(__dirname + "/../config.js");
const axios = require("axios");
const fs = require("fs-extra");
const { smd, bot } = require("../lib");
let s_ser = true;
smd(
  {
    cmdname: "update",
    type: "owner",
    info: "Installs external modules or plugins from a provided URL or a predefined list.",
    fromMe: s_ser,
    filename: __filename,
    use: "<gist url>",
  },
  async (message, args) => {
    try {
      try {
        bot =
          (await BotModel.findOne({ id: "bot_" + sessionId })) ||
          (await BotModel.new({ id: "bot_" + sessionId }));
      } catch {
        bot = false;
      }

      let pluginNames = [];
      let pluginUrls = {};
      let pluginExtensions = {};

      try {
        const { data: response } = await axios.get(
          "https://gist.github.com/SuhailTechInfo/185b7e3296e0104ab211daa5ea11e7dc/raw"
        );
        pluginUrls = {
          ...(typeof response.external === "object" ? response.external : {}),
          ...(typeof response.plugins === "object" ? response.plugins : {}),
        };
        pluginNames = response.names;
        pluginExtensions =
          response.extension && typeof response.extension === "object"
            ? response.extension
            : {};
      } catch (error) {
        pluginUrls = {};
      }

      pluginNames = Array.isArray(pluginNames) ? pluginNames : [];

      if (bot && bot.plugins) {
        log("Downloading Update");
        pluginUrls = { ...bot.plugins, ...pluginUrls };
      }

      let url = args ? args : message.quoted ? message.quoted.text : "";
      if (url.toLowerCase().includes("https")) {
        try {
          const { data: pluginCode } = await axios.get(url);
          const pluginName = url.split("/").pop().split(".")[0];
          const pluginFileName =
            pluginName +
            (pluginExtensions[pluginName] &&
            /.js|.smd|.suhail/gi.test(pluginExtensions[pluginName])
              ? pluginExtensions[pluginName]
              : ".smd");
          const pluginDir =
            plugin_dir +
            (pluginFileName.includes("/") ? pluginFileName.split("/")[0] : "");

          if (!fs.existsSync(pluginDir)) {
            fs.mkdirSync(pluginDir, { recursive: true });
          }

          fs.writeFileSync(plugin_dir + pluginFileName, pluginCode, "utf8");
          log(" " + pluginName + " ✔️");
        } catch (error) {
          log(" " + pluginName + " ❌");
        }
      } else if (Object.keys(pluginUrls || {}).length > 0) {
        const externalPlugins = pluginUrls;

        for (const pluginName in externalPlugins) {
          try {
            const pluginUrl = externalPlugins[pluginName].includes("raw")
              ? externalPlugins[pluginName]
              : externalPlugins[pluginName] + "/raw";
            const { data: pluginCode } = await axios.get(pluginUrl);

            if (pluginCode) {
              const pluginFileName =
                pluginName +
                (pluginExtensions[pluginName] &&
                /.js|.smd|.suhail/gi.test(pluginExtensions[pluginName])
                  ? pluginExtensions[pluginName]
                  : ".smd");
              const pluginDir =
                plugin_dir +
                (pluginFileName.includes("/")
                  ? pluginFileName.split("/")[0]
                  : "");

              if (!fs.existsSync(pluginDir)) {
                fs.mkdirSync(pluginDir, { recursive: true });
              }

              fs.writeFileSync(plugin_dir + pluginFileName, pluginCode, "utf8");

              if (!pluginNames.includes(pluginName)) {
                log(" " + pluginName + " ✔️");
              }
            }
          } catch (error) {
            if (debug || !pluginNames.includes(pluginName)) {
              log(" " + pluginName + " ❌");
            }
          }
        }

        log("\\n✅ External Plugins Installed!");
      } else {
        return await message.send(
          "*Auto Updated Failed, Unable to Download Update Please Manually Do It*"
        );
      }
    } catch (error) {
      log("❌ ERROR INSTALATION PLUGINS ", error);
    }
  }
);