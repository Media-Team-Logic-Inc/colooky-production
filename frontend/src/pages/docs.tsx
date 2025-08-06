import Head from 'next/head';
import Link from 'next/link';
import { ArrowLeft, Code, Users, Shield, Zap, CheckCircle } from 'lucide-react';

export default function Documentation() {
  return (
    <>
      <Head>
        <title>Documentation - Colooky</title>
        <meta name="description" content="Complete guide to Colooky features and pricing plans" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800">
        {/* Header */}
        <header className="border-b border-purple-500/30 bg-black/20 backdrop-blur-md">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center space-x-2">
                <Code className="h-8 w-8 text-cyan-400" />
                <span className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">Colooky</span>
              </div>
              <Link 
                href="/" 
                className="flex items-center text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Link>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-gradient-to-b from-gray-900/80 to-black/80 backdrop-blur-md rounded-2xl shadow-2xl border border-purple-500/20 overflow-hidden">
            
            {/* Title */}
            <div className="p-8 border-b border-purple-500/20">
              <h1 className="text-4xl font-bold text-white mb-4">
                Documentation
              </h1>
              <p className="text-gray-300 text-lg">
                Everything you need to know about Colooky's features and pricing plans
              </p>
            </div>

            <div className="p-8 space-y-12">
              {/* What is Colooky */}
              <section>
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                  <Code className="h-6 w-6 text-cyan-400 mr-3" />
                  What is Colooky?
                </h2>
                <div className="text-gray-300 space-y-4">
                  <p>
                    Colooky transforms your GitHub repositories into beautiful subway map visualizations. 
                    Think of it as a creative way to understand and present your code architecture, 
                    making complex projects easy to navigate and comprehend.
                  </p>
                  <p>
                    Perfect for developers who want to:
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Visualize code structure and dependencies</li>
                    <li>Share project overviews with team members</li>
                    <li>Learn faster by seeing code relationships</li>
                    <li>Create stunning presentations of their work</li>
                  </ul>
                </div>
              </section>

              {/* Features */}
              <section>
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                  <Zap className="h-6 w-6 text-green-400 mr-3" />
                  Features & Capabilities
                </h2>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="p-6 rounded-xl bg-gradient-to-br from-purple-900/30 to-indigo-900/30 border border-purple-500/20">
                    <h3 className="text-lg font-semibold text-white mb-3">Visualizations</h3>
                    <ul className="text-gray-300 space-y-2 text-sm">
                      <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-400 mr-2 flex-shrink-0" />Subway map style layouts</li>
                      <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-400 mr-2 flex-shrink-0" />Interactive file navigation</li>
                      <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-400 mr-2 flex-shrink-0" />Dependency mapping</li>
                      <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-400 mr-2 flex-shrink-0" />Code structure overview</li>
                    </ul>
                  </div>

                  <div className="p-6 rounded-xl bg-gradient-to-br from-blue-900/30 to-purple-900/30 border border-blue-500/20">
                    <h3 className="text-lg font-semibold text-white mb-3">Export Options</h3>
                    <ul className="text-gray-300 space-y-2 text-sm">
                      <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-400 mr-2 flex-shrink-0" />High-quality PNG export</li>
                      <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-400 mr-2 flex-shrink-0" />Scalable SVG format</li>
                      <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-400 mr-2 flex-shrink-0" />Custom sizing options</li>
                      <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-400 mr-2 flex-shrink-0" />Print-ready formats</li>
                    </ul>
                  </div>
                </div>
              </section>

              {/* Pricing Plans */}
              <section>
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                  <Users className="h-6 w-6 text-purple-400 mr-3" />
                  Pricing Plans & Limits
                </h2>
                
                <div className="space-y-6">
                  {/* Individual */}
                  <div className="p-6 rounded-xl bg-gradient-to-r from-blue-900/20 to-indigo-900/20 border border-blue-500/20">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xl font-bold text-white">Individual Plan</h3>
                      <span className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">$19/mo</span>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4 text-gray-300">
                      <div>
                        <h4 className="font-semibold text-white mb-2">Repository Limits:</h4>
                        <ul className="space-y-1 text-sm">
                          <li>• Up to 10 repositories</li>
                          <li>• Standard visualization themes</li>
                          <li>• PNG & SVG export</li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-semibold text-white mb-2">Support:</h4>
                        <ul className="space-y-1 text-sm">
                          <li>• Email support</li>
                          <li>• Documentation access</li>
                          <li>• Community forum</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Team */}
                  <div className="p-6 rounded-xl bg-gradient-to-r from-purple-900/20 to-pink-900/20 border border-purple-500/20">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xl font-bold text-white">Team Plan</h3>
                      <span className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">$49/mo</span>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4 text-gray-300">
                      <div>
                        <h4 className="font-semibold text-white mb-2">Team Features:</h4>
                        <ul className="space-y-1 text-sm">
                          <li>• Up to 50 repositories</li>
                          <li>• Up to 5 team members</li>
                          <li>• Advanced visualization themes</li>
                          <li>• Team sharing & collaboration</li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-semibold text-white mb-2">How Teams Work:</h4>
                        <ul className="space-y-1 text-sm">
                          <li>• Invite members via email</li>
                          <li>• Shared workspace</li>
                          <li>• Role-based permissions</li>
                          <li>• Priority support</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Enterprise */}
                  <div className="p-6 rounded-xl bg-gradient-to-r from-gray-900/20 to-slate-900/20 border border-gray-500/20">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xl font-bold text-white">Enterprise Plan</h3>
                      <span className="text-2xl font-bold bg-gradient-to-r from-gray-200 to-white bg-clip-text text-transparent">$199/mo</span>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4 text-gray-300">
                      <div>
                        <h4 className="font-semibold text-white mb-2">Enterprise Features:</h4>
                        <ul className="space-y-1 text-sm">
                          <li>• Unlimited repositories</li>
                          <li>• Unlimited team members</li>
                          <li>• Custom branding & themes</li>
                          <li>• SSO integration</li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-semibold text-white mb-2">Enterprise Support:</h4>
                        <ul className="space-y-1 text-sm">
                          <li>• Dedicated support manager</li>
                          <li>• Custom onboarding</li>
                          <li>• Advanced security features</li>
                          <li>• SLA guarantees</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Getting Started */}
              <section>
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                  <Shield className="h-6 w-6 text-pink-400 mr-3" />
                  Getting Started
                </h2>
                <div className="text-gray-300 space-y-4">
                  <p>
                    Getting started with Colooky is simple:
                  </p>
                  <ol className="list-decimal list-inside space-y-3 ml-4">
                    <li><strong className="text-white">Sign up</strong> with your GitHub account</li>
                    <li><strong className="text-white">Choose your plan</strong> (start with a 14-day free trial)</li>
                    <li><strong className="text-white">Connect repositories</strong> you want to visualize</li>
                    <li><strong className="text-white">Generate visualizations</strong> with one click</li>
                    <li><strong className="text-white">Export and share</strong> your beautiful subway maps</li>
                  </ol>
                </div>
              </section>

              {/* Support */}
              <section>
                <h2 className="text-2xl font-bold text-white mb-6">
                  Need Help?
                </h2>
                <div className="p-6 rounded-xl bg-gradient-to-r from-green-900/20 to-teal-900/20 border border-green-500/20">
                  <p className="text-gray-300 mb-4">
                    Have questions or need support? We're here to help!
                  </p>
                  <div className="flex flex-wrap gap-4">
                    <a 
                      href="mailto:flolooky@gmail.com" 
                      className="bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300 shadow-lg hover:shadow-green-500/25"
                    >
                      Contact Support
                    </a>
                    <Link 
                      href="/" 
                      className="border border-green-400/50 text-green-400 hover:bg-green-400/10 px-6 py-3 rounded-lg font-semibold transition-all duration-300"
                    >
                      Back to Home
                    </Link>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}