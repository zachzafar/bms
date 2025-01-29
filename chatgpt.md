1. Define Your Database Schema
Drizzle provides a TypeScript-based schema definition for MySQL.

Schema Definition (schema.ts)
typescript
Copy
Edit
import { mysqlTable, serial, varchar, text, decimal, date, boolean, int } from "drizzle-orm/mysql-core";

// Assets Table
export const assets = mysqlTable("assets", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  defaultPrice: decimal("default_price", { precision: 10, scale: 2 }).notNull(),
});

// Availability Table
export const availability = mysqlTable("availability", {
  id: serial("id").primaryKey(),
  assetId: int("asset_id").notNull().references(() => assets.id, { onDelete: "cascade" }),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  isAvailable: boolean("is_available").default(true),
});

// Bookings Table
export const bookings = mysqlTable("bookings", {
  id: serial("id").primaryKey(),
  assetId: int("asset_id").notNull().references(() => assets.id, { onDelete: "cascade" }),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  userId: int("user_id").notNull(), // Assuming a users table exists
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(),
});
2. Implement Business Logic
Drizzle allows you to query the database in a type-safe manner.

Check Availability
typescript
Copy
Edit
import { and, not, exists, eq, sql, between } from "drizzle-orm";
import { db } from "./db"; // Import your drizzle database instance
import { availability } from "./schema";

export async function checkAvailability(assetId: number, startDate: string, endDate: string): Promise<boolean> {
  const result = await db.select({ exists: sql`1` })
    .from(availability)
    .where(
      and(
        eq(availability.assetId, assetId),
        eq(availability.isAvailable, false),
        sql`(start_date, end_date) OVERLAPS (${startDate}, ${endDate})`
      )
    );

  return result.length === 0; // Returns TRUE if the asset is available
}
Calculate Total Price
typescript
Copy
Edit
import { sum, coalesce } from "drizzle-orm";
import { availability } from "./schema";

export async function calculatePrice(assetId: number, startDate: string, endDate: string): Promise<number> {
  const result = await db
    .select({ total: coalesce(sum(availability.price), 0) })
    .from(availability)
    .where(
      and(
        eq(availability.assetId, assetId),
        between(sql`${startDate}`, availability.startDate, availability.endDate)
      )
    );

  return result[0]?.total ?? 0;
}
Create Booking
typescript
Copy
Edit
import { bookings } from "./schema";

export async function createBooking(assetId: number, startDate: string, endDate: string, userId: number) {
  // Check availability
  const isAvailable = await checkAvailability(assetId, startDate, endDate);
  if (!isAvailable) {
    throw new Error("Asset is not available for the specified date range.");
  }

  // Calculate price
  const totalPrice = await calculatePrice(assetId, startDate, endDate);

  // Insert booking
  const [booking] = await db.insert(bookings).values({
    assetId,
    startDate,
    endDate,
    userId,
    totalPrice,
  }).returning({ id: bookings.id });

  return booking.id;
}
Add Availability Exception
typescript
Copy
Edit
export async function addAvailabilityException(assetId: number, startDate: string, endDate: string, price: number, isAvailable: boolean) {
  await db.insert(availability).values({
    assetId,
    startDate,
    endDate,
    price,
    isAvailable,
  });
}
3. Example Usage
typescript
Copy
Edit
async function main() {
  // Add an asset
  const assetId = await db.insert(assets).values({
    name: "Conference Room A",
    description: "A large conference room",
    defaultPrice: 100.00,
  }).returning({ id: assets.id });

  // Add availability rule
  await db.insert(availability).values({
    assetId: assetId.id,
    startDate: "2023-01-01",
    endDate: "2023-12-31",
    price: 100.00,
    isAvailable: true,
  });

  // Add an exception (unavailable on Christmas)
  await addAvailabilityException(assetId.id, "2023-12-25", "2023-12-25", 0, false);

  // Check availability
  const isAvailable = await checkAvailability(assetId.id, "2023-12-24", "2023-12-26");
  console.log("Available:", isAvailable); // Should print false

  // Create a booking
  try {
    const bookingId = await createBooking(assetId.id, "2023-12-01", "2023-12-07", 123);
    console.log("Booking ID:", bookingId);
  } catch (error) {
    console.error("Error creating booking:", error.message);
  }
}

main();