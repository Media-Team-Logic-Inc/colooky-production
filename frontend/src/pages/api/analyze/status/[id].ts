import type { NextApiRequest, NextApiResponse } from 'next';

// Import the same analysisJobs map from the repository.ts file
// In production, this would be in a shared store like Redis
declare global {
  var analysisJobs: Map<string, any>;
}

// Initialize global storage if it doesn't exist
if (!global.analysisJobs) {
  global.analysisJobs = new Map();
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id } = req.query;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Analysis ID is required' });
    }

    const job = global.analysisJobs.get(id);

    if (!job) {
      return res.status(404).json({ error: 'Analysis job not found' });
    }

    // Return the current status
    const response = {
      id: job.id,
      repository: job.repository,
      status: job.status,
      progress: job.progress,
      files_analyzed: job.files_analyzed,
      total_files: job.total_files,
      error_message: job.error_message,
      visualization: job.result?.visualization,
      summary: job.result?.summary
    };

    res.status(200).json(response);

  } catch (error) {
    console.error('Error getting analysis status:', error);
    res.status(500).json({ error: 'Failed to get analysis status' });
  }
}