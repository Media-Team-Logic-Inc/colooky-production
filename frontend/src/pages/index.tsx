import Link from 'next/link';
import { Github, ArrowRight, Code, Users, Shield, Zap } from 'lucide-react';
import { useSession } from 'next-auth/react';

export default function Home() {
  const { data: session } = useSession();
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800">
      {/* Header */}
      <header className="border-b border-purple-500/30 bg-black/20 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-2">
              <Code className="h-8 w-8 text-cyan-400" />
              <span className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">Colooky</span>
            </div>
            
            <nav className="hidden md:flex items-center space-x-8">
              <a 
                href="#features" 
                className="text-gray-300 hover:text-cyan-400 transition-colors duration-300"
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                Features
              </a>
              <a 
                href="#pricing" 
                className="text-gray-300 hover:text-purple-400 transition-colors duration-300"
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                Pricing
              </a>
              <Link 
                href="/auth/signin" 
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-2 rounded-lg font-medium transition-all duration-300 shadow-lg hover:shadow-purple-500/25"
              >
                Sign In
              </Link>
            </nav>

            {/* Mobile Sign In */}
            <Link 
              href="/auth/signin" 
              className="md:hidden bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-2 rounded-lg font-medium transition-all duration-300 shadow-lg hover:shadow-purple-500/25"
            >
              Sign In
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-pink-600/10"></div>
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-8">
            Visualize Your
            <span className="bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent"> Code Journey</span>
          </h1>
          <p className="text-xl text-gray-200 mb-12 max-w-3xl mx-auto">
            Transform your GitHub repositories into beautiful subway map visualizations. 
            Track your development progress and share your coding story with the world.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {session ? (
              <Link 
                href="/dashboard"
                className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-8 py-4 rounded-xl font-semibold text-lg flex items-center justify-center gap-2 transition-all duration-300 shadow-xl hover:shadow-cyan-500/25 hover:scale-105"
              >
                <Code className="h-5 w-5" />
                Go to Dashboard
                <ArrowRight className="h-5 w-5" />
              </Link>
            ) : (
              <Link 
                href="/auth/signin"
                className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-8 py-4 rounded-xl font-semibold text-lg flex items-center justify-center gap-2 transition-all duration-300 shadow-xl hover:shadow-cyan-500/25 hover:scale-105"
              >
                <Github className="h-5 w-5" />
                Start with GitHub
                <ArrowRight className="h-5 w-5" />
              </Link>
            )}
            <Link 
              href="/demo"
              className="border-2 border-purple-400/50 hover:border-purple-400 bg-purple-900/20 hover:bg-purple-800/30 text-purple-100 px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 backdrop-blur-sm inline-block text-center"
            >
              View Demo
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-16 bg-gradient-to-b from-slate-900 to-gray-900 relative">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-900/20 via-blue-900/20 to-indigo-900/20"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <h2 className="text-3xl font-bold text-center text-white mb-12">
            Why Choose <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">Colooky?</span>
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center p-8 rounded-xl bg-gradient-to-b from-purple-900/50 to-indigo-900/50 backdrop-blur-sm border border-purple-500/20 hover:border-purple-400/40 transition-all duration-300 hover:transform hover:scale-105">
              <Code className="h-12 w-12 text-cyan-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2 text-white">Beautiful Visualizations</h3>
              <p className="text-gray-300">Transform complex code repositories into intuitive subway maps</p>
            </div>
            <div className="text-center p-8 rounded-xl bg-gradient-to-b from-blue-900/50 to-purple-900/50 backdrop-blur-sm border border-blue-500/20 hover:border-blue-400/40 transition-all duration-300 hover:transform hover:scale-105">
              <Users className="h-12 w-12 text-purple-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2 text-white">Team Collaboration</h3>
              <p className="text-gray-300">Share and collaborate on code visualizations with your team</p>
            </div>
            <div className="text-center p-8 rounded-xl bg-gradient-to-b from-indigo-900/50 to-pink-900/50 backdrop-blur-sm border border-pink-500/20 hover:border-pink-400/40 transition-all duration-300 hover:transform hover:scale-105">
              <Shield className="h-12 w-12 text-pink-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2 text-white">Secure & Private</h3>
              <p className="text-gray-300">Your code stays secure with enterprise-grade security</p>
            </div>
            <div className="text-center p-8 rounded-xl bg-gradient-to-b from-green-900/50 to-teal-900/50 backdrop-blur-sm border border-green-500/20 hover:border-green-400/40 transition-all duration-300 hover:transform hover:scale-105">
              <Zap className="h-12 w-12 text-green-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2 text-white">New to Coding?</h3>
              <p className="text-gray-300">Speed up the learning curve to see what all that gibberish means!</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-16 bg-gradient-to-b from-gray-900 to-black relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-900/10 via-purple-900/10 to-pink-900/10"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <h2 className="text-3xl font-bold text-center text-white mb-4">
            Choose Your <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">Plan</span>
          </h2>
          <p className="text-center text-gray-300 mb-12">
            Start with a 14-day free trial, then choose the plan that fits your needs
          </p>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Individual Plan */}
            <div className="bg-gradient-to-b from-blue-900/30 to-indigo-900/30 backdrop-blur-sm rounded-xl shadow-2xl p-8 border border-blue-500/30 hover:border-blue-400/50 transition-all duration-300 hover:transform hover:scale-105">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-white mb-2">Individual</h3>
                <div className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent mb-2">$19<span className="text-lg text-gray-400">/mo</span></div>
                <p className="text-gray-300">Perfect for solo developers</p>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-3">
                  <Zap className="h-5 w-5 text-cyan-400" />
                  <span className="text-gray-200">10 repositories</span>
                </li>
                <li className="flex items-center gap-3">
                  <Zap className="h-5 w-5 text-cyan-400" />
                  <span className="text-gray-200">Standard visualizations</span>
                </li>
                <li className="flex items-center gap-3">
                  <Zap className="h-5 w-5 text-cyan-400" />
                  <span className="text-gray-200">Export PNG/SVG</span>
                </li>
                <li className="flex items-center gap-3">
                  <Zap className="h-5 w-5 text-cyan-400" />
                  <span className="text-gray-200">Email support</span>
                </li>
              </ul>
              <Link 
                href="/auth/signin?plan=individual" 
                className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white py-3 rounded-lg font-semibold text-center block transition-all duration-300 shadow-lg hover:shadow-cyan-500/25"
              >
                Start Free Trial
              </Link>
            </div>

            {/* Team Plan */}
            <div className="bg-gradient-to-b from-purple-900/40 to-pink-900/40 backdrop-blur-sm rounded-xl shadow-2xl p-8 border border-purple-500/40 hover:border-purple-400/60 transition-all duration-300 hover:transform hover:scale-105 relative">
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-1 rounded-full text-sm font-semibold shadow-lg">Popular</span>
              </div>
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-white mb-2">Team</h3>
                <div className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">$49<span className="text-lg text-gray-400">/mo</span></div>
                <p className="text-gray-300">For growing teams (5 members)</p>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-3">
                  <Zap className="h-5 w-5 text-purple-400" />
                  <span className="text-gray-200">50 repositories</span>
                </li>
                <li className="flex items-center gap-3">
                  <Zap className="h-5 w-5 text-purple-400" />
                  <span className="text-gray-200">Advanced visualizations</span>
                </li>
                <li className="flex items-center gap-3">
                  <Zap className="h-5 w-5 text-purple-400" />
                  <span className="text-gray-200">Team sharing & collaboration</span>
                </li>
                <li className="flex items-center gap-3">
                  <Zap className="h-5 w-5 text-purple-400" />
                  <span className="text-gray-200">Priority support</span>
                </li>
              </ul>
              <Link 
                href="/auth/signin?plan=team" 
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white py-3 rounded-lg font-semibold text-center block transition-all duration-300 shadow-lg hover:shadow-purple-500/25"
              >
                Start Free Trial
              </Link>
            </div>

            {/* Enterprise Plan */}
            <div className="bg-gradient-to-b from-gray-900/50 to-slate-900/50 backdrop-blur-sm rounded-xl shadow-2xl p-8 border border-gray-500/30 hover:border-gray-400/50 transition-all duration-300 hover:transform hover:scale-105">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-white mb-2">Enterprise</h3>
                <div className="text-4xl font-bold bg-gradient-to-r from-gray-200 to-white bg-clip-text text-transparent mb-2">$199<span className="text-lg text-gray-400">/mo</span></div>
                <p className="text-gray-300">For large organizations (unlimited users)</p>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-3">
                  <Zap className="h-5 w-5 text-gray-300" />
                  <span className="text-gray-200">Unlimited repositories</span>
                </li>
                <li className="flex items-center gap-3">
                  <Zap className="h-5 w-5 text-gray-300" />
                  <span className="text-gray-200">Custom branding & themes</span>
                </li>
                <li className="flex items-center gap-3">
                  <Zap className="h-5 w-5 text-gray-300" />
                  <span className="text-gray-200">SSO & advanced security</span>
                </li>
                <li className="flex items-center gap-3">
                  <Zap className="h-5 w-5 text-gray-300" />
                  <span className="text-gray-200">Dedicated support manager</span>
                </li>
              </ul>
              <Link 
                href="/auth/signin?plan=enterprise" 
                className="w-full bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 text-white py-3 rounded-lg font-semibold text-center block transition-all duration-300 shadow-lg hover:shadow-gray-500/25"
              >
                Contact Sales
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gradient-to-r from-black via-gray-900 to-black border-t border-purple-500/20 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center text-center mb-8">
            <div className="flex items-center space-x-2 mb-4">
              <Code className="h-6 w-6 text-cyan-400" />
              <span className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">Colooky</span>
            </div>
            <p className="text-gray-300 mb-6">Transform your code into beautiful visualizations</p>
            
            <div className="flex flex-wrap justify-center gap-8 text-sm">
              <Link href="/docs" className="text-gray-400 hover:text-cyan-400 transition-colors duration-300">
                Documentation
              </Link>
              <a href="mailto:flolooky@gmail.com" className="text-gray-400 hover:text-purple-400 transition-colors duration-300">
                Contact
              </a>
              <a href="#features" 
                className="text-gray-400 hover:text-cyan-400 transition-colors duration-300"
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                Features
              </a>
              <a href="#pricing" 
                className="text-gray-400 hover:text-purple-400 transition-colors duration-300"
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                Pricing
              </a>
              <Link href="/privacy" className="text-gray-400 hover:text-cyan-400 transition-colors duration-300">
                Privacy Policy
              </Link>
              <Link href="/terms" className="text-gray-400 hover:text-purple-400 transition-colors duration-300">
                Terms of Service
              </Link>
            </div>
          </div>
          
          <div className="border-t border-gray-700 pt-6 text-center">
            <p className="text-gray-500 text-sm">
              © 2024 Colooky. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}