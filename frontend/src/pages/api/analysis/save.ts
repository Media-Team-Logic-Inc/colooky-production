import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../lib/auth';
import { saveAnalysisHistory, AnalysisHistory } from '../../../lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const analysisData = req.body as Partial<AnalysisHistory>;
    
    // Ensure user_id matches the authenticated user
    analysisData.user_id = (session.user as any).id;

    const savedAnalysis = await saveAnalysisHistory(analysisData);
    
    if (!savedAnalysis) {
      return res.status(500).json({ error: 'Failed to save analysis' });
    }

    res.status(200).json(savedAnalysis);
  } catch (error) {
    console.error('Error saving analysis:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}