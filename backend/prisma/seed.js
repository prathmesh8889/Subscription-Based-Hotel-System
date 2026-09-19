"use strict";
// ============================================================
// DATABASE SEED SCRIPT
// ============================================================
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('🌱 Starting database seed...\n');
    // Create Super Admin
    const superAdminEmail = process.env.SUPER_ADMIN_EMAIL || 'admin@platform.com';
    const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD || 'ChangeThisPassword123!';
    const existingSuperAdmin = await prisma.user.findUnique({
        where: { email: superAdminEmail },
    });
    if (existingSuperAdmin) {
        console.log('⚠️  Super Admin already exists, skipping...');
    }
    else {
        const hashedPassword = await bcryptjs_1.default.hash(superAdminPassword, 10);
        const superAdmin = await prisma.user.create({
            data: {
                email: superAdminEmail,
                password: hashedPassword,
                name: 'Platform Admin',
                role: 'SUPER_ADMIN',
                hotelId: null,
                isActive: true,
            },
        });
        console.log('✅ Super Admin created:');
        console.log(`   Email: ${superAdmin.email}`);
        console.log(`   Password: ${superAdminPassword}`);
        console.log('   ⚠️  Change this password immediately!\n');
    }
    // Create Demo Hotel
    const existingHotel = await prisma.hotel.findFirst({
        where: { name: 'Taj Palace Restaurant' },
    });
    if (existingHotel) {
        console.log('⚠️  Demo hotel already exists, skipping...');
    }
    else {
        const hotel = await prisma.hotel.create({
            data: {
                name: 'Taj Palace Restaurant',
                address: '123 MG Road, Bangalore',
                phone: '+91 98765 43210',
                email: 'info@tajpalace.com',
                subscriptionPlan: 'PRO',
                subscriptionStart: new Date(),
                subscriptionEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
                isActive: true,
                maxTables: 25,
                maxMenuItems: 150,
                maxStaff: 15,
            },
        });
        console.log('✅ Demo Hotel created:');
        console.log(`   Name: ${hotel.name}`);
        console.log(`   Plan: ${hotel.subscriptionPlan}`);
        console.log(`   ID: ${hotel.id}\n`);
        // Create Hotel Owner
        const ownerPassword = 'Owner@123';
        const hashedOwnerPassword = await bcryptjs_1.default.hash(ownerPassword, 10);
        const owner = await prisma.user.create({
            data: {
                email: 'owner@tajpalace.com',
                password: hashedOwnerPassword,
                name: 'Rajesh Kumar',
                role: 'OWNER',
                hotelId: hotel.id,
                isActive: true,
            },
        });
        console.log('✅ Hotel Owner created:');
        console.log(`   Email: ${owner.email}`);
        console.log(`   Password: ${ownerPassword}\n`);
        // Create Kitchen Staff
        const kitchenPassword = 'Kitchen@123';
        const hashedKitchenPassword = await bcryptjs_1.default.hash(kitchenPassword, 10);
        const kitchen = await prisma.user.create({
            data: {
                email: 'kitchen@tajpalace.com',
                password: hashedKitchenPassword,
                name: 'Chef Anil',
                role: 'KITCHEN',
                hotelId: hotel.id,
                isActive: true,
            },
        });
        console.log('✅ Kitchen Staff created:');
        console.log(`   Email: ${kitchen.email}`);
        console.log(`   Password: ${kitchenPassword}\n`);
        // Create Waiter
        const waiterPassword = 'Waiter@123';
        const hashedWaiterPassword = await bcryptjs_1.default.hash(waiterPassword, 10);
        const waiter = await prisma.user.create({
            data: {
                email: 'waiter@tajpalace.com',
                password: hashedWaiterPassword,
                name: 'Suresh',
                role: 'WAITER',
                hotelId: hotel.id,
                isActive: true,
            },
        });
        console.log('✅ Waiter created:');
        console.log(`   Email: ${waiter.email}`);
        console.log(`   Password: ${waiterPassword}\n`);
    }
    console.log('🎉 Database seeding completed!\n');
}
main()
    .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map