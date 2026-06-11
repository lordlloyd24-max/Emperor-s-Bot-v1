const fs = require('fs-extra');
const path = require('path');

module.exports.config = {
    title: "حماية",
    aliases: ["حماية-ادمن"], // 👈 هنا جعلنا البوت يقبل الكلمتين كأمر واحد!
    release: "1.7.5",
    clearance: 1, // للأدمن والمطور
    author: "Ayman",
    summary: "نظام حماية المجموعة (الاسم، الأفاتار، الثيم، والأدمن)",
    section: "الخدمات",
    syntax: "حماية [on/off] | حماية-ادمن [on/off]",
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
    const { threadID, messageID, body } = event;
    const data = loadConfig();

    if (!data[threadID]) {
        data[threadID] = { anti: false, antiAdmin: false };
    }

    // قراءة المعامل الأول (on أو off)
    const commandArg = args[0] ? args[0].toLowerCase() : "";

    // فحص النص لمعرفة هل المستخدم كتب أمر الأدمن أم الحماية العامة
    const isAntiAdmin = body.includes("حماية-ادمن");

    if (isAntiAdmin) {
        // إدارة نظام حماية الأدمن
        if (commandArg === "on") {
            data[threadID].antiAdmin = true;
            saveConfig(data);
            return api.sendMessage("👮‍♂️ تم تفعيل حماية الأدمن بنجاح! أي مشرف يتلاعب بالرتب سيتم طرده من الإدارة فوراً.", threadID, messageID);
        } else if (commandArg === "off") {
            data[threadID].antiAdmin = false;
            saveConfig(data);
            return api.sendMessage("🔓 تم إيقاف نظام حماية الأدمن.", threadID, messageID);
        } else {
            return api.sendMessage("❌ الاستخدام الصحيح: /حماية-ادمن on أو /حماية-ادمن off", threadID, messageID);
        }
    } else {
        // إدارة نظام الحماية العامة (الاسم، الأيقونة، الثيم)
        if (commandArg === "on") {
            data[threadID].anti = true;
            saveConfig(data);
            return api.sendMessage("🛡️ تم تفعيل نظام الحماية العامة للمجموعة بنجاح.", threadID, messageID);
        } else if (commandArg === "off") {
            data[threadID].anti = false;
            saveConfig(data);
            return api.sendMessage("🔓 تم إيقاف نظام الحماية العامة للمجموعة.", threadID, messageID);
        } else {
            return api.sendMessage("❌ الاستخدام الصحيح: /حماية on أو /حماية off", threadID, messageID);
        }
    }
};

