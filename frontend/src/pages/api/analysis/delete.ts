import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import { deleteAnalysisHistory } from '../../../lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await getSession({ req });
    if (!session?.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { analysisId } = req.body;
    
    if (!analysisId) {
      return res.status(400).json({ error: 'Analysis ID is required' });
    }

    const success = await deleteAnalysisHistory(analysisId);
    
    if (!success) {
      return res.status(500).json({ error: 'Failed to delete analysis' });
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error deleting analysis:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}