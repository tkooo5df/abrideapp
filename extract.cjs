const fs = require('fs');
let data1 = fs.readFileSync('extracted_command.json', 'utf8').replace(/^\uFEFF/, '');
const cmd1 = JSON.parse(data1).tool_calls[0].args.CommandLine;
const code1 = cmd1.replace(/^[\s\S]*?import \{ useState/, 'import { useState').replace(/\n'@$/, '');
fs.writeFileSync('src/components/booking/BookingModal.tsx', code1, 'utf8');

let data2 = fs.readFileSync('extracted_telegram.json', 'utf8').replace(/^\uFEFF/, '');
const cmd2 = JSON.parse(data2).tool_calls[0].args.CommandLine;
const code2 = cmd2.replace(/^[\s\S]*?\/\/ Telegram notification service/, '// Telegram notification service').replace(/\n'@$/, '');
fs.writeFileSync('src/integrations/telegram/telegramService.ts', code2, 'utf8');

