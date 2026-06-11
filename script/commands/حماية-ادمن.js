const fs = require('fs-extra');
const path = require('path');

module.exports.config = {
    title: "حماية-ادمن",
    release: "1.8.0",
    clearance: 1, 
    author: "Ayman",
    summary: "نظام حماية رتب المشرفين والأدمن",
    section: "الخدمات",
    syntax: "حماية-ادمن [on/off]",
    delay: 3,
};

const configPath = path.join(__dirname, "..", "cache", "antiChangeConfig.json");

function loadConfig() {
    if (!fs.existsSync(configPath)) {
        fs.ensureDirSync(path.dirname(configPath));
        fs.writeJsonSync(configPath, {});
    }
    return fs.readJsonSync(configPath);
}

function saveConfig(data) {
    fs.writeJsonSync(configPath, data, { spaces: 2 });
}

module.exports.HakimRun = async function({ api, event, args }) {
    const { threadID, messageID } = event;
    const data = loadConfig();

    if (!data[threadID]) {
        data[threadID] = { anti: false, antiAdmin: false };
    }

    const commandArg = args[0] ? args[0].toLowerCase() : "";

    if (commandArg === "on") {
        data[threadID].antiAdmin = true;
        saveConfig(data);
        return api.sendMessage("👮‍♂️ تم تفعيل حماية الأدمن بنجاح! أي مشرف يضيف أو يزيل أدمن سيتم طرده من الإدارة فوراً.", threadID, messageID);
    } else if (commandArg === "off") {
        data[threadID].antiAdmin = false;
        saveConfig(data);
        return api.sendMessage("🔓 تم إيقاف نظام حماية الأدمن.", threadID, messageID);
    } 

    const status = `⚙️ **وضع الحماية الحالي:**\n\n• الحماية العامة: ${data[threadID].anti ? "🟢 مفعلة" : "🔴 معطلة"}\n• حماية الإدارة: ${data[threadID].antiAdmin ? "🟢 مفعلة" : "🔴 معطلة"}\n\n💡 للتحكم اكتب:\n[/حماية on/off] أو [/حماية-ادمن on/off]`;
    return api.sendMessage(status, threadID, messageID);
};
