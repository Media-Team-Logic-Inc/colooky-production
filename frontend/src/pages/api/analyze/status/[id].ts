import type { NextApiRequest, NextApiResponse } from 'next';
import { getJobStatus } from '../../../../lib/analysisQueue';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id } = req.query;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Analysis ID is required' });
    }

    const jobStatus = await getJobStatus(id);

    if (!jobStatus) {
      return res.status(404).json({ error: 'Analysis job not found' });
    }

    const statusMap: Record<string, string> = {
      waiting: 'pending',
      active: 'analyzing',
      completed: 'completed',
      failed: 'error',
      delayed: 'pending',
      paused: 'pending',
    };

    return res.status(200).json({
      id: jobStatus.id,
      status: statusMap[jobStatus.state] ?? jobStatus.state,
      progress: jobStatus.progress,
      visualization: jobStatus.result?.visualization ?? null,
      summary: jobStatus.result?.summary ?? null,
      elements: jobStatus.result?.elements ?? null,
      dependencies: jobStatus.result?.dependencies ?? null,
      error_message: jobStatus.failedReason ?? null,
    });

  } catch (error) {
    console.error('Error getting analysis status:', error);
    return res.status(500).json({ error: 'Failed to get analysis status' });
  }
}
