import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const session = await getSession({ req });
  if (!session?.accessToken) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { params } = req.query;
  if (!params || !Array.isArray(params) || params.length < 2) {
    return res.status(400).json({ error: 'Missing owner and repo parameters' });
  }

  const [owner, repo] = params;

  try {
    // Fetch repository tree from GitHub API
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/git/trees/HEAD?recursive=1`,
      {
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
          Accept: 'application/vnd.github.v3+json',
          'User-Agent': 'Colooky-Production'
        }
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    // Filter out non-essential files and limit depth to prevent huge trees
    const filteredTree = data.tree?.filter((item: any) => {
      // Skip common non-essential directories and files
      const skipPatterns = [
        /^node_modules/,
        /^\.git/,
        /^\.next/,
        /^\.vercel/,
        /^dist/,
        /^build/,
        /^out/,
        /^coverage/,
        /\.map$/,
        /\.min\./,
        /\.lock$/,
        /package-lock\.json$/,
        /yarn\.lock$/
      ];
      
      // Skip if too deep (more than 4 levels)
      const depth = item.path.split('/').length;
      if (depth > 4) return false;
      
      return !skipPatterns.some(pattern => pattern.test(item.path));
    }) || [];

    res.status(200).json({
      tree: filteredTree,
      truncated: data.truncated,
      sha: data.sha
    });

  } catch (error) {
    console.error('Error fetching repository tree:', error);
    res.status(500).json({ 
      error: 'Failed to fetch repository tree',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}