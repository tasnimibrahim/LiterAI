import Database from 'better-sqlite3';
const db = new Database('db/literai.db');
const chats = db.prepare('SELECT id FROM chats LIMIT 1').all();
console.log('CHAT_ID:', chats[0].id);
