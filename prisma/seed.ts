import { PrismaClient, Role  } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
    const hashed = await bcrypt.hash("password123", 10);

    await prisma.user.upsert({
        where:   { username: "alexsmith" },
        update:  {},
        create: {
            first_name:   "Alex",
            last_name:    "Smith",
            username:     "alexsmith",
            password:     hashed,
            phone_number: "081234567890",
            role:         Role.ADMIN,
        },
    });

    console.log("✅ Seeded test user: alexsmith / password123");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
