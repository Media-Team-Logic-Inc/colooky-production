import { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('🔧 Test API route called');
  console.log('🔧 Method:', req.method);
  console.log('🔧 URL:', req.url);
  console.log('🔧 Headers:', JSON.stringify(req.headers, null, 2));
  
  res.status(200).json({
    message: 'API route working',
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url,
  });
}