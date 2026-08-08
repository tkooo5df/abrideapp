const fs = require('fs');
let code1 = fs.readFileSync('src/components/booking/BookingModal.tsx', 'utf8');
code1 = code1.replace(/\r?\n'@\r?\n?$/, '');
fs.writeFileSync('src/components/booking/BookingModal.tsx', code1, 'utf8');

let code2 = fs.readFileSync('src/integrations/telegram/telegramService.ts', 'utf8');
code2 = code2.replace(/\r?\n'@\r?\n?$/, '');
fs.writeFileSync('src/integrations/telegram/telegramService.ts', code2, 'utf8');

