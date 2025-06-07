import { workerData } from 'node:worker_threads';

await import(workerData.__ts_worker_filename);
