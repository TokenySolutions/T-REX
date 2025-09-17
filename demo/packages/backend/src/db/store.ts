import Database from 'better-sqlite3';

export const db = new Database('poc.db');
db.pragma('journal_mode = WAL');

db.exec(`
CREATE TABLE IF NOT EXISTS config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
  address VARCHAR(42) PRIMARY KEY,
  identityAddress VARCHAR(42),
  createdAt INTEGER DEFAULT (strftime('%s','now'))
);


CREATE TABLE IF NOT EXISTS assets (
  owner VARCHAR(42) NOT NULL,
  name VARCHAR(255) NOT NULL,
  symbol VARCHAR(20) NOT NULL,
  supply INTEGER NOT NULL,
  chainId INTEGER NOT NULL,
  token VARCHAR(42) PRIMARY KEY,
  identityRegistry VARCHAR(42) NOT NULL,
  compliance VARCHAR(42) NOT NULL,
  agentManager VARCHAR(42) NOT NULL,
  createdAt INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS events (
  txHash CHAR(66) PRIMARY KEY,
  assetId TEXT,
  block INTEGER,
  logIndex INTEGER,
  type TEXT,
  payload TEXT
);
`);

export const setCfg = db.prepare('REPLACE INTO config(key,value) VALUES(?,?)');

export const getCfg = (k: string) => {
  const row = db.prepare('SELECT value FROM config WHERE key=?').get(k) as { value: string } | undefined;
  return row?.value;
};

export const putAsset = db.prepare(`
REPLACE INTO assets(owner,name,symbol,supply,chainId,token,identityRegistry,compliance,agentManager,createdAt)
VALUES (?,?,?,?,?,?,?,?,?,?)`);

export const getAsset = db.prepare('SELECT * FROM assets WHERE token=?');

export const listAssetsByOwner = db.prepare('SELECT token, symbol, name ,supply FROM assets WHERE owner=?');

export const getUser = db.prepare('SELECT * FROM users WHERE address=?');

export const putUser = db.prepare('REPLACE INTO users(address, identityAddress, createdAt) VALUES (?,?,?)');
export const putEvent = db.prepare('INSERT INTO events(assetId,block,txHash,logIndex,type,payload) VALUES (?,?,?,?,?,?)');
