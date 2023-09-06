import pg from 'pg';
const { Pool } = pg;
import dotenv from "dotenv";
dotenv.config();

const key = process.env.poolPassword;

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'dindin',
  password: key,
  port: 5432, 
});

export { pool };