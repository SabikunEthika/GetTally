const { PrismaClient } = require('@prisma/client');
const { scryptSync } = require('crypto');

const prisma = new PrismaClient();

async function main() {
  const salt = 'gettally-demo-salt';
  const passwordHash = `${salt}:${scryptSync('DemoPass123', salt, 64).toString('hex')}`;
  const demoEmail = 'gettally.demo@gmail.com';
  const existing = await prisma.seller.findUnique({ where: { email: demoEmail } })
    || await prisma.seller.findUnique({ where: { email: 'demo@gettally.local' } });
  const seller = existing
    ? await prisma.seller.update({ where: { id: existing.id }, data: { email: demoEmail, passwordHash, profileComplete: true } })
    : await prisma.seller.create({ data: { id: 2, name: 'Demo Seller', email: demoEmail, phone: '01700000000', passwordHash } });

  // Keep PostgreSQL's auto-increment sequence ahead of the seeded ID.
  await prisma.$executeRawUnsafe(`SELECT setval(pg_get_serial_sequence('"Seller"', 'id'), GREATEST((SELECT COALESCE(MAX(id), 1) FROM "Seller"), 1), true)`);
  console.log(`GetTally demo seller ready: ${seller.id}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}).finally(() => prisma.$disconnect());
