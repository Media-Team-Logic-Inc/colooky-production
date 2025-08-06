import { GetServerSideProps } from 'next';
import Head from 'next/head';
import SigninPage from '../../components/auth/SigninPage';

export default function SignIn() {
  return (
    <>
      <Head>
        <title>Sign In - Colooky</title>
        <meta name="description" content="Sign in to Colooky with GitHub" />
      </Head>
      <SigninPage />
    </>
  );
}

// Redirect if already authenticated
export const getServerSideProps: GetServerSideProps = async (context) => {
  // You can add server-side auth check here if needed
  return {
    props: {},
  };
};