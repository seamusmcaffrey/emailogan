const bcrypt = require('bcryptjs');

const password = 'blocklogan1988';
const saltRounds = 12;

bcrypt.hash(password, saltRounds, function(err, hash) {
  if (err) {
    console.error('Error:', err);
  } else {
    console.log('Password:', password);
    console.log('Hash:', hash);
  }
});