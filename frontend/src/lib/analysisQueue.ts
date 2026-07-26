import { Queue, Worker, Job } from 'bullmq';

function parseRedisConnection() {
  const url = process.env.REDIS_URL;
  if (url) {
    const parsed = new URL(url);
    return {
      host: parsed.hostname || 'localhost',
      port: parseInt(parsed.port || '6379', 10),
      password: parsed.password || undefined,
      username: parsed.username || undefined,
    };
  }
  return {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
  };
}

const connection = parseRedisConnection();

export type AnalysisJobData = {
  repository: string;
  files: string[];
  accessToken: string;
};

export type AnalysisJobResult = {
  visualization: any;
  summary: any;
  elements: any[];
  dependencies: any[];
};

// Queue is safe to instantiate per-module — BullMQ deduplicates connections
export const analysisQueue = new Queue<AnalysisJobData, AnalysisJobResult>('code-analysis', {
  connection,
  defaultJobOptions: {
    attempts: 2,
    backoff: { type: 'exponential', delay: 2000 },
    removeOnComplete: { age: 24 * 3600 }, // keep 24 h
    removeOnFail: { age: 24 * 3600 },
  },
});

// Singleton guard so Next.js hot-reload doesn't spawn multiple workers
let workerInstance: Worker | null = null;

export function ensureWorker(
  processor: (job: Job<AnalysisJobData, AnalysisJobResult>) => Promise<AnalysisJobResult>
): Worker {
  if (workerInstance) return workerInstance;
  workerInstance = new Worker<AnalysisJobData, AnalysisJobResult>(
    'code-analysis',
    processor,
    { connection, concurrency: 3 }
  );
  workerInstance.on('failed', (job, err) => {
    if (process.env.NODE_ENV !== 'production') {
      console.error(`Analysis job ${job?.id} failed:`, err.message);
    }
  });
  return workerInstance;
}

export async function getJobStatus(jobId: string) {
  const job = await analysisQueue.getJob(jobId);
  if (!job) return null;

  const state = await job.getState();
  const progress = typeof job.progress === 'number' ? job.progress : 0;

  return {
    id: job.id,
    state,
    progress,
    result: state === 'completed' ? (job.returnvalue as AnalysisJobResult | null) : null,
    failedReason: state === 'failed' ? job.failedReason : undefined,
  };
}
