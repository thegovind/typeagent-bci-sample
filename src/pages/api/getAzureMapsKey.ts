import { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const key = process.env.NEXT_PUBLIC_AZURE_MAPS_SUBSCRIPTION_KEY;
  
  if (!key) {
    return res.status(500).json({ error: 'Azure Maps key not configured' });
  }

  res.status(200).json({ key });
} 