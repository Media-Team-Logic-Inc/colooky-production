import { useState } from 'react';
import { GetServerSideProps } from 'next';
import { getSession } from 'next-auth/react';
import Head from 'next/head';
import Header from '../components/layout/Header';
import { CreditCard, CheckCircle, Clock, Download, Star } from 'lucide-react';

interface BillingProps {
  user: any;
}

interface BillingHistory {
  id: string;
  date: string;
  amount: number;
  status: 'paid' | 'pending' | 'failed';
  plan: string;
  invoice_url?: string;
}

// Billing history - in production, fetch from Stripe/database
const mockBillingHistory: BillingHistory[] = [];

export default function Billing({ user }: BillingProps) {
  const [currentPlan] = useState('free'); // free, individual, team, or enterprise
  const [billingCycle] = useState('monthly'); // monthly or yearly
  const [paymentMethod] = useState(null); // No payment method initially

  // Stripe integration placeholder
  const handleUpgrade = async (planType: string) => {
    // TODO: Integrate with Stripe Checkout
    console.log('Upgrade to:', planType);
    // window.location.href = '/api/stripe/checkout?plan=' + planType;
  };

  const handleManageSubscription = () => {
    // TODO: Redirect to Stripe Customer Portal
    console.log('Manage subscription via Stripe');
    // window.location.href = '/api/stripe/portal';
  };

  const plans = {
    free: {
      name: 'Free',
      price: 0,
      features: [
        '3 repositories',
        'Basic visualizations',
        'Community support'
      ]
    },
    individual: {
      name: 'Individual',
      price: 19,
      features: [
        '10 repositories',
        'Standard visualizations',
        'Export PNG/SVG',
        'Email support'
      ]
    },
    team: {
      name: 'Team',
      price: 49,
      features: [
        '50 repositories',
        'Advanced visualizations',
        'Team sharing & collaboration',
        'Priority support'
      ]
    },
    enterprise: {
      name: 'Enterprise',
      price: 199,
      features: [
        'Unlimited repositories',
        'Custom branding & themes',
        'SSO & advanced security',
        'Dedicated support manager'
      ]
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-400" />;
      case 'failed':
        return <Star className="w-4 h-4 text-red-400" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <>
      <Head>
        <title>Billing & Subscription - Colooky</title>
        <meta name="description" content="Manage your Colooky subscription and billing" />
      </Head>
      
      <div className="min-h-screen bg-slate-900">
        <Header />
        
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <CreditCard className="w-8 h-8 text-blue-400" />
              Billing & Subscription
            </h1>
            <p className="text-slate-400 mt-2">
              Manage your subscription, payment methods, and billing history
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Current Plan */}
            <div className="lg:col-span-2">
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 mb-6">
                <h2 className="text-xl font-semibold text-white mb-4">Current Plan</h2>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-blue-400">
                      {plans[currentPlan as keyof typeof plans].name} Plan
                    </h3>
                    <p className="text-slate-400">
                      ${plans[currentPlan as keyof typeof plans].price}/{billingCycle === 'monthly' ? 'month' : 'year'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-slate-400">Next billing date</p>
                    <p className="text-white font-semibold">
                      {currentPlan === 'free' ? 'N/A - Free Plan' : 'TBD - Set up billing'}
                    </p>
                  </div>
                </div>
                
                <div className="border-t border-slate-600 pt-4">
                  <h4 className="text-sm font-semibold text-white mb-2">Plan includes:</h4>
                  <ul className="space-y-1">
                    {plans[currentPlan as keyof typeof plans].features.map((feature, index) => (
                      <li key={index} className="text-sm text-slate-300 flex items-center gap-2">
                        <CheckCircle className="w-3 h-3 text-green-400 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex gap-3 mt-6">
                  {currentPlan === 'free' ? (
                    <button 
                      onClick={() => handleUpgrade('individual')}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      Upgrade to Individual
                    </button>
                  ) : (
                    <>
                      <button 
                        onClick={handleManageSubscription}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                      >
                        Manage Subscription
                      </button>
                      <button className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium transition-colors">
                        Cancel Subscription
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Billing History */}
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-white mb-4">Billing History</h2>
                <div className="space-y-4">
                  {mockBillingHistory.length > 0 ? mockBillingHistory.map((invoice) => (
                    <div 
                      key={invoice.id}
                      className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg"
                    >
                      <div className="flex items-center gap-4">
                        <div>{getStatusIcon(invoice.status)}</div>
                        <div>
                          <p className="text-white font-medium">${invoice.amount.toFixed(2)}</p>
                          <p className="text-sm text-slate-400">{formatDate(invoice.date)} • {invoice.plan}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          invoice.status === 'paid' 
                            ? 'bg-green-900/30 text-green-400'
                            : invoice.status === 'pending'
                            ? 'bg-yellow-900/30 text-yellow-400'
                            : 'bg-red-900/30 text-red-400'
                        }`}>
                          {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                        </span>
                        {invoice.invoice_url && (
                          <button className="p-2 text-slate-400 hover:text-white transition-colors">
                            <Download className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  )) : (
                    <div className="text-center py-8">
                      <p className="text-slate-400 mb-2">No billing history yet</p>
                      <p className="text-sm text-slate-500">Your invoices will appear here after your first payment</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="lg:col-span-1">
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 mb-6">
                <h2 className="text-xl font-semibold text-white mb-4">Payment Method</h2>
                {paymentMethod ? (
                  <>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-6 bg-gradient-to-r from-blue-600 to-purple-600 rounded flex items-center justify-center">
                        <span className="text-xs font-bold text-white uppercase">
                          {paymentMethod.brand}
                        </span>
                      </div>
                      <div>
                        <p className="text-white font-medium">
                          •••• •••• •••• {paymentMethod.last4}
                        </p>
                        <p className="text-sm text-slate-400">Expires {paymentMethod.expires}</p>
                      </div>
                    </div>
                    <button className="w-full px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium transition-colors">
                      Update Payment Method
                    </button>
                  </>
                ) : (
                  <div className="text-center py-6">
                    <CreditCard className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                    <p className="text-slate-400 mb-3">No payment method on file</p>
                    <button 
                      onClick={() => handleUpgrade('individual')}
                      className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      Add Payment Method
                    </button>
                  </div>
                )}
              </div>

              {/* Usage Summary */}
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-white mb-4">This Month</h2>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Repositories analyzed</span>
                    <span className="text-white font-semibold">23/50</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Visualizations created</span>
                    <span className="text-white font-semibold">45</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Team members</span>
                    <span className="text-white font-semibold">3/5</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Storage used</span>
                    <span className="text-white font-semibold">2.1 GB</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getSession(context);
  
  if (!session) {
    return {
      redirect: {
        destination: '/auth/signin',
        permanent: false,
      },
    };
  }
  
  return {
    props: {
      user: session.user,
    },
  };
};