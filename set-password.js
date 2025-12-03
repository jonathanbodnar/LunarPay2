const bcrypt = require('bcryptjs');

const password = 'Gtui!##!9';
const hash = bcrypt.hashSync(password, 10);

console.log('Password:', password);
console.log('Bcrypt Hash:', hash);
console.log('\nSQL to run:');
console.log(`UPDATE users SET password = '${hash}' WHERE email = 'jonathan@apollo.inc';`);
