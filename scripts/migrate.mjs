import { readFile } from 'node:fs/promises';
import { neon } from '@neondatabase/serverless';

if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required.');
const script = await readFile(new URL('../db/schema.sql', import.meta.url), 'utf8');
const statements = script.split(/(?=^(?:CREATE (?:TABLE|INDEX|OR REPLACE FUNCTION)|ALTER TABLE) )/m).filter(statement => statement.trim());
const sql = neon(process.env.DATABASE_URL);
await sql.transaction(statements.map(statement => sql.query(statement, [])));
console.log('Birthday Adda schema applied.');
