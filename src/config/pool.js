import pg from 'pg';
const { Pool } = pg;


const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'dindin',
  password: '123456',
  port: 5432, 
});

export { pool };