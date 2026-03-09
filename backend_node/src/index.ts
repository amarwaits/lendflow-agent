import path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: path.resolve(__dirname, '../.env') });
import { initDb } from './db';
import { createApp } from './app';

const PORT = parseInt(process.env.PORT || '8001', 10);

initDb();

const app = createApp();

app.listen(PORT, '0.0.0.0', () => {
  console.log(`LendFlow backend listening on http://0.0.0.0:${PORT}`);
});
