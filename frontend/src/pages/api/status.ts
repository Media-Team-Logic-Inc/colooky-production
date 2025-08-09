import { NextApiRequest, NextApiResponse } from 'next';

console.log('🔧 Status API route loading...');

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('🔧 Status endpoint called');
  
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    nodeVersion: process.version,
    platform: process.platform,
    uptime: process.uptime(),
  });
}