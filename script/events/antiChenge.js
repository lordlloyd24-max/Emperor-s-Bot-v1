const fs = require('fs-extra');
const path = require('path');

module.exports.config = {
    title: "antiChange",
    author: "Ayman"
};

const configPath = path.join(__dirname, "..", "cache", "antiChangeConfig.json");

function loadConfig() {
    if (!fs.existsSync(configPath)) return {};
    return fs.readJsonSync(configPath);
}

module.exports.HakimEvent = async function({ api, event }) {
    const { threadID, logMessageType, logMessageData, author } = event;
    
    if (!logMessageType) return;
    
    const data = loadConfig();
    if (!data[threadID]) return;

    const botID = api.getCurrentUserID();
    if (author == botID) return;

    const developers = global.config?.X_ADMIN || Mirror?.config?.X_ADMIN || []; 
    if (developers.includes(author)) return; 

    // الحماية العامة
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
            api.sendMessage(`🚫 تم كشف تعديل في إعدادات المجموعة وحظره.`, threadID);
        }
    }

    // حماية الأدمن
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
