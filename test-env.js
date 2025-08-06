require('dotenv').config({ path: '../.env' }); console.log('DATABASE_URL:', process.env.DATABASE_URL?.substring(0, 50) + '...');
