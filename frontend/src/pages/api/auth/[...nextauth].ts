import { NextApiRequest, NextApiResponse } from 'next';

console.log('🔧 NextAuth API route loading...');

// Temporarily disable NextAuth to test if it's causing the crash
const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  console.log('🔧 NextAuth fallback request:', req.method, req.url);
  console.log('🔧 NextAuth fallback query:', req.query);
  
  res.status(501).json({ 
    error: 'NextAuth temporarily disabled for debugging',
    message: 'Testing container stability'
  });
};

console.log('🔧 NextAuth fallback handler created');

export default handler;