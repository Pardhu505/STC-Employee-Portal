import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Alert, AlertDescription } from './ui/alert';
import { Eye, EyeOff, Building2, Mail, Lock } from 'lucide-react';

const Login = () => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(identifier, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-[#225F8B]/5 via-[#225F8B]/5 to-[#225F8B]/10"></div>
      <div className="shape2 rotate-me">
        <img 
          src="https://showtimeconsulting.in/web/images/thm-shape1.png" 
          alt="About us" 
          className="w-16 h-16 opacity-30"
        />
      </div>
      <Card className="w-full max-w-md relative backdrop-blur-sm bg-white/90 shadow-2xl border-0 z-10">
        <CardHeader className="text-center pb-8">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <img 
                src="https://showtimeconsulting.in/images/settings/2fd13f50.png" 
                alt="Showtime Consulting" 
                className="h-20 w-auto object-contain"
              />
              <div className="absolute -inset-1 bg-gradient-to-r from-[#225F8B] to-[#225F8B]/80 rounded-full blur opacity-20"></div>
            </div>
          </div>
          <CardTitle className="text-2xl font-bold bg-sky-700 bg-clip-text text-transparent">
            ShowTime Consulting
          </CardTitle>
          <p className="text-gray-600 text-sm mt-2">
            Employee Portal
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="identifier" className="text-sm font-medium text-gray-700">
                Email or Employee ID
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="identifier"
                  type="text"
                  placeholder="Enter your email or employee ID"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="pl-10 h-12 border-gray-200 focus:border-[#225F8B] focus:ring-[#225F8B]"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 h-12 border-gray-200 focus:border-[#225F8B] focus:ring-[#225F8B]"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 h-4 w-4 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            {error && (
              <Alert className="border-red-200 bg-red-50">
                <AlertDescription className="text-red-700">
                  {error}
                </AlertDescription>
              </Alert>
            )}
            <Button
              type="submit"
              className="w-full h-12 bg-sky-700 hover:bg-sky-800 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-200"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {"Signing in..."}
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <Building2 className="h-4 w-4 mr-2" />
                  {"Sign In"}
                </div>
              )}
            </Button>
            <div className="text-center mt-2">
              <button
                type="button"
                className="text-black hover:underline text-sm"
                onClick={() => navigate('/signup')}
              >
                {"Don't have an account? Sign Up"}
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;