const fs = require('fs');

// Read the SQL dump
const sqlDump = fs.readFileSync('./old/lunarprod202508-29 2.sql', 'utf8');

// Extract user data for jonathan@apollo.inc (user_id=2, church_id=2)
console.log('=== EXTRACTING DATA FOR jonathan@apollo.inc ===\n');

// Extract users table data
const usersMatch = sqlDump.match(/INSERT INTO `users` VALUES (.+);/);
if (usersMatch) {
  const usersData = usersMatch[1];
  // Find user id=2
  const userRecords = usersData.split(/\),\(/);
  const jonathanUser = userRecords.find(r => r.startsWith('2,'));
  if (jonathanUser) {
    console.log('USER RECORD (ID=2):');
    console.log(jonathanUser.substring(0, 500) + '...\n');
  }
}

// Extract church_detail (organizations) for church_id=2
const churchMatch = sqlDump.match(/INSERT INTO `church_detail` VALUES (.+);/);
if (churchMatch) {
  const churchData = churchMatch[1];
  const churchRecords = churchData.split(/\),\(/);
  const apolloOrg = churchRecords.find(r => r.startsWith('2,'));
  if (apolloOrg) {
    console.log('ORGANIZATION RECORD (ID=2 - Apollo Eleven Inc):');
    console.log(apolloOrg.substring(0, 500) + '...\n');
  }
}

// Extract fortis onboarding for church_id=2
const fortisMatch = sqlDump.match(/INSERT INTO `fortis_onboarding` VALUES (.+);/);
if (fortisMatch) {
  const fortisData = fortisMatch[1];
  console.log('FORTIS ONBOARDING DATA:');
  console.log(fortisData.substring(0, 1000) + '...\n');
}

// Count related records
const donorsMatch = sqlDump.match(/INSERT INTO `account_donor` VALUES (.+);/);
if (donorsMatch) {
  const donors = donorsMatch[1].match(/\(8,'jonathan@apollo\.inc'/g);
  console.log(`DONORS for jonathan@apollo.inc: ${donors ? donors.length : 0}\n`);
}

// Check for transactions
const transactionsSection = sqlDump.match(/INSERT INTO `epicpay_customer_transactions`[^;]+;/);
if (transactionsSection) {
  const txMatches = transactionsSection[0].match(/church_id[^,]*,2,/g);
  console.log(`TRANSACTIONS for church_id=2: ${txMatches ? txMatches.length : 0}\n`);
}

console.log('=== EXTRACTION COMPLETE ===');
console.log('Run: node migrate-jonathan-data.js to see extracted data');
