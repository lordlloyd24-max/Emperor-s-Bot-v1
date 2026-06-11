const fs = require('fs-extra');
const path = require('path');

module.exports.config = {
    title: "حماية",
    release: "1.8.0",
    clearance: 1, 
    author: "Ayman",
    summary: "نظام حماية المجموعة (الاسم، الأفاتار، الثيم)",
    section: "الخدمات",
    syntax: "حماية [on/off]",
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
        data[threadID].anti = true;
        saveConfig(data);
        return api.sendMessage("🛡️ تم تفعيل نظام الحماية العامة للمجموعة بنجاح (منع تغيير الاسم، الثيم، الأيقونة).", threadID, messageID);
    } else if (commandArg === "off") {
        data[threadID].anti = false;
        saveConfig(data);
        return api.sendMessage("🔓 تم إيقاف نظام الحماية العامة للمجموعة.", threadID, messageID);
    } 

    const status = `⚙️ **وضع الحماية الحالي:**\n\n• الحماية العامة: ${data[threadID].anti ? "🟢 مفعلة" : "🔴 معطلة"}\n• حماية الإدارة: ${data[threadID].antiAdmin ? "🟢 مفعلة" : "🔴 معطلة"}\n\n💡 للتحكم اكتب:\n[/حماية on/off] أو [/حماية-ادمن on/off]`;
    return api.sendMessage(status, threadID, messageID);
};

