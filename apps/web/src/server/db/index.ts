import { drizzle } from "drizzle-orm/mysql2";
import mysql from 'mysql2/promise'
import * as shcema from "@repo/drizzle"

const connection = await mysql.createConnection(process.env.DATABASE_URL as string)

export const db = drizzle(connection);


