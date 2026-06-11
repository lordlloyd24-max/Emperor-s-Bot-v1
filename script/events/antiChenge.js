const fs = require('fs-extra');
const path = require('path');

module.exports.config = {
    title: "antiChange",
    author: "Ayman"
};

const configPath = path.resolve(__dirname, '../../script/commands/cache/antiChangeConfig.json');

function loadConfig() {
    try {
        if (!fs.existsSync(configPath)) return {};
        return fs.readJsonSync(configPath);
    } catch (e) {
        return {};
    }
}

module.exports.HakimEvent = async function({ api, event }) {
    try {
        const { threadID, logMessageType, logMessageData, author } = event;
        
        if (!logMessageType || !threadID) return;
        
        const data = loadConfig();
        if (!data[threadID]) return;

        const botID = api.getCurrentUserID();
        if (author == botID) return;

        // جلب المطورين للاستثناء
        const developers = global.config?.X_ADMIN || Mirror?.config?.X_ADMIN || []; 
        if (developers && developers.includes(author)) return; 

        // 1. نظام الحماية العامة
        if (data[threadID].anti) {
            if (logMessageType === "log:thread-name") {
                api.sendMessage(`🚫 نظام الحماية: عذراً، غير مسموح بتغيير اسم المجموعة!`, threadID);
                api.getThreadInfo(threadID, (err, info) => {
                    if (!err && info && info.threadName) api.setTitle(info.threadName, threadID);
                });
            }
            if (logMessageType === "log:thread-icon") {
                api.sendMessage(`🚫 نظام الحماية: عذراً، غير مسموح بتغيير صورة المجموعة!`, threadID);
            }
        }

        // 2. نظام حماية الأدمن
        if (data[threadID].antiAdmin) {
            if (logMessageType === "log:thread-admins" && logMessageData) {
                const TARGET_USER = logMessageData.TARGET_ID;
                if (!TARGET_USER) return;

                // استثناء المطور من العقاب إذا تم لمس رتبته
                if (developers && developers.includes(TARGET_USER)) {
                    api.changeAdminStatus(threadID, TARGET_USER, true);
                    api.changeAdminStatus(threadID, author, false);
                    return;
                }

                // سحب رتبة المشرف الذي تلاعب بالصلاحيات فوراً
                api.changeAdminStatus(threadID, author, false, (err) => {
                    if (!err) {
                        api.sendMessage(`⚠️ تم كشف تلاعب بالرتب! جاري تجريد المسؤول من صلاحيات الإدارة فوراً...`, threadID);
                        
                        // إلغاء العملية التي قام بها
                        if (logMessageData.ADMIN_EVENT === "add_admin") {
                            api.changeAdminStatus(threadID, TARGET_USER, false);
                        } else if (logMessageData.ADMIN_EVENT === "remove_admin") {
                            api.changeAdminStatus(threadID, TARGET_USER, true);
                        }
                    }
                });
            }
        }
    } catch (error) {
        console.log("خطأ داخلي في حدث الحماية تم تجنبه:", error);
    }
};
