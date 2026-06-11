const fs = require('fs-extra');
const path = require('path');
const axios = require('axios');

module.exports.config = {
    title: "اوامر",
    release: "2.0.1",
    clearance: 0,
    author: "Hakim Tracks",
    summary: "عرض قائمة الأوامر أو تفاصيل أمر معين",
    section: "عـــامـة",
    syntax: "اوامر [اسم الأمر]",
    delay: 5,
};

// الصورة الافتراضية القديمة في حال فشل النظام في التعرف على الجنس
const DEFAULT_IMAGE_URL = "https://i.postimg.cc/Lss0c7jJ/received-1530539828856515.jpg";
const LOCAL_IMG_PATH = path.join(__dirname, "img", "menu.png");
const BOT_NAME = "Mirror Bot v2.0.1";
const DEVELOPER_NAME = "Hakim Tracks";

// ⚠️ ضع هنا روابط الـ 3 صور الخاصة بالرجل (الأولاد)
const boyImages = [
  "https://i.postimg.cc/mhxwhpcj/6b0ba5a8dc7124680674d4417b645103.jpg",
  "https://i.postimg.cc/rw1hRTNr/8d73fe3828a606f6d2895e901d6cb67f.jpg",
  "https://i.postimg.cc/rs7hxFHr/a83bcdded3cabf95582db6d14969cfc8.jpg"
];

// ⚠️ ضع هنا روابط الـ 3 صور الخاصة بالمرأة (البنات)
const girlImages = [
  "https://example.com/girl1.jpg",
  "https://example.com/girl2.jpg",
  "https://example.com/girl3.jpg"
];

// دالة مخصصة لتحميل وإحضار الصورة بناءً على الجنس
async function getGenderImageStream(senderID, api) {
  // أولاً: التحقق من وجود صورة محلية ثابتة داخل مجلد البوت
  if (fs.existsSync(LOCAL_IMG_PATH)) {
    return fs.createReadStream(LOCAL_IMG_PATH);
  }

  let finalImageUrl = DEFAULT_IMAGE_URL;

  // جلب الجنس عبر API فيسبوك
  try {
    const userInfo = await new Promise((resolve, reject) => {
      api.getUserInfo(senderID, (err, res) => {
        if (err) reject(err);
        else resolve(res);
      });
    });

    if (userInfo && userInfo[senderID]) {
      const gender = userInfo[senderID].gender; // 1 = بنت، 2 = ولد

      if (gender === 1 && boyImages.length > 0) {
        // إذا كانت بنت، نختار صورة ولد عشوائية
        finalImageUrl = boyImages[Math.floor(Math.random() * boyImages.length)];
      } else if (gender === 2 && girlImages.length > 0) {
        // إذا كان ولد، نختار صورة بنت عشوائية
        finalImageUrl = girlImages[Math.floor(Math.random() * girlImages.length)];
      }
    }
  } catch (error) {
    console.error("فشل جلب جنس المستخدم، سيتم استخدام الصورة الافتراضية:", error);
  }

  // تحميل الصورة المختارة وحفظها مؤقتاً في كاش فريد لكل مستخدم
  const fallbackPath = path.join(__dirname, "cache", `menu_${senderID}.jpg`);
  fs.ensureDirSync(path.dirname(fallbackPath));

  try {
    const res = await axios.get(finalImageUrl, { responseType: "arraybuffer" });
    fs.writeFileSync(fallbackPath, res.data);
    return fs.createReadStream(fallbackPath);
  } catch (e) {
    console.error("خطأ أثناء تحميل الصورة المطلوبة:", e);
    // كحل أخير إذا فشل التحميل تماماً، نحاول إرجاع الصورة الافتراضية
    try {
      const res = await axios.get(DEFAULT_IMAGE_URL, { responseType: "arraybuffer" });
      fs.writeFileSync(fallbackPath, res.data);
      return fs.createReadStream(fallbackPath);
    } catch (err) {
      return null;
    }
  }
}

module.exports.HakimRun = async function({ api, event, args }) {
  const { threadID, senderID, messageID } = event;
  const commandsMap = Mirror.client.commands;

  const uniqueCommands = new Map();
  for (const [alias, cmd] of commandsMap.entries()) {
    if (cmd.config && cmd.config.title && !uniqueCommands.has(cmd.config.title)) {
      uniqueCommands.set(cmd.config.title, cmd);
    }
  }

  // في حال طلب قائمة الأوامر كاملة
  if (args.length === 0) {
    const grouped = {};
    for (const [title, cmd] of uniqueCommands.entries()) {  
      const cat = cmd.config.section || "بدون فئة";
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(title);
    }

    let msg = ``;
    msg += `╮───────∙⋆⋅ ※ ⋅⋆∙───────╭\n`; 
    msg += `    قـــائــمــة الاوامـــــر\n`; 
    msg += `╯───────∙⋆⋅ ※ ⋅⋆∙───────╰\n\n`; 
    for (const [category, list] of Object.entries(grouped)) {
      msg += `╮────∙⋆⋅「 ${category} 」\n`;
      
      let commandLines = [];
      for (let i = 0; i < list.length; i += 3) {
        const chunk = list.slice(i, i + 3);
        commandLines.push("│ › " + chunk.join('  ›  '));
      }
      msg += commandLines.join('\n') + '\n';
      msg += `╯───────∙⋆⋅ ※ ⋅⋆∙───────◈\n\n`;
    }

    msg += `╮───────∙⋆⋅ ※ ⋅⋆∙───────◈\n`;
    msg += `│ الاوامــر : ${uniqueCommands.size}\n`;
    msg += `│ اســم الــبــوت : ${BOT_NAME}\n`;
    msg += `│ الــمــالــلك : ${DEVELOPER_NAME}\n`;
    msg += `│ اسـتـخــدم : اوامر [اسم الامر] \n`; 
    msg += `╯───────∙⋆⋅ ※ ⋅⋆∙───────◈\n`;

    // جلب الصورة الديناميكية بناءً على الجنس
    const imageStream = await getGenderImageStream(senderID, api);
    
    return api.sendMessage({ body: msg, attachment: imageStream }, threadID, () => {
      // تنظيف ملف الكاش المؤقت للمستخدم بعد الإرسال للحفاظ على مساحة السيرفر
      const fallbackPath = path.join(__dirname, "cache", `menu_${senderID}.jpg`);
      if (fs.existsSync(fallbackPath)) fs.unlinkSync(fallbackPath);
    }, messageID);
  }

  // في حال طلب تفاصيل أمر معين (اوامر [اسم الأمر])
  const commandName = args.join(" ").trim().toLowerCase();
  const command = uniqueCommands.get(commandName) || Array.from(uniqueCommands.values()).find(c => (c.config.title && c.config.title.toLowerCase() === commandName) || (c.config.aliases && c.config.aliases.includes(commandName)));

  if (!command) {
    return api.sendMessage(`❌ الأمر "${commandName}" غير موجود.`, threadID, messageID);
  }

  const permMap = { 0: "عضو", 1: "أدمن المجموعة", 2: "مطور البوت" };
  const { title, clearance, section, summary, syntax, delay } = command.config;

  const details = `╮────∙⋆⋅「 تفاصيل 」⋅⋆∙────╭
│
│  ◈ الاســم : ${title}
│  ◈ الصلاحية : ${permMap[clearance] || "غير محددة"}
│  ◈ الفئــة : ${section || "غير محددة"}
│
│  ◈ الوصــف : ${summary || "لا يوجد وصف"}
│  ◈ الاستخدام : ${syntax || title}
│
│  ◈ الـمـدة : ${delay || 5} ثوانٍ
│  ◈ المطــور : ${DEVELOPER_NAME}
│
╯───────∙⋆⋅ ※ ⋅⋆∙───────╰`;

  // عند عرض التفاصيل نرسل الصورة المتوافقة مع الجنس أيضاً لمزيد من التفاعل
  const imageStream = await getGenderImageStream(senderID, api);
  return api.sendMessage({ body: details, attachment: imageStream }, threadID, () => {
    const fallbackPath = path.join(__dirname, "cache", `menu_${senderID}.jpg`);
    if (fs.existsSync(fallbackPath)) fs.unlinkSync(fallbackPath);
  }, messageID);
};
