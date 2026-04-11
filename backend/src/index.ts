import { createApp } from './app';
import { env, assertProductionConfig } from './config/env';
import { connectDb } from './db/connect';

assertProductionConfig();

async function main() {
  await connectDb();
  const app = createApp();
  app.listen(env.port, () => {
    console.log(`Server running at http://localhost:${env.port}`);
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
