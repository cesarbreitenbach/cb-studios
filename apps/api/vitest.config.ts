import { defineConfig } from 'vitest/config';

// Tests share a single Postgres test database and TRUNCATE it between cases,
// so test files must not run in parallel — otherwise one file's resetDb wipes
// another file's data mid-run. Run files sequentially in a single worker.
export default defineConfig({
  test: {
    fileParallelism: false,
    sequence: { concurrent: false },
    pool: 'threads',
    poolOptions: { threads: { singleThread: true } },
  },
});
