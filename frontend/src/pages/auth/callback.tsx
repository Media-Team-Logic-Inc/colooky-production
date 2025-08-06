import { GetServerSideProps } from 'next';
import Head from 'next/head';
import CallbackPage from '../../components/auth/CallbackPage';

export default function AuthCallback() {
  return (
    <>
      <Head>
        <title>Signing you in... - Colooky</title>
        <meta name="description" content="Completing your sign in to Colooky" />
      </Head>
      <CallbackPage />
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { code, error, state } = context.query;

  // Basic validation - detailed handling is done in the component
  if (!code && !error) {
    return {
      redirect: {
        destination: '/auth/signin',
        permanent: false,
      },
    };
  }

  return {
    props: {},
  };
};