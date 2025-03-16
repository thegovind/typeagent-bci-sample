import { NextApiRequest, NextApiResponse } from 'next';

interface BrainActivityRecord {
  timestamp: string;
  flowIntensity: number;
  heartRate: number;
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Generate mock data
  const record: BrainActivityRecord = {
    timestamp: new Date().toISOString(),
    flowIntensity: Math.floor(Math.random() * 100) + 50, // Random number between 50 and 150
    heartRate: Math.floor(Math.random() * 40) + 60, // Random number between 60 and 100
  };

  res.status(200).json(record);
} 