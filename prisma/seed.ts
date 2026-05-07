import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcrypt";
import fs from "fs";
import path from "path";
import { config as loadEnv } from "dotenv";

loadEnv({ path: ".env.local" });
loadEnv();

const connectionString =
  process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL_UNPOOLED or DATABASE_URL must be set");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

const SEED_PASSWORD = "password123";
const dataDir = path.join(__dirname, "seedData");

function readJson<T>(file: string): T {
  return JSON.parse(fs.readFileSync(path.join(dataDir, file), "utf-8")) as T;
}

async function deleteAllData() {
  await prisma.payment.deleteMany();
  await prisma.application.deleteMany();
  await prisma.lease.deleteMany();
  await prisma.property.deleteMany();
  await prisma.tenant.deleteMany();
  await prisma.manager.deleteMany();
  await prisma.user.deleteMany();
  await prisma.location.deleteMany();
}

async function resetIntSequence(table: string) {
  await prisma.$executeRawUnsafe(
    `SELECT setval(pg_get_serial_sequence('"${table}"', 'id'), coalesce(max(id), 0) + 1, false) FROM "${table}";`,
  );
}

type LocationRow = {
  id: number;
  country: string;
  city: string;
  state: string;
  address: string;
  postalCode: string;
  coordinates: string;
};

async function seedLocations() {
  const locations = readJson<LocationRow[]>("location.json");
  for (const loc of locations) {
    await prisma.$executeRaw`
      INSERT INTO "Location" ("id", "country", "city", "state", "address", "postalCode", "coordinates")
      VALUES (${loc.id}, ${loc.country}, ${loc.city}, ${loc.state}, ${loc.address}, ${loc.postalCode}, ST_GeomFromText(${loc.coordinates}, 4326));
    `;
  }
  await resetIntSequence("Location");
}

type ManagerRow = {
  id: number;
  cognitoId: string;
  name: string;
  email: string;
  phoneNumber: string;
};

async function seedManagers(): Promise<Map<string, string>> {
  const managers = readJson<ManagerRow[]>("manager.json");
  const passwordHash = await bcrypt.hash(SEED_PASSWORD, 10);
  const map = new Map<string, string>();
  for (const m of managers) {
    const user = await prisma.user.create({
      data: {
        email: m.email,
        username: m.name,
        passwordHash,
        role: "manager",
        manager: {
          create: {
            name: m.name,
            email: m.email,
            phoneNumber: m.phoneNumber,
          },
        },
      },
    });
    map.set(m.cognitoId, user.id);
  }
  return map;
}

type PropertyRow = {
  id: number;
  postedDate?: string;
  managerCognitoId: string;
  [key: string]: unknown;
};

async function seedProperties(managerMap: Map<string, string>) {
  const properties = readJson<PropertyRow[]>("property.json");
  for (const p of properties) {
    const { managerCognitoId, postedDate, ...rest } = p;
    const managerId = managerMap.get(managerCognitoId);
    if (!managerId) {
      throw new Error(`Unknown manager cognitoId: ${managerCognitoId}`);
    }
    await prisma.property.create({
      data: {
        ...(rest as object),
        ...(postedDate ? { postedDate: new Date(postedDate) } : {}),
        managerId,
      } as never,
    });
  }
  await resetIntSequence("Property");
}

type TenantRow = {
  id: number;
  cognitoId: string;
  name: string;
  email: string;
  phoneNumber: string;
  properties?: { connect: { id: number }[] };
  favorites?: { connect: { id: number }[] };
};

async function seedTenants(): Promise<Map<string, string>> {
  const tenants = readJson<TenantRow[]>("tenant.json");
  const passwordHash = await bcrypt.hash(SEED_PASSWORD, 10);
  const map = new Map<string, string>();
  for (const t of tenants) {
    const tenantCreate: Record<string, unknown> = {
      name: t.name,
      email: t.email,
      phoneNumber: t.phoneNumber,
    };
    if (t.properties) tenantCreate.properties = t.properties;
    if (t.favorites) tenantCreate.favorites = t.favorites;
    const user = await prisma.user.create({
      data: {
        email: t.email,
        username: t.name,
        passwordHash,
        role: "tenant",
        tenant: { create: tenantCreate as never },
      },
    });
    map.set(t.cognitoId, user.id);
  }
  return map;
}

type LeaseRow = {
  id: number;
  startDate: string;
  endDate: string;
  rent: number;
  deposit: number;
  propertyId: number;
  tenantCognitoId: string;
};

async function seedLeases(tenantMap: Map<string, string>) {
  const leases = readJson<LeaseRow[]>("lease.json");
  for (const l of leases) {
    const { tenantCognitoId, startDate, endDate, ...rest } = l;
    const tenantId = tenantMap.get(tenantCognitoId);
    if (!tenantId) {
      throw new Error(`Unknown tenant cognitoId: ${tenantCognitoId}`);
    }
    await prisma.lease.create({
      data: {
        ...rest,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        tenantId,
      },
    });
  }
  await resetIntSequence("Lease");
}

type ApplicationRow = {
  id: number;
  applicationDate: string;
  status: "Pending" | "Denied" | "Approved";
  propertyId: number;
  tenantCognitoId: string;
  name: string;
  email: string;
  phoneNumber: string;
  message?: string;
  leaseId?: number;
};

async function seedApplications(tenantMap: Map<string, string>) {
  const apps = readJson<ApplicationRow[]>("application.json");
  for (const a of apps) {
    const { tenantCognitoId, applicationDate, ...rest } = a;
    const tenantId = tenantMap.get(tenantCognitoId);
    if (!tenantId) {
      throw new Error(`Unknown tenant cognitoId: ${tenantCognitoId}`);
    }
    await prisma.application.create({
      data: {
        ...rest,
        applicationDate: new Date(applicationDate),
        tenantId,
      },
    });
  }
  await resetIntSequence("Application");
}

type PaymentRow = {
  amountDue: number;
  amountPaid: number;
  dueDate: string;
  paymentDate: string;
  paymentStatus: "Pending" | "Paid" | "PartiallyPaid" | "Overdue";
  lease: { connect: { id: number } };
};

async function seedPayments() {
  const payments = readJson<PaymentRow[]>("payment.json");
  for (const p of payments) {
    await prisma.payment.create({
      data: {
        ...p,
        dueDate: new Date(p.dueDate),
        paymentDate: new Date(p.paymentDate),
      },
    });
  }
  await resetIntSequence("Payment");
}

async function main() {
  console.log("Clearing existing data...");
  await deleteAllData();

  console.log("Seeding locations...");
  await seedLocations();

  console.log("Seeding managers...");
  const managerMap = await seedManagers();

  console.log("Seeding properties...");
  await seedProperties(managerMap);

  console.log("Seeding tenants...");
  const tenantMap = await seedTenants();

  console.log("Seeding leases...");
  await seedLeases(tenantMap);

  console.log("Seeding applications...");
  await seedApplications(tenantMap);

  console.log("Seeding payments...");
  await seedPayments();

  const propertyCount = await prisma.property.count();
  console.log(`Done. ${propertyCount} properties seeded.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
