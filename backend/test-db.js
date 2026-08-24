// backend/test-db.js
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Trying to connect to the Supabase database...');
    const result = await prisma.$queryRaw`SELECT NOW()`;
    
    console.log('Database connection succeeded.');
    console.log('Current cloud database time:', result[0].now);
    
  } catch (error) {
    console.error('Database connection failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
