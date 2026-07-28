// backend/test-db.js
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('⏳ 正在尝试连接 Supabase 数据库...');
    
    // 执行一个最简单的原生 SQL 查询，向数据库要一下它当前的系统时间
    const result = await prisma.$queryRaw`SELECT NOW()`;
    
    console.log('✅ 数据库连接完美！打通了！');
    console.log('⏰ 云端数据库当前时间：', result[0].now);
    
  } catch (error) {
    console.error('❌ 数据库连接失败，抓到错误：', error);
  } finally {
    // 养成好习惯，测试完断开连接
    await prisma.$disconnect();
  }
}

main();