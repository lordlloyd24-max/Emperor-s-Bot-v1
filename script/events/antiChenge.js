const fs = require('fs-extra');
const path = require('path');

module.exports.config = {
    title: "antiChange",
    author: "Ayman"
};

// استخدام مسار ديناميكي آمن للوصول لملف الإعدادات
const configPath = path.resolve(__dirname, '../../script/commands/cache/antiChangeConfig.json');

function loadConfig() {
    try {
        if (!fs.existsSync(configPath)) return {};
        return fs.readJsonSync(configPath);
    } catch (e) {
        console.log("خطأ في قراءة ملف كاش الحماية:", e);
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

    // جلب قائمة المطورين للاستثناء
    const developers = global.config?.X_ADMIN || Mirror?.config?.X_ADMIN || []; 
    if (developers.includes(author)) return; 

    // 1. نظام الحماية العامة
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
            api.sendMessage(`🚫 تم كشف تعديل في إعدادات المجموعة وحظره.`, threadID);
        }
    }

    // 2. نظام حماية الأدمن
    if (data[threadID].antiAdmin) {
        if (logMessageType === "log:thread-admins") {
            const TARGET_USER = logMessageData.TARGET_ID;

            // استثناء المطور من الحذف أو العقاب
            if (developers.includes(TARGET_USER)) {
                api.sendMessage(`🚨 محاولة مرفوضة لتعديل رتبة مطور البوت!`, threadID);
                api.changeAdminStatus(threadID, TARGET_USER, true);
                api.changeAdminStatus(threadID, author, false);
                return;
            }

            // تنفيذ العقوبة فوراً على المشرف الخائن
            api.changeAdminStatus(threadID, author, false, (err) => {
                if (err) {
                    api.sendMessage(`❌ فشل تجريد الفاعل من صلاحياته. تأكد أن البوت أدمن في المجموعة ولديه صلاحية إدارة المشرفين!`, threadID);
                } else {
                    api.sendMessage(`⚠️ تم كشف تلاعب بالرتب! جاري تجريد الفاعل من صلاحيات الإدارة فوراً...`, threadID);
                    
                    // إرجاع الرتبة السابقة للشخص المستهدف
                    if (logMessageData.ADMIN_EVENT === "add_admin") {
                        api.changeAdminStatus(threadID, TARGET_USER, false);
                    } else if (logMessageData.ADMIN_EVENT === "remove_admin") {
                        api.changeAdminStatus(threadID, TARGET_USER, true);
                    }
                }
            });
        }
    }
};
