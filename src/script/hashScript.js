import bcrypt from 'bcryptjs';

const password = 'SuperAdmin123';
const hashedPassword = await bcrypt.hash(password, 10);
console.log(hashedPassword);