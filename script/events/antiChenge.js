const fs = require('fs-extra');
const path = require('path');

module.exports.config = {
    title: "antiChange",
    author: "Ayman"
};

// تحديد المسار الصحيح للمجلد الأب لضمان الوصول لملف الكاش
const configPath = path.join(__dirname, "..", "commands", "cache", "antiChangeConfig.json");

function loadConfig() {
    try {
        if (!fs.existsSync(configPath)) return {};
        return fs.readJsonSync(configPath);
    } catch (e) {
        return {};
    }
}

module.exports.HakimEvent = async function({ api, event }) {
    const { threadID, logMessageType, logMessageData, author } = event;
    
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
            api.sendMessage(`🚫 غير مسموح بتغيير اسم المجموعة! جاري استعادة الاسم...`, threadID);
            api.getThreadInfo(threadID, (err, info) => {
                if (!err && info.threadName) api.setTitle(info.threadName, threadID);
            });
        }
        if (logMessageType === "log:thread-icon") {
            api.sendMessage(`🚫 غير مسموح بتغيير صورة المجموعة!`, threadID);
        }
        if (logMessageType === "log:thread-color" || logMessageType === "log:thread-approval-mode") {
            api.sendMessage(`🚫 تم كشف تعديل في الإعدادات وتم إلغاؤه.`, threadID);
        }
    }

    // ثانياً: أحداث حماية الأدمن
    if (data[threadID].antiAdmin) {
        if (logMessageType === "log:thread-admins") {
            const TARGET_USER = logMessageData.TARGET_ID;

            // إستثناء المطورين من العقاب أو الإزالة
            if (developers.includes(TARGET_USER)) {
                api.sendMessage(`🚨 محاولة مرفوضة لتعديل رتبة مطور البوت الصانع!`, threadID);
                api.changeAdminStatus(threadID, TARGET_USER, true);
                api.changeAdminStatus(threadID, author, false);
                return;
            }

            api.sendMessage(`⚠️ تلاعب برتب الإدارة! جاري تجريد المشرف المسؤول من صلاحياته...`, threadID);
            
            // تنزيل الشخص الفاعل من الإدارة فوراً
            api.changeAdminStatus(threadID, author, false);

            // إلغاء العملية وإعادة الرتبة السابقة للمستهدف
            if (logMessageData.ADMIN_EVENT === "add_admin") {
                api.changeAdminStatus(threadID, TARGET_USER, false);
            } else if (logMessageData.ADMIN_EVENT === "remove_admin") {
                api.changeAdminStatus(threadID, TARGET_USER, true);
            }
        }
    }
};
