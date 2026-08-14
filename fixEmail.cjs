const fs = require('fs');
const file = 'src/integrations/database/notificationService.ts';
let code = fs.readFileSync(file, 'utf8');

const target = `<p style="margin: 0; font-size: 15px; color: #4b5563; line-height: 1.8;">
                    \${data.message}
                  </p>`;

const replacement = `<p style="margin: 0; font-size: 15px; color: #4b5563; line-height: 1.8;">
                    \${userName ? \`<strong>مرحباً \${userName}،</strong><br><br>\` : ''}
                    \${data.message}
                  </p>`;

if (code.includes(target)) {
  code = code.replace(target, replacement);
  fs.writeFileSync(file, code);
  console.log('Fixed message greeting');
} else {
  console.log('Target not found');
}
