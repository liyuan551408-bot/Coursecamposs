require('dotenv').config({ path: '../.env' }); 
const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { OpenAI } = require('openai');

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const openai = new OpenAI({
  apiKey: process.env.ZHIPU_API_KEY,
  baseURL: "https://open.bigmodel.cn/api/paas/v4",
});

async function main() {
  console.log("Requesting Zhipu API and writing test courses to the cloud database...");
  
  const mockCourses = [
    {
      code: "COMP101",
      name: "Introduction to Computer Science",
      description: "Learn the fundamentals of programming, algorithms, and data structures. Suitable for beginners with no prior coding experience.",
      credits: 15,
    },
    {
      code: "MATH201",
      name: "Advanced Calculus",
      description: "Deep dive into multi-variable calculus, differential equations, and mathematical proofs. High workload and difficult exams.",
      credits: 15,
    }
  ];

  for (const course of mockCourses) {
    const embedResponse = await openai.embeddings.create({
      model: "embedding-3",
      input: `${course.name}. ${course.description}`
    });
    
    const vector = embedResponse.data[0].embedding;
    const vectorString = `[${vector.join(',')}]`;

    await prisma.$executeRawUnsafe(`
      INSERT INTO "Course" (code, name, description, credits, "updatedAt", embedding)
      VALUES ($1, $2, $3, $4, NOW(), $5::vector)
      ON CONFLICT (code) DO NOTHING;
    `, course.code, course.name, course.description, course.credits, vectorString);
    
    console.log(`Successfully stored ${course.code} and its AI vector into the cloud database!`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());