import mariadb from 'mariadb';

const pool = mariadb.createPool({
  host: 'localhost',
  user: 'admin',
  password: 'admin@321',
  database: 'schedulify',
  connectionLimit: 10,
  allowPublicKeyRetrieval: true
});

export default pool;
