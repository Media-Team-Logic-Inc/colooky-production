import { GetServerSideProps } from 'next';

interface HealthProps {
  status: string;
  timestamp: string;
  environment: Record<string, string>;
}

export default function Health({ status, timestamp, environment }: HealthProps) {
  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>Health Check</h1>
      <p><strong>Status:</strong> {status}</p>
      <p><strong>Timestamp:</strong> {timestamp}</p>
      
      <h2>Environment Variables</h2>
      <pre style={{ background: '#f5f5f5', padding: '10px', borderRadius: '4px' }}>
        {JSON.stringify(environment, null, 2)}
      </pre>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async () => {
  console.log('🔧 Health check page loading...');
  
  const envVars = {
    NODE_ENV: process.env.NODE_ENV || 'undefined',
    NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'undefined',
    GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID ? 'present' : 'missing',
    GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET ? 'present' : 'missing',
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? 'present' : 'missing',
  };
  
  console.log('🔧 Environment check in health page:', envVars);
  
  return {
    props: {
      status: 'OK',
      timestamp: new Date().toISOString(),
      environment: envVars,
    },
  };
};