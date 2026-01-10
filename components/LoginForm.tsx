'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Mail, Lock, AlertCircle, Truck, MapPin, Navigation, Activity } from 'lucide-react';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const router = useRouter();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setIsLoading(true);

    try {
      const success = await login(email, password);
      
      if (success) {
        router.push('/dashboard');
      } else {
        setError('Invalid email or password');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Password reset link would be sent to: ' + email);
    setShowForgotPassword(false);
  };

  if (showForgotPassword) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNnoiIHN0cm9rZT0iIzFmMmQzZCIgc3Ryb2tlLXdpZHRoPSIyIi8+PC9nPjwvc3ZnPg==')] opacity-10"></div>
        
        <div className="max-w-md w-full bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-8 relative z-10 border border-white/20">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl mb-4 shadow-lg">
              <Lock className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">Reset Password</h2>
            <p className="text-gray-600 mt-2">Enter your email to receive a reset link</p>
          </div>

          <form onSubmit={handleForgotPassword} className="space-y-6">
            <div>
              <label htmlFor="reset-email" className="block text-sm font-semibold text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  id="reset-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white/50"
                  placeholder="your@email.com"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3.5 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              Send Reset Link
            </button>

            <button
              type="button"
              onClick={() => setShowForgotPassword(false)}
              className="w-full text-blue-600 hover:text-blue-700 font-semibold transition-colors"
            >
              ← Back to Login
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 relative overflow-hidden">
      {/* Animated background pattern */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNnoiIHN0cm9rZT0iIzFmMmQzZCIgc3Ryb2tlLXdpZHRoPSIyIi8+PC9nPjwvc3ZnPg==')] opacity-10"></div>
      
      {/* Floating vehicle icons */}
      <div className="absolute top-20 left-20 animate-bounce" style={{ animationDuration: '3s' }}>
        <Truck className="w-16 h-16 text-blue-400/20" />
      </div>
      <div className="absolute bottom-32 right-32 animate-bounce" style={{ animationDuration: '4s', animationDelay: '1s' }}>
        <Navigation className="w-12 h-12 text-indigo-400/20" />
      </div>
      <div className="absolute top-1/3 right-20 animate-pulse" style={{ animationDuration: '5s' }}>
        <MapPin className="w-14 h-14 text-blue-300/20" />
      </div>
      <div className="absolute bottom-20 left-1/4 animate-pulse" style={{ animationDuration: '6s', animationDelay: '2s' }}>
        <Activity className="w-10 h-10 text-indigo-300/20" />
      </div>

      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 items-center justify-center p-12 relative z-10">
        <div className="max-w-lg">
          <div className="mb-8">
            <div className="inline-flex items-center gap-3 mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-2xl">
                <Truck className="w-9 h-9 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-white">Fleetzi</h1>
                <p className="text-blue-200 text-sm">GPS Fleet Management</p>
              </div>
            </div>
          </div>
          
          <h2 className="text-5xl font-bold text-white mb-6 leading-tight">
            Track Your Fleet in Real-Time
          </h2>
          <p className="text-xl text-blue-100 mb-8 leading-relaxed">
            Monitor vehicles, optimize routes, and manage your entire fleet from one powerful dashboard.
          </p>
          
          <div className="space-y-4">
            <div className="flex items-center gap-4 bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <div className="w-12 h-12 bg-blue-500/30 rounded-lg flex items-center justify-center">
                <MapPin className="w-6 h-6 text-blue-200" />
              </div>
              <div>
                <h3 className="text-white font-semibold">Live GPS Tracking</h3>
                <p className="text-blue-200 text-sm">Real-time location updates</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4 bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <div className="w-12 h-12 bg-indigo-500/30 rounded-lg flex items-center justify-center">
                <Activity className="w-6 h-6 text-indigo-200" />
              </div>
              <div>
                <h3 className="text-white font-semibold">Route Analytics</h3>
                <p className="text-blue-200 text-sm">Detailed trip reports & insights</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4 bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <div className="w-12 h-12 bg-purple-500/30 rounded-lg flex items-center justify-center">
                <Truck className="w-6 h-6 text-purple-200" />
              </div>
              <div>
                <h3 className="text-white font-semibold">Fleet Management</h3>
                <p className="text-blue-200 text-sm">Manage multiple vehicles efficiently</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12 relative z-10">
        <div className="max-w-md w-full bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-8 lg:p-10 border border-white/20">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl mb-6 shadow-xl">
              <Truck className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-2">
              Welcome Back
            </h2>
            <p className="text-gray-600">Sign in to access your fleet dashboard</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-xl flex items-start gap-3 animate-shake">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800 font-medium">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white/50 hover:border-gray-300"
                  placeholder="admin@fleetzi.in"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white/50 hover:border-gray-300"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center cursor-pointer group">
                <input type="checkbox" className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer" />
                <span className="ml-2 text-sm text-gray-600 group-hover:text-gray-900 transition-colors">Remember me</span>
              </label>
              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                className="text-sm text-blue-600 hover:text-blue-700 font-semibold transition-colors"
              >
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3.5 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 active:translate-y-0"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Signing in...
                </span>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-center text-sm text-gray-500">
              Powered by <span className="font-semibold text-gray-700">Fleetzi GPS Solutions</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
