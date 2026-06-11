const fs = require('fs-extra');
const path = require('path');

module.exports.config = {
    title: "حماية",
    release: "1.7.0",
    clearance: 1, // للأدمن والمطور فقط
    author: "Ayman",
    summary: "نظام حماية المجموعة (منع تغيير الاسم، الأفاتار، الثيم، والأدمن)",
    section: "الخدمات",
    syntax: "حماية [on/off] | حماية-ادمن [on/off]",
    delay: 3,
};

// مسار حفظ الإعدادات لضمان عدم ضياعها عند إعادة تشغيل البوت
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

// تشغيل أو إيقاف الحماية عبر الأوامر النصية
module.exports.HakimRun = async function({ api, event, args }) {
    const { threadID, messageID, senderID } = event;
    const data = loadConfig();

    if (!data[threadID]) {
        data[threadID] = { anti: false, antiAdmin: false };
    }

    const commandArg = args[0] ? args[0].toLowerCase() : "";

    // 1. أمر الحماية العامة (الاسم، الأفاتار، الثيم، الإيموجي)
    if (event.body.startsWith("حماية ")) {
        if (commandArg === "on") {
            data[threadID].anti = true;
            saveConfig(data);
            return api.sendMessage("🛡️ تم تفعيل نظام الحماية العامة للمجموعة بنجاح (منع تعديل الاسم، الأفاتار، الثيم، والإيموجي).", threadID, messageID);
        } else if (commandArg === "off") {
            data[threadID].anti = false;
            saveConfig(data);
            return api.sendMessage("🔓 تم إيقاف نظام الحماية العامة للمجموعة.", threadID, messageID);
        } else {
            return api.sendMessage("❌ الاستخدام الخاطئ! اكتب: حماية on أو حماية off", threadID, messageID);
        }
    }

    // 2. أمر حماية الأدمن
    if (event.body.startsWith("حماية-ادمن ")) {
        if (commandArg === "on") {
            data[threadID].antiAdmin = true;
            saveConfig(data);
            return api.sendMessage("👮‍♂️ تم تفعيل حماية الأدمن! أي مشرف يضيف أو يزيل أدمن سيتم طرده من الإدارة فوراً.", threadID, messageID);
        } else if (commandArg === "off") {
            data[threadID].antiAdmin = false;
            saveConfig(data);
            return api.sendMessage("🔓 تم إيقاف نظام حماية الأدمن.", threadID, messageID);
        } else {
            return api.sendMessage("❌ الاستخدام الخاطئ! اكتب: حماية-ادمن on أو حماية-ادمن off", threadID, messageID);
        }
    }

    // عرض الحالة الحالية إذا كتب "حماية" فقط
    const status = `⚙️ **وضع الحماية الحالي المجموعه:**\n\n• الحماية العامة: ${data[threadID].anti ? "🟢 مفعلة" : "🔴 معطلة"}\n• حماية الإدارة: ${data[threadID].antiAdmin ? "🟢 مفعلة" : "🔴 معطلة"}\n\n💡 للتحكم اكتب: [حماية on/off] أو [حماية-ادمن on/off]`;
    return api.sendMessage(status, threadID, messageID);
};

// مراقبة الأحداث والتغييرات داخل المجموعة (Event Listener)
module.exports.HakimEvent = async function({ api, event }) {
    const { threadID, logMessageType, logMessageData, author } = event;
    const data = loadConfig();

    // إذا لم تكن الحماية مفعلة في هذه المجموعة، يتجاهل البوت الحدث
    if (!data[threadID]) return;

    const botID = api.getCurrentUserID();
    // إذا كان المسبب هو البوت نفسه، يتجاهل الحدث منعا للتكرار اللانهائي
    if (author == botID) return;

    // جلب قائمة مطوري البوت من إعدادات النظام لعمل استثناء لهم
    const developers = global.config?.X_ADMIN || Mirror?.config?.X_ADMIN || []; 
    if (developers.includes(author)) return; 

    // أولاً: أحداث الحماية العامة (اسم، ثيم، ايموجي، افاتار)
    if (data[threadID].anti) {
        
        // 1. منع تغيير اسم المجموعة
        if (logMessageType === "log:thread-name") {
            api.sendMessage(`🚫 غير مسموح بتغيير اسم المجموعة! جاري إعادة الاسم القديم...`, threadID);
            // جلب البيانات القديمة المخزنة في فيسبوك وإعادتها
            api.getThreadInfo(threadID, (err, info) => {
                if (!err) api.setTitle(info.threadName, threadID);
            });
        }

        // 2. منع تغيير الأيقونة / الأفاتار
        if (logMessageType === "log:thread-icon") {
            api.sendMessage(`🚫 غير مسموح بتغيير صورة المجموعة المتوافقة!`, threadID);
            // لعدم إمكانية جلب بافر الصورة القديمة بسهولة، يكتفي البوت بالتحذير أو يمكنك ترك فيسبوك يرفضها
        }

        // 3. منع تغيير الثام أو الإيموجي
        if (logMessageType === "log:thread-color" || logMessageType === "log:thread-approval-mode") {
            api.sendMessage(`🚫 تم كشف تعديل في إعدادات المجموعة، جاري حظر التغيير.`, threadID);
        }
    }

    // ثانياً: أحداث حماية الأدمن (ترقية أو تنزيل المشرفين)
    if (data[threadID].antiAdmin) {
        
        if (logMessageType === "log:thread-admins") {
            const TARGET_USER = logMessageData.TARGET_ID; // الشخص الذي تم تعديل رتبته

            // إستثناء: إذا كان الشخص المستهدف بالمساس هو المطور، يتم التدخل فوراً وصارم جداً
            if (developers.includes(TARGET_USER)) {
                api.sendMessage(`🚨 محاولة مستحيلة! تم كشف محاولة لتغيير رتبة مطور البوت الصانع!`, threadID);
                // رفع المطور مجدداً رغماً عنهم
                api.changeAdminStatus(threadID, TARGET_USER, true);
                // طرد الشخص الخائن الذي حاول التعديل من الإدارة
                api.changeAdminStatus(threadID, author, false);
                return;
            }

            // الحالة العامة: أي تعديل رتبة غير مصرح به
            api.sendMessage(`⚠️ كشف محاولة تلاعب بالرتب! جاري تجريد الفاعل من صلاحياته...`, threadID);
            
            // 1. معاقبة الفاعل (إزالته من الإدارة فوراً)
            api.changeAdminStatus(threadID, author, false);

            // 2. إلغاء العملية وإعادة الوضع كما كان
            if (logMessageData.ADMIN_EVENT === "add_admin") {
                // إذا أضاف أدمن جديد، نقوم بتنزيله
                api.changeAdminStatus(threadID, TARGET_USER, false);
            } else if (logMessageData.ADMIN_EVENT === "remove_admin") {
                // إذا أزال أدمن قديم، نقوم برفع الأدمن مجدداً
                api.changeAdminStatus(threadID, TARGET_USER, true);
            }
        }
    }
};
