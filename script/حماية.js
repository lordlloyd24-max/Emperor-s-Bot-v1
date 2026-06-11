const fs = require('fs-extra');
const path = require('path');

module.exports.config = {
    title: "حماية",
    release: "1.7.0",
    clearance: 1, // للأدمن والمطور
    author: "Ayman",
    summary: "نظام حماية المجموعة (منع تغيير الاسم، الأفاتار، الثيم، والأدمن)",
    section: "الخدمات",
    syntax: "حماية [on/off] | حماية-ادمن [on/off]",
    delay: 3,
};

// مسار حفظ الإعدادات
const configPath = path.join(__dirname, "cache", "antiChangeConfig.json");

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

// دالة التشغيل الأساسية عند كتابة الأمر نصياً
module.exports.HakimRun = async function({ api, event, args }) {
    const { threadID, messageID } = event;
    const data = loadConfig();

    if (!data[threadID]) {
        data[threadID] = { anti: false, antiAdmin: false };
    }

    const commandArg = args[0] ? args[0].toLowerCase() : "";

    // 1. أمر الحماية العامة
    if (event.body.startsWith("حماية ")) {
        if (commandArg === "on") {
            data[threadID].anti = true;
            saveConfig(data);
            return api.sendMessage("🛡️ تم تفعيل نظام الحماية العامة للمجموعة بنجاح.", threadID, messageID);
        } else if (commandArg === "off") {
            data[threadID].anti = false;
            saveConfig(data);
            return api.sendMessage("🔓 تم إيقاف نظام الحماية العامة للمجموعة.", threadID, messageID);
        } else {
            return api.sendMessage("❌ الاستخدام الصحيح: حماية on أو حماية off", threadID, messageID);
        }
    }

    // 2. أمر حماية الأدمن
    if (event.body.startsWith("حماية-ادمن ")) {
        if (commandArg === "on") {
            data[threadID].antiAdmin = true;
            saveConfig(data);
            return api.sendMessage("👮‍♂️ تم تفعيل حماية الأدمن بنجاح.", threadID, messageID);
        } else if (commandArg === "off") {
            data[threadID].antiAdmin = false;
            saveConfig(data);
            return api.sendMessage("🔓 تم إيقاف نظام حماية الأدمن.", threadID, messageID);
        } else {
            return api.sendMessage("❌ الاستخدام الصحيح: حماية-ادمن on أو حماية-ادمن off", threadID, messageID);
        }
    }

    // عرض الحالة إذا كتب "حماية" فقط
    const status = `⚙️ **وضع الحماية الحالي:**\n\n• الحماية العامة: ${data[threadID].anti ? "🟢 مفعلة" : "🔴 معطلة"}\n• حماية الإدارة: ${data[threadID].antiAdmin ? "🟢 مفعلة" : "🔴 معطلة"}\n\n💡 للتحكم اكتب:\n[حماية on/off] أو [حماية-ادمن on/off]`;
    return api.sendMessage(status, threadID, messageID);
};

// دالة مراقبة الأحداث المتوافقة مع محرك تشغيل البوت المطور
module.exports.HakimEvent = async function({ api, event }) {
    const { threadID, logMessageType, logMessageData, author } = event;
    
    // التأكد من أن الحدث يحتوي على البيانات المطلوبة
    if (!logMessageType) return;
    
    const data = loadConfig();
    if (!data[threadID]) return;

    const botID = api.getCurrentUserID();
    if (author == botID) return;

    // جلب قائمة المطورين كاستثناء دائم
    const developers = global.config?.X_ADMIN || Mirror?.config?.X_ADMIN || []; 
    if (developers.includes(author)) return; 

    // أولاً: أحداث الحماية العامة
    if (data[threadID].anti) {
        if (logMessageType === "log:thread-name") {
            api.sendMessage(`🚫 غير مسموح بتغيير اسم المجموعة!`, threadID);
            api.getThreadInfo(threadID, (err, info) => {
                if (!err && info.threadName) api.setTitle(info.threadName, threadID);
            });
        }
        if (logMessageType === "log:thread-icon") {
            api.sendMessage(`🚫 غير مسموح بتغيير صورة المجموعة!`, threadID);
        }
        if (logMessageType === "log:thread-color" || logMessageType === "log:thread-approval-mode") {
            api.sendMessage(`🚫 تم كشف تعديل في الإعدادات وتم حظره.`, threadID);
        }
    }

    // ثانياً: أحداث حماية الأدمن
    if (data[threadID].antiAdmin) {
        if (logMessageType === "log:thread-admins") {
            const TARGET_USER = logMessageData.TARGET_ID;

            if (developers.includes(TARGET_USER)) {
                api.sendMessage(`🚨 محاولة مرفوضة لتعديل رتبة مطور البوت!`, threadID);
                api.changeAdminStatus(threadID, TARGET_USER, true);
                api.changeAdminStatus(threadID, author, false);
                return;
            }

            api.sendMessage(`⚠️ تلاعب بالرتب! جاري تجريد الفاعل من الصلاحيات...`, threadID);
            api.changeAdminStatus(threadID, author, false);

            if (logMessageData.ADMIN_EVENT === "add_admin") {
                api.changeAdminStatus(threadID, TARGET_USER, false);
            } else if (logMessageData.ADMIN_EVENT === "remove_admin") {
                api.changeAdminStatus(threadID, TARGET_USER, true);
            }
        }
    }
};

