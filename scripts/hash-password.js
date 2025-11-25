// Usage: npm run hash:pw your_password
const bcrypt = require('bcryptjs');

async function main() {
  const pwd = process.argv[2];
  if (!pwd) {
    console.error('Please provide a password: npm run hash:pw your_password');
    process.exit(1);
  }
  const hash = await bcrypt.hash(pwd, 10);
  console.log(hash);
}

main();
