const fs = require('fs');
const file = 'src/integrations/database/notificationService.ts';
let code = fs.readFileSync(file, 'utf8');

// Replace the message paragraph
code = code.replace(
  /<p style="margin: 0; font-size: 15px; color: #4b5563; line-height: 1\.8;">\s*\$\{data\.message\}\s*<\/p>/g,
  `<p style="margin: 0; font-size: 15px; color: #4b5563; line-height: 1.8;">
                  \${userName ? \`<strong>مرحباً \${userName}،</strong><br><br>\` : ''}
                  \${data.message}
                </p>`
);

fs.writeFileSync(file, code);
console.log('Fixed message greeting with Regex');
