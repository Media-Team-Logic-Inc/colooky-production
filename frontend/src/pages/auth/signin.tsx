import { GetServerSideProps } from 'next';
import Head from 'next/head';
import { getProviders, signIn, getSession } from 'next-auth/react';
import { Github } from 'lucide-react';

interface SignInProps {
  providers: any;
}

export default function SignIn({ providers }: SignInProps) {
  console.log('🔧 SignIn page providers:', providers);
  
  return (
    <>
      <Head>
        <title>Sign In - Colooky</title>
        <meta name="description" content="Sign in to Colooky with GitHub" />
      </Head>
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 flex items-center justify-center">
        <div className="max-w-md w-full space-y-8 p-8">
          <div className="text-center">
            <h2 className="mt-6 text-3xl font-extrabold text-white">
              Sign in to Colooky
            </h2>
            <p className="mt-2 text-sm text-gray-300">
              Connect with GitHub to get started
            </p>
          </div>
          
          <div className="mt-8 space-y-6">
            {providers && Object.values(providers).map((provider: any) => (
              <div key={provider.name}>
                <button
                  onClick={() => {
                    console.log('🔧 Signing in with provider:', provider);
                    signIn(provider.id, { callbackUrl: '/dashboard' });
                  }}
                  className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <Github className="w-5 h-5 mr-2" />
                  Sign in with {provider.name}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getSession(context);
  
  if (session) {
    return {
      redirect: {
        destination: '/dashboard',
        permanent: false,
      },
    };
  }
  
  const providers = await getProviders();
  console.log('🔧 Server-side providers:', providers);
  
  return {
    props: {
      providers: providers ?? {},
    },
  };
};