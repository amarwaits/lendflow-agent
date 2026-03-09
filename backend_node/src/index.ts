import 'dotenv/config';
import { initDb } from './db';
import { createApp } from './app';

const PORT = parseInt(process.env.PORT || '8001', 10);

initDb();

const app = createApp();

app.listen(PORT, '0.0.0.0', () => {
  console.log(`LendFlow backend listening on http://0.0.0.0:${PORT}`);
});
