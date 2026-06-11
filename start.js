const { spawn } = require('child_process');
const path = require('path');
const chalk = require('chalk');
const fs = require('fs');

// 1. إنشاء ملف حماية مؤقت ليتم حقنه داخل العملية المشفرة تلقائياً
const injectorPath = path.join(__dirname, 'anti-crash-injector.js');
const injectorCode = `
process.on('unhandledRejection', (reason, promise) => {
    if (reason && reason.toString().includes("Missing required parameters")) return;
    console.error('⚠️ [حماية السيرفر] تم تخطي خطأ غير معالج داخل البوت:', reason);
});
process.on('uncaughtException', (err, origin) => {
    console.error('🚨 [حماية السيرفر] تم تفادي انهيار الكود المشفر:', err);
});
`;
fs.writeFileSync(injectorPath, injectorCode);

function startBot() {
    console.log(chalk.cyan(' [ SYSTEM ] ') + chalk.white('جاري تشغيل البوت مع تفعيل جدار الحماية ضد الانهيار...'));
    
    // 2. تعديل أمر التشغيل ليقوم بحقن ملف الحماية قبل تشغيل index.js المشفر
    const child = spawn('node', ['--require', './anti-crash-injector.js', 'index.js'], {
        cwd: __dirname,
        stdio: 'inherit',
        shell: true
    });

    child.on('close', (code) => {
        if (code === 2) {
            console.log(chalk.yellow(' [ SYSTEM ] ') + chalk.white('تم طلب إعادة التشغيل اليدوي. جاري البدء...'));
            startBot();
        } else if (code !== 0) {
            console.log(chalk.red(' [ SYSTEM ] ') + chalk.white(`توقف البوت برمز الخطأ (${code}). إعادة التشغيل بعد 5 ثوانٍ...`));
            setTimeout(startBot, 5000);
        } else {
            console.log(chalk.green(' [ SYSTEM ] ') + chalk.white('توقف البوت بشكل طبيعي. إعادة التشغيل لضمان الاستمرارية...'));
            startBot();
        }
    });

    child.on('error', (err) => {
        console.error(chalk.red(' [ SYSTEM ] ') + chalk.white('فشل بدء العملية:'), err);
        setTimeout(startBot, 10000);
    });
}

console.log(chalk.bold.blue('\n ——————————————————————————————————————————————'));
console.log(chalk.bold.blue(' |       MIRROR BOT       |'));
console.log(chalk.bold.blue(' ——————————————————————————————————————————————\n'));

startBot();
