// backend/test-db.js
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('正在尝试连接 Supabase 数据库...');
    const result = await prisma.$queryRaw`SELECT NOW()`;
    
    console.log('数据库连接完美！打通了！');
    console.log('云端数据库当前时间：', result[0].now);
    
  } catch (error) {
    console.error('数据库连接失败，抓到错误：', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();