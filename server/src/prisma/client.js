const { PrismaClient } = require('@prisma/client');

// Append connection resilience params if not already present
function buildDatasourceUrl() {
  const base = process.env.DATABASE_URL || '';
  if (!base || base.includes('connect_timeout')) return base;
  const sep = base.includes('?') ? '&' : '?';
  // connect_timeout: how long to wait for a new connection (seconds)
  // pool_timeout: how long to wait for a connection from the pool (seconds)
  // socket_timeout: how long to wait for a response from the DB (seconds)
  return `${base}${sep}connect_timeout=30&pool_timeout=15&socket_timeout=60`;
}

function createClient() {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    datasources: {
      db: { url: buildDatasourceUrl() },
    },
  });
}

let prisma;

if (process.env.NODE_ENV === 'production') {
  prisma = createClient();
} else {
  if (!global.__prisma) {
    global.__prisma = createClient();
  }
  prisma = global.__prisma;
}

module.exports = prisma;
