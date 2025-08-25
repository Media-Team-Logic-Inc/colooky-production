import { NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { ArrowLeft, FileText, Scale, Shield, AlertTriangle, CreditCard, Ban, RefreshCw } from 'lucide-react';

const TermsOfService: NextPage = () => {
  return (
    <>
      <Head>
        <title>Terms of Service - Colooky</title>
        <meta name="description" content="Terms of Service for Colooky - Code Visualization Platform" />
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
                <FileText className="w-6 h-6 text-blue-400" />
                <h1 className="text-3xl font-bold text-white">Terms of Service</h1>
              </div>
              <p className="text-slate-400">Legal terms and conditions for using Colooky</p>
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
                <Scale className="w-5 h-5 text-green-400" />
                1. Acceptance of Terms
              </h2>
              
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
                <p className="text-slate-300 mb-4">
                  By accessing or using Colooky ("the Service"), provided by Media Team Logic Inc ("we," "us," or "our"), 
                  you agree to be bound by these Terms of Service ("Terms"). If you disagree with any part of these terms, 
                  you may not access the Service.
                </p>
                <p className="text-slate-300">
                  These Terms apply to all visitors, users, and others who access or use the Service.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-4">2. Description of Service</h2>
              
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
                <p className="text-slate-300 mb-4">
                  Colooky is a code visualization platform that allows users to:
                </p>
                <ul className="list-disc list-inside text-slate-300 space-y-2">
                  <li>Connect their GitHub repositories</li>
                  <li>Analyze source code structure and dependencies</li>
                  <li>Generate interactive visualizations</li>
                  <li>Export analysis results and visualizations</li>
                  <li>Save and manage analysis history</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-4">3. User Accounts</h2>
              
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-3">3.1 Account Creation</h3>
                <ul className="list-disc list-inside text-slate-300 space-y-2 mb-6">
                  <li>You must have a valid GitHub account to use our Service</li>
                  <li>You must provide accurate and complete information</li>
                  <li>You are responsible for maintaining account security</li>
                  <li>You must be at least 13 years old to use the Service</li>
                </ul>

                <h3 className="text-lg font-semibold text-white mb-3">3.2 Account Responsibilities</h3>
                <ul className="list-disc list-inside text-slate-300 space-y-2">
                  <li>You are responsible for all activities under your account</li>
                  <li>You must notify us immediately of any unauthorized use</li>
                  <li>You may not share your account credentials with others</li>
                  <li>You may not create accounts for others without permission</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-400" />
                4. Acceptable Use
              </h2>
              
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-3">4.1 Permitted Use</h3>
                <p className="text-slate-300 mb-4">You may use the Service for legitimate code analysis and visualization purposes.</p>

                <h3 className="text-lg font-semibold text-white mb-3">4.2 Prohibited Activities</h3>
                <ul className="list-disc list-inside text-slate-300 space-y-2">
                  <li>Violating any applicable laws or regulations</li>
                  <li>Analyzing code you don't have permission to access</li>
                  <li>Attempting to reverse engineer or hack the Service</li>
                  <li>Uploading malicious code or malware</li>
                  <li>Overloading our systems with excessive requests</li>
                  <li>Sharing or redistributing proprietary code without authorization</li>
                  <li>Using the Service for competitive intelligence without consent</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-4">5. Intellectual Property</h2>
              
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-3">5.1 Your Code</h3>
                <p className="text-slate-300 mb-4">
                  You retain all rights to your source code. We only access your code for the purpose of providing 
                  our visualization services and do not claim ownership.
                </p>

                <h3 className="text-lg font-semibold text-white mb-3">5.2 Our Service</h3>
                <p className="text-slate-300 mb-4">
                  The Colooky platform, including its design, features, algorithms, and visualizations, 
                  is owned by Media Team Logic Inc and protected by intellectual property laws.
                </p>

                <h3 className="text-lg font-semibold text-white mb-3">5.3 Generated Content</h3>
                <p className="text-slate-300">
                  Visualizations and analyses generated by our platform are your property, but we retain 
                  the right to the underlying technology and methods used to create them.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-purple-400" />
                6. Billing and Subscriptions
              </h2>
              
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-3">6.1 Subscription Plans</h3>
                <ul className="list-disc list-inside text-slate-300 space-y-2 mb-6">
                  <li>Free tier with limited features</li>
                  <li>Paid subscriptions with additional features and higher limits</li>
                  <li>Pricing is subject to change with 30 days notice</li>
                </ul>

                <h3 className="text-lg font-semibold text-white mb-3">6.2 Payment Terms</h3>
                <ul className="list-disc list-inside text-slate-300 space-y-2 mb-6">
                  <li>Subscriptions are billed in advance</li>
                  <li>All fees are non-refundable unless required by law</li>
                  <li>Failed payments may result in service suspension</li>
                  <li>You are responsible for all taxes and fees</li>
                </ul>

                <h3 className="text-lg font-semibold text-white mb-3">6.3 Cancellation</h3>
                <p className="text-slate-300">
                  You may cancel your subscription at any time. Service will continue until the end 
                  of your current billing period.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-4">7. Data and Privacy</h2>
              
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
                <p className="text-slate-300 mb-4">
                  Your privacy is important to us. Our data handling practices are detailed in our 
                  <Link href="/privacy" className="text-blue-400 hover:text-blue-300"> Privacy Policy</Link>, 
                  which is incorporated into these Terms by reference.
                </p>
                <ul className="list-disc list-inside text-slate-300 space-y-2">
                  <li>We process your code only to provide our services</li>
                  <li>We implement security measures to protect your data</li>
                  <li>You can delete your account and data at any time</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-400" />
                8. Disclaimers and Warranties
              </h2>
              
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
                <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4 mb-4">
                  <p className="text-yellow-300 text-sm font-semibold mb-2">IMPORTANT DISCLAIMER</p>
                </div>
                
                <ul className="list-disc list-inside text-slate-300 space-y-2">
                  <li>The Service is provided "as is" without warranties of any kind</li>
                  <li>We don't guarantee uninterrupted or error-free service</li>
                  <li>We don't guarantee the accuracy of analysis results</li>
                  <li>You use the Service at your own risk</li>
                  <li>We are not liable for any data loss or security breaches</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-4">9. Limitation of Liability</h2>
              
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
                <p className="text-slate-300 mb-4">
                  To the maximum extent permitted by law, Media Team Logic Inc shall not be liable for:
                </p>
                <ul className="list-disc list-inside text-slate-300 space-y-2">
                  <li>Any indirect, incidental, or consequential damages</li>
                  <li>Loss of profits, data, or business opportunities</li>
                  <li>Damages arising from third-party services (GitHub, Stripe, etc.)</li>
                  <li>Any damages exceeding the amount you paid in the last 12 months</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                <Ban className="w-5 h-5 text-red-400" />
                10. Termination
              </h2>
              
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-3">10.1 By You</h3>
                <p className="text-slate-300 mb-4">You may terminate your account at any time by contacting us or using account settings.</p>

                <h3 className="text-lg font-semibold text-white mb-3">10.2 By Us</h3>
                <p className="text-slate-300 mb-4">We may suspend or terminate your account if you:</p>
                <ul className="list-disc list-inside text-slate-300 space-y-2">
                  <li>Violate these Terms</li>
                  <li>Fail to pay subscription fees</li>
                  <li>Engage in harmful or illegal activities</li>
                  <li>Abuse or overload our systems</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                <RefreshCw className="w-5 h-5 text-cyan-400" />
                11. Changes to Terms
              </h2>
              
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
                <p className="text-slate-300 mb-4">
                  We reserve the right to modify these Terms at any time. We will notify users of material changes:
                </p>
                <ul className="list-disc list-inside text-slate-300 space-y-2">
                  <li>By email to registered users</li>
                  <li>Through prominent notice on our platform</li>
                  <li>With at least 30 days notice for material changes</li>
                </ul>
                <p className="text-slate-300 mt-4">
                  Continued use of the Service after changes constitutes acceptance of new Terms.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-4">12. Governing Law</h2>
              
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
                <p className="text-slate-300">
                  These Terms are governed by the laws of the jurisdiction where Media Team Logic Inc is incorporated, 
                  without regard to conflict of law principles. Any disputes will be resolved through binding arbitration 
                  or in the courts of that jurisdiction.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-4">13. Contact Information</h2>
              
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
                <p className="text-slate-300 mb-4">
                  If you have questions about these Terms, please contact us:
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
                <strong>GitHub Marketplace:</strong> If you install Colooky through the GitHub Marketplace, 
                additional terms from GitHub may apply. Please review GitHub's marketplace terms alongside these Terms.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default TermsOfService;