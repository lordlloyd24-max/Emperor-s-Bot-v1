// كود منع توقف الأحداث وتخطي أخطاء مكتبة FCA المزعجة
process.on('unhandledRejection', (reason, promise) => {
    // يتجاهل الأخطاء الناتجة عن نقص برامترات الريأكشن أو الأحداث من المكتبة ويمنع انهيار الـ Event Handler
    if (reason && reason.toString().includes("Missing required parameters")) return;
    console.error('⚠️ تم رصد خطأ غير معالج في السيرفر ولكن تم تخطيه للحفاظ على عمل البوت:', reason);
});

process.on('uncaughtException', (err, origin) => {
    console.error('🚨 استثناء غير ملتقط تم تخطيه بنجاح:', err);
});


const { spawn } = require('child_process');
const path = require('path');
const chalk = require('chalk');

function startBot() {
    console.log(chalk.cyan(' [ SYSTEM ] ') + chalk.white('جاري تشغيل البوت...'));
    
    const child = spawn('node', ['index.js'], {
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
