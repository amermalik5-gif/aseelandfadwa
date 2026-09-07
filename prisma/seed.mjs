import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const samples = [
  { code: "demoarabic1", name: "عائلة محمد العلي", maxGuests: 4, phone: "0791234567" },
  { code: "demoenglish", name: "Omar & Lina Haddad", maxGuests: 2, phone: null },
];

for (const s of samples) {
  await prisma.invitation.upsert({
    where: { code: s.code },
    create: s,
    update: {},
  });
}

console.log(`Seeded ${samples.length} demo invitations`);
await prisma.$disconnect();
