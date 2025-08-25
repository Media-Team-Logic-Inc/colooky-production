import { NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { ArrowLeft, Shield, Eye, Database, Users, Lock, Globe, Mail } from 'lucide-react';

const PrivacyPolicy: NextPage = () => {
  return (
    <>
      <Head>
        <title>Privacy Policy - Colooky</title>
        <meta name="description" content="Privacy Policy for Colooky - Code Visualization Platform" />
      </Head>

      <div className="min-h-screen bg-slate-900 text-white">
        {/* Header */}
        <div className="bg-slate-800 border-b border-slate-700">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center gap-4">
              <Link href="/" className="text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back to Home
              </Link>
            </div>
            <div className="mt-4">
              <div className="flex items-center gap-3 mb-2">
                <Shield className="w-6 h-6 text-green-400" />
                <h1 className="text-3xl font-bold text-white">Privacy Policy</h1>
              </div>
              <p className="text-slate-400">How we protect and handle your data</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="prose prose-invert max-w-none">
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 mb-8">
              <p className="text-slate-300 text-sm mb-4">
                <strong>Effective Date:</strong> August 23, 2025
              </p>
              <p className="text-slate-300 text-sm">
                <strong>Last Updated:</strong> August 23, 2025
              </p>
            </div>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                <Eye className="w-5 h-5 text-blue-400" />
                1. Information We Collect
              </h2>
              
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-3">1.1 Account Information</h3>
                <ul className="list-disc list-inside text-slate-300 space-y-2 mb-6">
                  <li>GitHub account details (username, email, profile information)</li>
                  <li>OAuth tokens for accessing your repositories</li>
                  <li>Subscription and billing information</li>
                </ul>

                <h3 className="text-lg font-semibold text-white mb-3">1.2 Repository Data</h3>
                <ul className="list-disc list-inside text-slate-300 space-y-2 mb-6">
                  <li>Source code from repositories you choose to analyze</li>
                  <li>File structure and metadata</li>
                  <li>Analysis results and visualizations you generate</li>
                </ul>

                <h3 className="text-lg font-semibold text-white mb-3">1.3 Usage Information</h3>
                <ul className="list-disc list-inside text-slate-300 space-y-2">
                  <li>Platform usage statistics and analytics</li>
                  <li>Error logs and performance data</li>
                  <li>Feature usage and preferences</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                <Database className="w-5 h-5 text-purple-400" />
                2. How We Use Your Information
              </h2>
              
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
                <ul className="list-disc list-inside text-slate-300 space-y-3">
                  <li><strong>Code Analysis:</strong> Process your source code to generate visualizations and insights</li>
                  <li><strong>Platform Operation:</strong> Provide, maintain, and improve our services</li>
                  <li><strong>Account Management:</strong> Manage your subscription and billing</li>
                  <li><strong>Communication:</strong> Send important updates and support responses</li>
                  <li><strong>Analytics:</strong> Understand usage patterns to improve our platform</li>
                  <li><strong>Security:</strong> Detect and prevent fraud, abuse, and security issues</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-green-400" />
                3. Information Sharing
              </h2>
              
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
                <p className="text-slate-300 mb-4">We do not sell, rent, or share your personal information with third parties except in the following cases:</p>
                
                <h3 className="text-lg font-semibold text-white mb-3">3.1 Service Providers</h3>
                <ul className="list-disc list-inside text-slate-300 space-y-2 mb-6">
                  <li><strong>GitHub:</strong> For authentication and repository access</li>
                  <li><strong>Stripe:</strong> For payment processing</li>
                  <li><strong>Supabase:</strong> For data storage and management</li>
                  <li><strong>Railway:</strong> For hosting and deployment</li>
                </ul>

                <h3 className="text-lg font-semibold text-white mb-3">3.2 Legal Requirements</h3>
                <p className="text-slate-300">We may disclose information if required by law, court order, or to protect our rights and safety.</p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                <Lock className="w-5 h-5 text-yellow-400" />
                4. Data Security
              </h2>
              
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
                <ul className="list-disc list-inside text-slate-300 space-y-3">
                  <li><strong>Encryption:</strong> All data is encrypted in transit and at rest</li>
                  <li><strong>Access Controls:</strong> Strict access controls and authentication</li>
                  <li><strong>Regular Audits:</strong> Security reviews and vulnerability assessments</li>
                  <li><strong>Data Isolation:</strong> Your code and data are isolated from other users</li>
                  <li><strong>Secure Infrastructure:</strong> Hosted on secure, compliant platforms</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-4">5. Data Retention</h2>
              
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
                <ul className="list-disc list-inside text-slate-300 space-y-3">
                  <li><strong>Active Accounts:</strong> Data retained while your account is active</li>
                  <li><strong>Analysis History:</strong> Saved analyses retained per your preferences</li>
                  <li><strong>Account Deletion:</strong> Data deleted within 30 days of account deletion</li>
                  <li><strong>Legal Compliance:</strong> Some data may be retained longer for legal requirements</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-4">6. Your Rights</h2>
              
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
                <p className="text-slate-300 mb-4">You have the right to:</p>
                <ul className="list-disc list-inside text-slate-300 space-y-2">
                  <li>Access your personal data</li>
                  <li>Correct inaccurate data</li>
                  <li>Delete your account and data</li>
                  <li>Export your data</li>
                  <li>Restrict processing</li>
                  <li>Object to processing</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                <Globe className="w-5 h-5 text-cyan-400" />
                7. International Transfers
              </h2>
              
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
                <p className="text-slate-300">
                  Your data may be processed in countries other than your own. We ensure appropriate safeguards 
                  are in place to protect your data in accordance with this privacy policy.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-4">8. Updates to This Policy</h2>
              
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
                <p className="text-slate-300">
                  We may update this privacy policy from time to time. We will notify you of any material 
                  changes by email or through our platform. Your continued use constitutes acceptance of the updated policy.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                <Mail className="w-5 h-5 text-green-400" />
                9. Contact Us
              </h2>
              
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
                <p className="text-slate-300 mb-4">
                  If you have any questions about this privacy policy or our data practices, please contact us:
                </p>
                <ul className="list-disc list-inside text-slate-300 space-y-2">
                  <li><strong>Email:</strong> flolooky@gmail.com</li>
                  <li><strong>Company:</strong> Media Team Logic Inc</li>
                  <li><strong>Platform:</strong> <Link href="/" className="text-blue-400 hover:text-blue-300">colooky.com</Link></li>
                </ul>
              </div>
            </section>

            <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-6 mt-8">
              <p className="text-blue-300 text-sm">
                <strong>Note:</strong> This privacy policy applies specifically to the Colooky code visualization platform 
                and our handling of your data. For GitHub-specific data handling, please refer to GitHub's privacy policy.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default PrivacyPolicy;