'use client';

import { useState } from 'react';
import { MapPin, Shield, Clock, BarChart3, Zap, CheckCircle, Star, MessageCircle, Menu, X, Send, Loader2 } from 'lucide-react';
import Link from 'next/link';

function ContactForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setSubmitStatus('success');
        setFormData({ name: '', email: '', phone: '', company: '', message: '' });
        setTimeout(() => setSubmitStatus('idle'), 5000);
      } else {
        setSubmitStatus('error');
      }
    } catch (error) {
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8 hover:border-blue-500/50 transition-all duration-500 animate-fade-in-up [animation-delay:0.4s]">
      <h3 className="text-2xl font-bold mb-6 text-white">Send Us a Message</h3>
      
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-slate-300 mb-2">
            Full Name *
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            placeholder="John Doe"
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2">
            Email Address *
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            placeholder="john@example.com"
          />
        </div>

        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-slate-300 mb-2">
            Phone Number
          </label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            placeholder="+91 98765 43210"
          />
        </div>

        <div>
          <label htmlFor="company" className="block text-sm font-medium text-slate-300 mb-2">
            Company Name
          </label>
          <input
            type="text"
            id="company"
            name="company"
            value={formData.company}
            onChange={handleChange}
            className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            placeholder="Your Company"
          />
        </div>

        <div>
          <label htmlFor="message" className="block text-sm font-medium text-slate-300 mb-2">
            Message *
          </label>
          <textarea
            id="message"
            name="message"
            value={formData.message}
            onChange={handleChange}
            required
            rows={5}
            className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
            placeholder="Tell us about your fleet tracking needs..."
          />
        </div>

        {submitStatus === 'success' && (
          <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 text-green-400 text-sm">
            ✓ Message sent successfully! We'll get back to you soon.
          </div>
        )}

        {submitStatus === 'error' && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400 text-sm">
            ✗ Failed to send message. Please try again or email us directly.
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full group px-6 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 rounded-xl font-semibold text-white shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Sending...
            </>
          ) : (
            <>
              Send Message
              <Send className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </>
          )}
        </button>
      </form>
    </div>
  );
}

export default function LandingPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [pricingPeriod, setPricingPeriod] = useState<'monthly' | 'yearly'>('monthly');

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-6xl animate-fade-in-down">
        <div className="bg-slate-900/80 backdrop-blur-2xl border border-slate-700/50 rounded-full px-6 py-3 shadow-2xl shadow-blue-500/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/50">
                <MapPin className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
                Fleetzi
              </span>
            </div>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center gap-2">
              <a href="#features" className="px-4 py-2 text-sm text-slate-300 hover:text-white hover:bg-white/5 rounded-full transition-all duration-200">Features</a>
              <a href="#how-it-works" className="px-4 py-2 text-sm text-slate-300 hover:text-white hover:bg-white/5 rounded-full transition-all duration-200">How It Works</a>
              <a href="#pricing" className="px-4 py-2 text-sm text-slate-300 hover:text-white hover:bg-white/5 rounded-full transition-all duration-200">Pricing</a>
              <a href="#testimonials" className="px-4 py-2 text-sm text-slate-300 hover:text-white hover:bg-white/5 rounded-full transition-all duration-200">Testimonials</a>
              <a href="#contact" className="px-4 py-2 text-sm text-slate-300 hover:text-white hover:bg-white/5 rounded-full transition-all duration-200">Contact</a>
              <Link href="/login" className="px-4 py-2 text-sm text-slate-300 hover:text-white hover:bg-white/5 rounded-full transition-all duration-200">
                Login
              </Link>
              <Link href="/signup" className="px-5 py-2 text-sm bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-full transition-all duration-200 font-medium shadow-lg shadow-blue-500/30">
                Sign Up
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button 
              className="md:hidden text-white"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X /> : <Menu />}
            </button>
          </div>

          {/* Mobile Menu */}
          {isMenuOpen && (
            <div className="md:hidden absolute top-full left-0 right-0 mt-2 bg-slate-900/95 backdrop-blur-2xl border border-slate-700/50 rounded-3xl p-4 space-y-2 animate-fade-in-up">
              <a href="#features" className="block px-4 py-2 text-slate-300 hover:text-white hover:bg-white/5 rounded-full transition-all">Features</a>
              <a href="#how-it-works" className="block px-4 py-2 text-slate-300 hover:text-white hover:bg-white/5 rounded-full transition-all">How It Works</a>
              <a href="#pricing" className="block px-4 py-2 text-slate-300 hover:text-white hover:bg-white/5 rounded-full transition-all">Pricing</a>
              <a href="#testimonials" className="block px-4 py-2 text-slate-300 hover:text-white hover:bg-white/5 rounded-full transition-all">Testimonials</a>
              <a href="#contact" className="block px-4 py-2 text-slate-300 hover:text-white hover:bg-white/5 rounded-full transition-all">Contact</a>
              <Link href="/login" className="block px-4 py-2 text-slate-300 hover:text-white hover:bg-white/5 rounded-full transition-all text-center">
                Login
              </Link>
              <Link href="/signup" className="block px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-full text-center transition-all">
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 bg-gradient-to-b from-blue-950/20 via-[#0a0a0f] to-[#0a0a0f]">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/30 rounded-full blur-3xl animate-float"></div>
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/30 rounded-full blur-3xl animate-float [animation-delay:2s]"></div>
            <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl animate-float [animation-delay:4s]"></div>
          </div>
          {/* Grid Pattern */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)] opacity-20"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-6 py-20">
          <div className="text-center space-y-8">
            {/* Trust Badges */}
            <div className="flex flex-wrap justify-center gap-6 text-sm text-slate-400 animate-fade-in-up [animation-delay:0.2s]">
              <span className="flex items-center gap-2 px-3 py-1.5 bg-slate-800/50 border border-slate-700/50 rounded-full backdrop-blur-sm hover:border-blue-500/50 transition-all duration-300">
                <CheckCircle className="w-4 h-4 text-blue-400" />
                Built in India
              </span>
              <span className="flex items-center gap-2 px-3 py-1.5 bg-slate-800/50 border border-slate-700/50 rounded-full backdrop-blur-sm hover:border-blue-500/50 transition-all duration-300">
                <CheckCircle className="w-4 h-4 text-blue-400" />
                Secure
              </span>
              <span className="flex items-center gap-2 px-3 py-1.5 bg-slate-800/50 border border-slate-700/50 rounded-full backdrop-blur-sm hover:border-blue-500/50 transition-all duration-300">
                <CheckCircle className="w-4 h-4 text-blue-400" />
                Real-Time
              </span>
              <span className="flex items-center gap-2 px-3 py-1.5 bg-slate-800/50 border border-slate-700/50 rounded-full backdrop-blur-sm hover:border-blue-500/50 transition-all duration-300">
                <CheckCircle className="w-4 h-4 text-blue-400" />
                Fleet Ready
              </span>
            </div>

            {/* Main Headlines */}
            <h1 className="text-5xl md:text-7xl font-bold leading-tight animate-fade-in-up [animation-delay:0.4s]">
              <span className="bg-gradient-to-r from-white via-blue-100 to-cyan-200 bg-clip-text text-transparent">
                Smart GPS Tracking
              </span>
              <br />
              <span className="bg-gradient-to-r from-slate-300 to-slate-400 bg-clip-text text-transparent">for India</span>
            </h1>

            <p className="text-xl md:text-2xl text-gray-400 max-w-3xl mx-auto animate-fade-in-up [animation-delay:0.6s]">
              Track cars and fleets in real time. Protect vehicles. Save fuel. Stay in control.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in-up [animation-delay:0.8s]">
              <button className="group px-10 py-5 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 rounded-xl text-lg font-semibold shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all transform hover:scale-105">
                <span className="flex items-center gap-2">
                  Start Free Demo
                  <Zap className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                </span>
              </button>
              <button className="px-10 py-5 bg-slate-800/50 border border-slate-700/50 rounded-xl text-lg font-semibold hover:bg-slate-800 hover:border-blue-500/50 transition-all transform hover:scale-105 backdrop-blur-sm">
                See How It Works
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Product Showcase */}
      <section className="relative py-32 px-6 overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 bg-gradient-to-b from-blue-950/20 via-transparent to-cyan-950/20"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-500/5 via-transparent to-transparent"></div>
        
        <div className="max-w-7xl mx-auto relative">
          <div className="text-center mb-20 animate-fade-in-up">
            <div className="inline-block mb-4">
              <span className="px-4 py-2 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-full text-sm font-semibold text-blue-400 backdrop-blur-sm">
                ⚡ Live Dashboard Preview
              </span>
            </div>
            <h2 className="text-4xl md:text-6xl font-bold mb-6">
              <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent">
                Command Center for
              </span>
              <br />
              <span className="bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                Your Entire Fleet
              </span>
            </h2>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto">Real-time insights, intelligent alerts, and complete control - all in one beautiful interface</p>
          </div>

          {/* Dashboard Mockup */}
          <div className="relative animate-fade-in-up [animation-delay:0.2s]">
            {/* Glow Effects */}
            <div className="absolute -inset-4 bg-gradient-to-r from-blue-500/20 via-cyan-500/20 to-blue-500/20 blur-3xl opacity-50 group-hover:opacity-75 transition-opacity duration-500"></div>
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-32 bg-gradient-to-b from-blue-500/30 to-transparent blur-2xl"></div>
            
            <div className="relative bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-2xl border border-slate-700/50 rounded-3xl p-6 md:p-10 shadow-2xl hover:border-blue-500/50 transition-all duration-500 group">
              {/* Floating Orbs */}
              <div className="absolute top-20 right-20 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl animate-float"></div>
              <div className="absolute bottom-20 left-20 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl animate-float [animation-delay:2s]"></div>
              
              <div className="relative bg-[#0a0d14] rounded-2xl overflow-hidden border border-slate-700/50 shadow-inner">
                {/* Mock Dashboard Header */}
                <div className="bg-gradient-to-r from-slate-900/90 to-slate-800/90 backdrop-blur-xl p-4 border-b border-slate-700/50 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500 shadow-lg shadow-red-500/50"></div>
                      <div className="w-3 h-3 rounded-full bg-yellow-500 shadow-lg shadow-yellow-500/50"></div>
                      <div className="w-3 h-3 rounded-full bg-green-500 shadow-lg shadow-green-500/50 animate-pulse"></div>
                    </div>
                    <div className="hidden md:flex items-center gap-2 ml-4">
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                      <span className="text-xs text-green-400 font-medium">Live</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/30">
                      <MapPin className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-sm font-semibold bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">Fleetzi</span>
                  </div>
                  <div className="hidden md:block text-xs text-slate-500">Dashboard v2.0</div>
                </div>

                {/* Mock Dashboard Content */}
                <div className="p-4 md:p-8 space-y-6">
                  {/* Stats Cards */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                    <div className="group relative bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-xl p-4 border border-blue-500/30 hover:border-blue-400/60 hover:scale-105 hover:shadow-lg hover:shadow-blue-500/20 transition-all duration-300 cursor-pointer overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      <div className="relative flex items-start justify-between mb-2">
                        <div className="text-xs text-slate-400 font-medium">Active Vehicles</div>
                        <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></div>
                      </div>
                      <div className="relative flex items-end justify-between">
                        <div className="text-3xl font-bold bg-gradient-to-br from-blue-400 to-cyan-400 bg-clip-text text-transparent">24</div>
                        <div className="text-xs text-blue-400/60">+2</div>
                      </div>
                      <div className="relative mt-2 h-1 bg-slate-800 rounded-full overflow-hidden">
                        <div className="absolute left-0 top-0 h-full w-4/5 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full"></div>
                      </div>
                    </div>
                    
                    <div className="group relative bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-xl p-4 border border-green-500/30 hover:border-green-400/60 hover:scale-105 hover:shadow-lg hover:shadow-green-500/20 transition-all duration-300 cursor-pointer overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-green-500/0 to-green-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      <div className="relative flex items-start justify-between mb-2">
                        <div className="text-xs text-slate-400 font-medium">On Route</div>
                        <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                      </div>
                      <div className="relative flex items-end justify-between">
                        <div className="text-3xl font-bold bg-gradient-to-br from-green-400 to-emerald-400 bg-clip-text text-transparent">18</div>
                        <div className="text-xs text-green-400/60">75%</div>
                      </div>
                      <div className="relative mt-2 h-1 bg-slate-800 rounded-full overflow-hidden">
                        <div className="absolute left-0 top-0 h-full w-3/4 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"></div>
                      </div>
                    </div>
                    
                    <div className="group relative bg-gradient-to-br from-orange-500/10 to-red-500/10 rounded-xl p-4 border border-orange-500/30 hover:border-orange-400/60 hover:scale-105 hover:shadow-lg hover:shadow-orange-500/20 transition-all duration-300 cursor-pointer overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-orange-500/0 to-orange-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      <div className="relative flex items-start justify-between mb-2">
                        <div className="text-xs text-slate-400 font-medium">Alerts</div>
                        <div className="w-2 h-2 rounded-full bg-orange-400 animate-pulse"></div>
                      </div>
                      <div className="relative flex items-end justify-between">
                        <div className="text-3xl font-bold bg-gradient-to-br from-orange-400 to-red-400 bg-clip-text text-transparent">3</div>
                        <div className="text-xs text-orange-400/60">New</div>
                      </div>
                      <div className="relative mt-2 h-1 bg-slate-800 rounded-full overflow-hidden">
                        <div className="absolute left-0 top-0 h-full w-1/4 bg-gradient-to-r from-orange-500 to-red-500 rounded-full"></div>
                      </div>
                    </div>
                    
                    <div className="group relative bg-gradient-to-br from-cyan-500/10 to-blue-500/10 rounded-xl p-4 border border-cyan-500/30 hover:border-cyan-400/60 hover:scale-105 hover:shadow-lg hover:shadow-cyan-500/20 transition-all duration-300 cursor-pointer overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/0 to-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      <div className="relative flex items-start justify-between mb-2">
                        <div className="text-xs text-slate-400 font-medium">Total Distance</div>
                        <div className="text-xs text-cyan-400/60">km</div>
                      </div>
                      <div className="relative flex items-end justify-between">
                        <div className="text-3xl font-bold bg-gradient-to-br from-cyan-400 to-blue-400 bg-clip-text text-transparent">1.2k</div>
                        <div className="text-xs text-cyan-400/60">Today</div>
                      </div>
                      <div className="relative mt-2 h-1 bg-slate-800 rounded-full overflow-hidden">
                        <div className="absolute left-0 top-0 h-full w-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"></div>
                      </div>
                    </div>
                  </div>

                  {/* Map Placeholder with Floating Elements */}
                  <div className="relative bg-gradient-to-br from-slate-900/90 to-slate-800/90 rounded-xl h-72 md:h-80 border border-slate-700/50 overflow-hidden hover:border-blue-500/50 transition-all group/map">
                    {/* Animated Background Grid */}
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:2rem_2rem] opacity-20"></div>
                    
                    {/* Glowing Orbs */}
                    <div className="absolute inset-0 opacity-30">
                      <div className="absolute top-1/4 left-1/4 w-40 h-40 bg-blue-500 rounded-full blur-3xl animate-float"></div>
                      <div className="absolute bottom-1/4 right-1/4 w-40 h-40 bg-cyan-500 rounded-full blur-3xl animate-float [animation-delay:1.5s]"></div>
                      <div className="absolute top-1/2 left-1/2 w-32 h-32 bg-indigo-500 rounded-full blur-3xl animate-float [animation-delay:3s]"></div>
                    </div>
                    
                    {/* Floating Vehicle Markers */}
                    <div className="absolute top-1/4 left-1/3 animate-float">
                      <div className="relative">
                        <div className="absolute inset-0 bg-blue-500/30 rounded-full blur-xl"></div>
                        <div className="relative w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center shadow-lg shadow-blue-500/50 border-2 border-white/20">
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="absolute top-1/2 right-1/4 animate-float [animation-delay:1s]">
                      <div className="relative">
                        <div className="absolute inset-0 bg-green-500/30 rounded-full blur-xl"></div>
                        <div className="relative w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-green-500/50 border-2 border-white/20">
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="absolute bottom-1/3 left-1/2 animate-float [animation-delay:2s]">
                      <div className="relative">
                        <div className="absolute inset-0 bg-cyan-500/30 rounded-full blur-xl"></div>
                        <div className="relative w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-full flex items-center justify-center shadow-lg shadow-cyan-500/50 border-2 border-white/20">
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Center Content */}
                    <div className="relative h-full flex flex-col items-center justify-center">
                      <div className="relative mb-4">
                        <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-2xl"></div>
                        <MapPin className="relative w-16 h-16 text-blue-400 group-hover/map:scale-110 group-hover/map:rotate-12 transition-all duration-500" />
                      </div>
                      <div className="text-slate-300 font-semibold mb-2">Live Map View</div>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                        <span>18 vehicles tracking</span>
                      </div>
                    </div>
                    
                    {/* Route Lines */}
                    <svg className="absolute inset-0 w-full h-full opacity-20" style={{pointerEvents: 'none'}}>
                      <path d="M 100 100 Q 200 150, 300 100" stroke="url(#gradient1)" strokeWidth="2" fill="none" strokeDasharray="5,5" className="animate-pulse" />
                      <path d="M 300 200 Q 400 250, 500 200" stroke="url(#gradient2)" strokeWidth="2" fill="none" strokeDasharray="5,5" className="animate-pulse [animation-delay:0.5s]" />
                      <defs>
                        <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.5" />
                          <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.5" />
                        </linearGradient>
                        <linearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.5" />
                          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.5" />
                        </linearGradient>
                      </defs>
                    </svg>
                  </div>

                  {/* Timeline Playback & Quick Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Timeline Playback */}
                    <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-xl p-5 border border-slate-700/50 hover:border-blue-500/50 transition-all group/playback">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-blue-400" />
                          <span className="text-sm font-semibold text-slate-300">Trip Playback</span>
                        </div>
                        <span className="text-xs text-blue-400 bg-blue-500/10 px-2 py-1 rounded-full">Live</span>
                      </div>
                      <div className="space-y-2 mb-3">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-400">9:00 AM</span>
                          <span className="text-slate-400">5:00 PM</span>
                        </div>
                        <div className="relative h-2 bg-slate-700/50 rounded-full overflow-hidden">
                          <div className="absolute left-0 top-0 h-full w-3/4 bg-gradient-to-r from-blue-600 via-cyan-500 to-cyan-600 rounded-full shadow-lg shadow-blue-500/50 group-hover/playback:shadow-blue-500/70 transition-shadow"></div>
                          <div className="absolute left-3/4 top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-lg border-2 border-blue-500 animate-pulse"></div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span>Duration: 8h 0m</span>
                        <span>Distance: 245 km</span>
                      </div>
                    </div>
                    
                    {/* Quick Stats */}
                    <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-xl p-5 border border-slate-700/50 hover:border-cyan-500/50 transition-all">
                      <div className="flex items-center gap-2 mb-4">
                        <Zap className="w-4 h-4 text-cyan-400" />
                        <span className="text-sm font-semibold text-slate-300">Performance</span>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <div className="text-xs text-slate-400">Avg Speed</div>
                          <div className="text-lg font-bold text-cyan-400">62 km/h</div>
                        </div>
                        <div className="space-y-1">
                          <div className="text-xs text-slate-400">Fuel Used</div>
                          <div className="text-lg font-bold text-green-400">18.5 L</div>
                        </div>
                        <div className="space-y-1">
                          <div className="text-xs text-slate-400">Stops</div>
                          <div className="text-lg font-bold text-blue-400">12</div>
                        </div>
                        <div className="space-y-1">
                          <div className="text-xs text-slate-400">Efficiency</div>
                          <div className="text-lg font-bold text-emerald-400">94%</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="relative py-32 px-6 overflow-hidden">
        {/* Background Graphics */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-950/10 to-transparent"></div>
        <div className="absolute top-1/4 left-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl"></div>
        
        {/* Animated Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-5"></div>
        
        <div className="max-w-7xl mx-auto relative">
          <div className="text-center mb-20 animate-fade-in-up">
            <div className="inline-block mb-4">
              <span className="px-4 py-2 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-full text-sm font-semibold text-blue-400 backdrop-blur-sm">
                🚀 Powerful Features
              </span>
            </div>
            <h2 className="text-4xl md:text-6xl font-bold mb-6">
              <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent">
                Everything Your Fleet
              </span>
              <br />
              <span className="bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                Needs to Succeed
              </span>
            </h2>
            <p className="text-xl text-slate-400 max-w-3xl mx-auto">Comprehensive tools designed to give you complete visibility and control over your entire fleet operation</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Feature 1 - Large Card */}
            <div className="group relative bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8 md:p-10 hover:border-blue-500/50 hover:shadow-2xl hover:shadow-blue-500/20 transition-all duration-500 overflow-hidden animate-fade-in-up [animation-delay:0.1s]">
              {/* Background Graphics */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl group-hover:bg-blue-500/10 transition-all duration-500"></div>
              <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-cyan-500/5 rounded-full blur-2xl"></div>
              
              {/* Decorative Elements */}
              <div className="absolute top-4 right-4 w-20 h-20 border border-blue-500/10 rounded-full"></div>
              <div className="absolute top-8 right-8 w-12 h-12 border border-cyan-500/10 rounded-full"></div>
              
              <div className="relative">
                <div className="flex items-start justify-between mb-6">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-lg shadow-blue-500/50">
                    <MapPin className="w-10 h-10 text-white" />
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-full">
                    <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></div>
                    <span className="text-xs text-blue-400 font-medium">Live</span>
                  </div>
                </div>
                
                <h3 className="text-3xl font-bold mb-4 text-white group-hover:text-blue-400 transition-colors">Real-Time Tracking</h3>
                <p className="text-slate-400 text-lg mb-6 leading-relaxed">
                  Track your vehicles live on the map with precise GPS location updates every second. Never lose sight of your fleet.
                </p>
                
                {/* Feature Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700/50">
                    <div className="text-2xl font-bold text-blue-400">1s</div>
                    <div className="text-xs text-slate-500">Update Rate</div>
                  </div>
                  <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700/50">
                    <div className="text-2xl font-bold text-cyan-400">99.9%</div>
                    <div className="text-xs text-slate-500">Accuracy</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Feature 2 - Large Card */}
            <div className="group relative bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8 md:p-10 hover:border-red-500/50 hover:shadow-2xl hover:shadow-red-500/20 transition-all duration-500 overflow-hidden animate-fade-in-up [animation-delay:0.2s]">
              {/* Background Graphics */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/5 rounded-full blur-3xl group-hover:bg-red-500/10 transition-all duration-500"></div>
              <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-orange-500/5 rounded-full blur-2xl"></div>
              
              {/* Decorative Shield Pattern */}
              <svg className="absolute top-4 right-4 w-24 h-24 opacity-5" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L4 6v6c0 5.55 3.84 10.74 8 12 4.16-1.26 8-6.45 8-12V6l-8-4z" fill="currentColor" className="text-red-500"/>
              </svg>
              
              <div className="relative">
                <div className="flex items-start justify-between mb-6">
                  <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-orange-600 rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-lg shadow-red-500/50">
                    <Shield className="w-10 h-10 text-white" />
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 border border-red-500/20 rounded-full">
                    <span className="text-xs text-red-400 font-medium">Smart Alerts</span>
                  </div>
                </div>
                
                <h3 className="text-3xl font-bold mb-4 text-white group-hover:text-red-400 transition-colors">Theft & Safety Alerts</h3>
                <p className="text-slate-400 text-lg mb-6 leading-relaxed">
                  Get instant notifications for overspeed, geofence violations, and suspicious activity. Stay protected 24/7.
                </p>
                
                {/* Alert Types */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-400"></div>
                    <span>Overspeed Detection</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    <div className="w-1.5 h-1.5 rounded-full bg-orange-400"></div>
                    <span>Geofence Violations</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    <div className="w-1.5 h-1.5 rounded-full bg-yellow-400"></div>
                    <span>Unauthorized Movement</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            {/* Feature 3 - Medium Card */}
            <div className="group relative bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 hover:border-cyan-500/50 hover:shadow-xl hover:shadow-cyan-500/20 transition-all duration-500 transform hover:scale-105 hover:-translate-y-2 overflow-hidden animate-fade-in-up [animation-delay:0.3s]">
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-cyan-500/5 rounded-full blur-2xl"></div>
              
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-cyan-600 to-blue-600 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-lg shadow-cyan-500/50">
                  <Clock className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-3 text-white group-hover:text-cyan-400 transition-colors">Trip History</h3>
                <p className="text-slate-400 mb-4 leading-relaxed">
                  Review complete journey history with route playback and detailed stop analysis.
                </p>
                <div className="flex items-center gap-2 text-sm text-cyan-400">
                  <span>View Details</span>
                  <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Feature 4 - Medium Card */}
            <div className="group relative bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 hover:border-green-500/50 hover:shadow-xl hover:shadow-green-500/20 transition-all duration-500 transform hover:scale-105 hover:-translate-y-2 overflow-hidden animate-fade-in-up [animation-delay:0.4s]">
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-green-500/5 rounded-full blur-2xl"></div>
              
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-lg shadow-green-500/50">
                  <BarChart3 className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-3 text-white group-hover:text-green-400 transition-colors">Fleet Analytics</h3>
                <p className="text-slate-400 mb-4 leading-relaxed">
                  Comprehensive analytics on fuel consumption, driver behavior, and fleet efficiency.
                </p>
                <div className="flex items-center gap-2 text-sm text-green-400">
                  <span>View Reports</span>
                  <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </div>
            
            {/* Feature 5 - Medium Card */}
            <div className="group relative bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 hover:border-purple-500/50 hover:shadow-xl hover:shadow-purple-500/20 transition-all duration-500 transform hover:scale-105 hover:-translate-y-2 overflow-hidden animate-fade-in-up [animation-delay:0.5s]">
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-purple-500/5 rounded-full blur-2xl"></div>
              
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-lg shadow-purple-500/50">
                  <Zap className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-3 text-white group-hover:text-purple-400 transition-colors">Route Optimization</h3>
                <p className="text-slate-400 mb-4 leading-relaxed">
                  AI-powered route planning to reduce fuel costs and improve delivery times.
                </p>
                <div className="flex items-center gap-2 text-sm text-purple-400">
                  <span>Optimize Now</span>
                  <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-32 px-6 bg-gradient-to-b from-[#0a0a0f] via-blue-950/10 to-[#0a0a0f] relative overflow-hidden">
        {/* Subtle Background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-5"></div>
        
        <div className="max-w-7xl mx-auto relative">
          <div className="text-center mb-16 animate-fade-in-up">
            <div className="inline-block mb-4">
              <span className="px-4 py-2 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-full text-sm font-semibold text-blue-400 backdrop-blur-sm">
                ⚡ Simple Process
              </span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent">
                How Fleetzi Works
              </span>
            </h2>
            <p className="text-xl text-slate-400">Get started in three simple steps</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
            {/* Step 1 */}
            <div className="relative text-center animate-fade-in-up [animation-delay:0.2s]">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-500/30 relative z-10 hover:scale-105 transition-transform duration-300">
                <span className="text-3xl font-bold">1</span>
              </div>
              <div className="mb-4">
                <MapPin className="w-12 h-12 text-blue-400 mx-auto" />
              </div>
              <h3 className="text-2xl font-bold mb-3 text-white">Install GPS Device</h3>
              <p className="text-slate-400">
                Easy installation with our GPS hardware or use our mobile app for instant tracking.
              </p>
            </div>

            {/* Step 2 */}
            <div className="relative text-center animate-fade-in-up [animation-delay:0.4s]">
              <div className="w-20 h-20 bg-gradient-to-br from-cyan-600 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-cyan-500/30 relative z-10 hover:scale-105 transition-transform duration-300">
                <span className="text-3xl font-bold">2</span>
              </div>
              <div className="mb-4">
                <BarChart3 className="w-12 h-12 text-cyan-400 mx-auto" />
              </div>
              <h3 className="text-2xl font-bold mb-3 text-white">Track Vehicles Live</h3>
              <p className="text-slate-400">
                Monitor all your vehicles in real-time from our web dashboard or mobile app.
              </p>
            </div>

            {/* Step 3 */}
            <div className="relative text-center animate-fade-in-up [animation-delay:0.6s]">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-500/30 relative z-10 hover:scale-105 transition-transform duration-300">
                <span className="text-3xl font-bold">3</span>
              </div>
              <div className="mb-4">
                <Zap className="w-12 h-12 text-blue-400 mx-auto" />
              </div>
              <h3 className="text-2xl font-bold mb-3 text-white">Receive Alerts & Reports</h3>
              <p className="text-slate-400">
                Get automatic notifications and detailed reports to optimize your fleet operations.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* India Focus */}
      <section className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-12 relative overflow-hidden hover:border-blue-500/50 transition-all duration-500 animate-fade-in-up">
            <div className="absolute inset-0 opacity-20">
              <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500 rounded-full blur-3xl animate-float"></div>
              <div className="absolute bottom-0 left-0 w-96 h-96 bg-cyan-500 rounded-full blur-3xl animate-float [animation-delay:2s]"></div>
            </div>

            <div className="relative grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-block px-4 py-2 bg-gradient-to-r from-orange-500 to-green-500 rounded-full text-sm font-semibold mb-6">
                  🇮🇳 Made for India
                </div>
                <h2 className="text-4xl md:text-5xl font-bold mb-6">
                  Optimized for Indian Roads
                </h2>
                <p className="text-xl text-gray-400 mb-8">
                  Built to handle poor network areas, diverse terrain, and real fleet conditions across India.
                </p>
                <div className="space-y-4">
                  <div className="flex items-center gap-3 group/item">
                    <CheckCircle className="w-6 h-6 text-blue-400 flex-shrink-0 group-hover/item:scale-110 transition-transform" />
                    <span className="text-slate-300">Works in low network areas</span>
                  </div>
                  <div className="flex items-center gap-3 group/item">
                    <CheckCircle className="w-6 h-6 text-blue-400 flex-shrink-0 group-hover/item:scale-110 transition-transform" />
                    <span className="text-slate-300">Supports trucks, taxis, delivery fleets, and personal cars</span>
                  </div>
                  <div className="flex items-center gap-3 group/item">
                    <CheckCircle className="w-6 h-6 text-blue-400 flex-shrink-0 group-hover/item:scale-110 transition-transform" />
                    <span className="text-slate-300">Optimized for Indian traffic patterns</span>
                  </div>
                  <div className="flex items-center gap-3 group/item">
                    <CheckCircle className="w-6 h-6 text-blue-400 flex-shrink-0 group-hover/item:scale-110 transition-transform" />
                    <span className="text-slate-300">24/7 support in local languages</span>
                  </div>
                </div>
              </div>

              <div className="relative">
                <div className="bg-gradient-to-br from-slate-900/80 to-slate-800/80 rounded-2xl p-8 border border-slate-700/50 hover:border-blue-500/50 transition-all">
                  <div className="text-center mb-6">
                    <div className="text-6xl mb-4">🗺️</div>
                    <h3 className="text-2xl font-bold text-white">Pan-India Coverage</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-800/50 rounded-lg p-3 text-center hover:bg-blue-500/20 hover:scale-105 transition-all duration-300 cursor-pointer border border-slate-700/30 hover:border-blue-500/50">
                      <div className="text-blue-400 font-bold">Mumbai</div>
                    </div>
                    <div className="bg-slate-800/50 rounded-lg p-3 text-center hover:bg-blue-500/20 hover:scale-105 transition-all duration-300 cursor-pointer border border-slate-700/30 hover:border-blue-500/50">
                      <div className="text-blue-400 font-bold">Delhi</div>
                    </div>
                    <div className="bg-slate-800/50 rounded-lg p-3 text-center hover:bg-blue-500/20 hover:scale-105 transition-all duration-300 cursor-pointer border border-slate-700/30 hover:border-blue-500/50">
                      <div className="text-blue-400 font-bold">Bangalore</div>
                    </div>
                    <div className="bg-slate-800/50 rounded-lg p-3 text-center hover:bg-blue-500/20 hover:scale-105 transition-all duration-300 cursor-pointer border border-slate-700/30 hover:border-blue-500/50">
                      <div className="text-blue-400 font-bold">Chennai</div>
                    </div>
                    <div className="bg-slate-800/50 rounded-lg p-3 text-center hover:bg-blue-500/20 hover:scale-105 transition-all duration-300 cursor-pointer border border-slate-700/30 hover:border-blue-500/50">
                      <div className="text-blue-400 font-bold">Kolkata</div>
                    </div>
                    <div className="bg-slate-800/50 rounded-lg p-3 text-center hover:bg-blue-500/20 hover:scale-105 transition-all duration-300 cursor-pointer border border-slate-700/30 hover:border-blue-500/50">
                      <div className="text-blue-400 font-bold">Hyderabad</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="relative py-32 px-6 overflow-hidden">
        {/* Subtle Background */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-950/5 to-transparent"></div>
        
        <div className="max-w-7xl mx-auto relative">
          <div className="text-center mb-16 animate-fade-in-up">
            <div className="inline-block mb-4">
              <span className="px-4 py-2 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-full text-sm font-semibold text-blue-400 backdrop-blur-sm">
                💰 Flexible Plans
              </span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent">
                Simple, Transparent Pricing
              </span>
            </h2>
            <p className="text-xl text-slate-400 mb-8">Choose the plan that fits your needs</p>

            {/* Pricing Toggle */}
            <div className="inline-flex items-center gap-4 bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-full p-2 hover:border-blue-500/50 transition-all duration-300 animate-fade-in-up [animation-delay:0.1s]">
              <button
                onClick={() => setPricingPeriod('monthly')}
                className={`px-6 py-2 rounded-full transition-all duration-300 ${
                  pricingPeriod === 'monthly'
                    ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg shadow-blue-500/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setPricingPeriod('yearly')}
                className={`px-6 py-2 rounded-full transition-all duration-300 ${
                  pricingPeriod === 'yearly'
                    ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg shadow-blue-500/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Yearly
                <span className="ml-2 text-xs bg-green-500 text-white px-2 py-1 rounded-full">Save 20%</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Basic Plan */}
            <div className="group bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 hover:border-blue-500/50 transition-all duration-300 animate-fade-in-up [animation-delay:0.2s]">
              <h3 className="text-2xl font-bold mb-2 text-white group-hover:text-blue-400 transition-colors">Basic</h3>
              <p className="text-slate-400 mb-6">Perfect for individuals</p>
              <div className="mb-6">
                <span className="text-5xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">₹{pricingPeriod === 'monthly' ? '299' : '2,999'}</span>
                <span className="text-slate-400">/{pricingPeriod === 'monthly' ? 'month' : 'year'}</span>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-blue-400 flex-shrink-0" />
                  <span>1 Vehicle</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-blue-400 flex-shrink-0" />
                  <span>Real-time tracking</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-blue-400 flex-shrink-0" />
                  <span>Basic alerts</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-blue-400 flex-shrink-0" />
                  <span>30-day history</span>
                </li>
              </ul>
              <button className="w-full py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl hover:bg-slate-700 hover:border-blue-500/50 transition-all duration-300 group-hover:shadow-lg group-hover:shadow-blue-500/20">
                Get Started
              </button>
            </div>

            {/* Pro Plan - Most Popular */}
            <div className="group bg-gradient-to-br from-blue-500/20 to-cyan-500/20 backdrop-blur-xl border-2 border-blue-500 rounded-2xl p-8 relative transform scale-105 shadow-2xl shadow-blue-500/30 hover:shadow-blue-500/40 transition-all duration-300 animate-fade-in-up [animation-delay:0.3s]">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-full text-sm font-semibold shadow-lg shadow-blue-500/50">
                Most Popular
              </div>
              <h3 className="text-2xl font-bold mb-2 text-white">Pro</h3>
              <p className="text-slate-400 mb-6">Best for small fleets</p>
              <div className="mb-6">
                <span className="text-5xl font-bold bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">₹{pricingPeriod === 'monthly' ? '799' : '7,999'}</span>
                <span className="text-slate-400">/{pricingPeriod === 'monthly' ? 'month' : 'year'}</span>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-blue-400 flex-shrink-0" />
                  <span>Up to 5 Vehicles</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-blue-400 flex-shrink-0" />
                  <span>Real-time tracking</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-blue-400 flex-shrink-0" />
                  <span>Advanced alerts</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-blue-400 flex-shrink-0" />
                  <span>90-day history</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-blue-400 flex-shrink-0" />
                  <span>Trip playback</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-blue-400 flex-shrink-0" />
                  <span>Analytics & reports</span>
                </li>
              </ul>
              <button className="w-full py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 rounded-xl transition-all duration-300 font-semibold shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 hover:scale-105">
                Get Started
              </button>
            </div>

            {/* Fleet Plan */}
            <div className="group bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 hover:border-cyan-500/50 transition-all duration-300 animate-fade-in-up [animation-delay:0.4s]">
              <h3 className="text-2xl font-bold mb-2 text-white group-hover:text-cyan-400 transition-colors">Fleet</h3>
              <p className="text-slate-400 mb-6">For large operations</p>
              <div className="mb-6">
                <span className="text-5xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">Custom</span>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-blue-400 flex-shrink-0" />
                  <span>Unlimited Vehicles</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-blue-400 flex-shrink-0" />
                  <span>Everything in Pro</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-blue-400 flex-shrink-0" />
                  <span>Unlimited history</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-blue-400 flex-shrink-0" />
                  <span>API access</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-blue-400 flex-shrink-0" />
                  <span>Dedicated support</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-blue-400 flex-shrink-0" />
                  <span>Custom integrations</span>
                </li>
              </ul>
              <button className="w-full py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl hover:bg-slate-700 hover:border-cyan-500/50 transition-all duration-300 group-hover:shadow-lg group-hover:shadow-cyan-500/20">
                Contact Sales
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-32 px-6 bg-gradient-to-b from-[#0a0a0f] via-blue-950/10 to-[#0a0a0f] relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-10"></div>
        <div className="max-w-7xl mx-auto relative">
          <div className="text-center mb-16 animate-fade-in-up">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent">
                Trusted by Fleet Owners
              </span>
            </h2>
            <p className="text-xl text-gray-400">See what our customers say about us</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            {/* Testimonial 1 */}
            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 hover:border-blue-500/50 hover:shadow-xl hover:shadow-blue-500/20 transition-all duration-500 transform hover:scale-105 animate-fade-in-up [animation-delay:0.1s]">
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-slate-300 mb-6">
                "Fleetzi has transformed how we manage our delivery fleet. Real-time tracking and alerts have reduced fuel costs by 25%!"
              </p>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-full flex items-center justify-center text-xl font-bold shadow-lg shadow-blue-500/30">
                  R
                </div>
                <div>
                  <div className="font-semibold">Rajesh Kumar</div>
                  <div className="text-sm text-gray-400">Logistics Company, Mumbai</div>
                </div>
              </div>
            </div>

            {/* Testimonial 2 */}
            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 hover:border-cyan-500/50 hover:shadow-xl hover:shadow-cyan-500/20 transition-all duration-500 transform hover:scale-105 animate-fade-in-up [animation-delay:0.2s]">
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-slate-300 mb-6">
                "The best GPS tracking solution for Indian conditions. Works perfectly even in remote areas with poor network coverage."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-cyan-600 to-blue-600 rounded-full flex items-center justify-center text-xl font-bold shadow-lg shadow-cyan-500/30">
                  P
                </div>
                <div>
                  <div className="font-semibold">Priya Sharma</div>
                  <div className="text-sm text-gray-400">Taxi Fleet Owner, Delhi</div>
                </div>
              </div>
            </div>

            {/* Testimonial 3 */}
            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 hover:border-blue-500/50 hover:shadow-xl hover:shadow-blue-500/20 transition-all duration-500 transform hover:scale-105 animate-fade-in-up [animation-delay:0.3s]">
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-slate-300 mb-6">
                "Simple to use, powerful features, and excellent customer support. Highly recommend for any fleet business in India."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-full flex items-center justify-center text-xl font-bold shadow-lg shadow-blue-500/30">
                  A
                </div>
                <div>
                  <div className="font-semibold">Amit Patel</div>
                  <div className="text-sm text-gray-400">Transport Services, Ahmedabad</div>
                </div>
              </div>
            </div>
          </div>

          {/* Trust Metric */}
          <div className="text-center animate-fade-in-up [animation-delay:0.4s]">
            <div className="inline-block bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl px-8 py-6 hover:border-blue-500/50 hover:scale-105 transition-all duration-300">
              <div className="text-5xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent mb-2">
                1,000+
              </div>
              <div className="text-gray-400">Journeys tracked in testing</div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Form Section */}
      <section id="contact" className="relative py-32 px-6 overflow-hidden">
        {/* Background Graphics */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-950/10 to-transparent"></div>
        <div className="absolute top-1/4 left-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl"></div>
        
        <div className="max-w-7xl mx-auto relative">
          <div className="text-center mb-16 animate-fade-in-up">
            <div className="inline-block mb-4">
              <span className="px-4 py-2 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-full text-sm font-semibold text-blue-400 backdrop-blur-sm">
                📧 Get In Touch
              </span>
            </div>
            <h2 className="text-4xl md:text-6xl font-bold mb-6">
              <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent">
                Ready to Transform
              </span>
              <br />
              <span className="bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                Your Fleet Management?
              </span>
            </h2>
            <p className="text-xl text-slate-400 max-w-3xl mx-auto">Drop us a message and our team will get back to you within 24 hours</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Info */}
            <div className="space-y-8 animate-fade-in-up [animation-delay:0.2s]">
              <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8 hover:border-blue-500/50 transition-all duration-500">
                <h3 className="text-2xl font-bold mb-6 text-white">Why Choose Fleetzi?</h3>
                <div className="space-y-6">
                  <div className="flex items-start gap-4 group">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform shadow-lg shadow-blue-500/30">
                      <MapPin className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-white mb-1">Real-Time Tracking</h4>
                      <p className="text-slate-400 text-sm">Track your entire fleet with 1-second GPS updates</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4 group">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-600 to-emerald-600 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform shadow-lg shadow-green-500/30">
                      <Shield className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-white mb-1">Advanced Security</h4>
                      <p className="text-slate-400 text-sm">Instant alerts for theft, overspeed, and violations</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4 group">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform shadow-lg shadow-purple-500/30">
                      <BarChart3 className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-white mb-1">Smart Analytics</h4>
                      <p className="text-slate-400 text-sm">Detailed reports to optimize fuel and efficiency</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4 group">
                    <div className="w-12 h-12 bg-gradient-to-br from-orange-600 to-red-600 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform shadow-lg shadow-orange-500/30">
                      <Zap className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-white mb-1">24/7 Support</h4>
                      <p className="text-slate-400 text-sm">Round-the-clock assistance in local languages</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact Details */}
              <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 backdrop-blur-xl border border-blue-500/30 rounded-3xl p-8">
                <h3 className="text-xl font-bold mb-4 text-white">Contact Information</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-slate-300">
                    <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                      <MessageCircle className="w-4 h-4 text-blue-400" />
                    </div>
                    <span>vaibhavsingh5373@gmail.com</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-300">
                    <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center">
                      <MessageCircle className="w-4 h-4 text-green-400" />
                    </div>
                    <span>WhatsApp Support Available</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <ContactForm />
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-32 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="relative bg-gradient-to-br from-blue-500/10 to-cyan-500/10 backdrop-blur-xl border border-blue-500/30 rounded-3xl p-12 md:p-16 text-center overflow-hidden animate-fade-in-up shadow-2xl shadow-blue-500/20">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 blur-3xl"></div>
            
            <div className="relative">
              <h2 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-white via-blue-100 to-cyan-200 bg-clip-text text-transparent">
                Start tracking your vehicles today with Fleetzi
              </h2>
              <p className="text-xl text-slate-300 mb-10">
                Join hundreds of fleet owners who trust Fleetzi for their GPS tracking needs
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <button className="group px-10 py-5 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 rounded-xl text-lg font-semibold shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all transform hover:scale-105">
                  <span className="flex items-center gap-2">
                    Start Free Demo
                    <Zap className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                  </span>
                </button>
                <a 
                  href="https://wa.me/your-number" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-3 px-10 py-5 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 rounded-xl text-lg font-semibold shadow-lg shadow-green-500/30 hover:shadow-xl hover:shadow-green-500/40 transition-all transform hover:scale-105"
                >
                  <MessageCircle className="w-6 h-6" />
                  Quick Support on WhatsApp
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-[#0a0a0f]">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                  <MapPin className="w-6 h-6 text-white" />
                </div>
                <span className="text-2xl font-bold bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
                  Fleetzi
                </span>
              </div>
              <p className="text-gray-400">
                Your intelligent fleet management platform for real-time GPS tracking.
              </p>
            </div>

            {/* Product */}
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#features" className="hover:text-blue-400 transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-blue-400 transition-colors">Pricing</a></li>
                <li><a href="#how-it-works" className="hover:text-blue-400 transition-colors">How It Works</a></li>
                <li><Link href="/dashboard" className="hover:text-blue-400 transition-colors">Dashboard</Link></li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-blue-400 transition-colors">About</a></li>
                <li><a href="#testimonials" className="hover:text-blue-400 transition-colors">Testimonials</a></li>
                <li><a href="#" className="hover:text-blue-400 transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-blue-400 transition-colors">Blog</a></li>
              </ul>
            </div>

            {/* Support */}
            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-blue-400 transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-blue-400 transition-colors">Contact</a></li>
                <li><a href="mailto:support@safarsaathi.com" className="hover:text-blue-400 transition-colors">support@safarsaathi.com</a></li>
                <li>
                  <a href="https://wa.me/your-number" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-blue-400 transition-colors">
                    <MessageCircle className="w-4 h-4" />
                    WhatsApp
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/10 pt-8 text-center text-gray-400">
            <p>© 2026 Fleetzi. All rights reserved. Built with ❤️ in India.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
