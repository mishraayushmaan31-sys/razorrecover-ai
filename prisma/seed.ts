import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const merchant = await prisma.merchant.upsert({
    where: { slug: 'demo-merchant' },
    update: {},
    create: {
      id: 'merchant-demo-001',
      name: 'Demo Merchant',
      slug: 'demo-merchant',
      mode: 'DEMO',
      currency: 'INR',
      timezone: 'Asia/Kolkata',
      status: 'active',
      metadata: { environment: 'demo' },
    },
  });

  const role = await prisma.role.upsert({
    where: { merchantId_name: { merchantId: merchant.id, name: 'MERCHANT_ADMIN' } },
    update: {},
    create: {
      id: 'role-demo-admin',
      merchantId: merchant.id,
      name: 'OWNER',
      type: 'OWNER',
      description: 'Platform administrator for demo merchant',
    },
  });

  await prisma.user.upsert({
    where: { merchantId_email: { merchantId: merchant.id, email: 'admin@demo-merchant.com' } },
    update: {},
    create: {
      id: 'user-demo-admin',
      merchantId: merchant.id,
      roleId: role.id,
      email: 'admin@demo-merchant.com',
      name: 'Demo Admin',
      passwordHash: '$2a$12$5dQ1uZ0w9D0v3pD8FqJ6T.7k3vQ2j5Uq5r4m2n7M3Jw4Q5G6H7I8K',
      status: 'ACTIVE',
      metadata: { role: 'admin' },
    },
  });

  await prisma.policy.upsert({
    where: {
      merchantId_name_version: { merchantId: merchant.id, name: 'default-risk-gate', version: 1 },
    },
    update: {},
    create: {
      id: 'policy-demo-default',
      merchantId: merchant.id,
      name: 'default-risk-gate',
      type: 'RISK_THRESHOLD',
      scope: 'MERCHANT',
      version: 1,
      summary: 'Demo policy gate for revenue recovery safety checks.',
      isActive: true,
      rules: {
        maxRiskScore: 75,
        requireManualReview: true,
        allowDemoMode: true,
      },
    },
  });
}

main()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
