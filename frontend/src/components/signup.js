import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Alert, AlertDescription } from './ui/alert';
import { Eye, EyeOff, Building2, Mail, Lock, UserPlus } from 'lucide-react';

const DEPARTMENT_TEAMS = {
    "Research": ["Research"],
    "Media": ["Media"],
    "Data": ["Data"],
    "DMC": [
        "Digital Production",
        "Digital Communication",
        "Propagation",
        "Neagitive Propagation",
        "Digital Marketing/Networking",
        "HIVE"
    ],
    "Campaign": ["Campaign"],
    "Soul Central": [
        "Soul Central",
        "Field Team AP-1",
        "Field Team AP-2",
        "Field Team TG",
        "PMU"
    ],
    "Directors team": [
        "Directors Team-1",
        "Directors Team-2",
        "Directors Team-3"
    ],
    "HR": ["HR"],
    "Admin": [
        "Operations",
        "System Admin"
    ]
};

const DEPARTMENTS = Object.keys(DEPARTMENT_TEAMS);

const Signup = () => {
    // Corrected the array name to avoid confusion with the state variable
    const designationsList = ["Reporting manager", "Employee", "Zonal Managers"];

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [empCode, setEmpCode] = useState('');
    const [designation, setDesignation] = useState('');
    const [department, setDepartment] = useState('');
    const [team, setTeam] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const { signup } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await signup({
                name: `${firstName} ${lastName}`,
                email,
                password,
                designation,
                department,
                team,
                empCode
            });
            navigate('/dashboard');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const teamOptions = department ? DEPARTMENT_TEAMS[department] : [];

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
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="firstName" className="text-sm font-medium text-gray-700">
                                    First Name
                                </Label>
                                <Input
                                    id="firstName"
                                    type="text"
                                    placeholder="Enter your first name"
                                    value={firstName}
                                    onChange={(e) => setFirstName(e.target.value)}
                                    className="h-12 border-gray-200 focus:border-[#225F8B] focus:ring-[#225F8B]"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="lastName" className="text-sm font-medium text-gray-700">
                                    Last Name
                                </Label>
                                <Input
                                    id="lastName"
                                    type="text"
                                    placeholder="Enter your last name"
                                    value={lastName}
                                    onChange={(e) => setLastName(e.target.value)}
                                    className="h-12 border-gray-200 focus:border-[#225F8B] focus:ring-[#225F8B]"
                                    required
                                />
                            </div>
                            <div className="space-y-2 col-span-2">
                                <Label htmlFor="empCode" className="text-sm font-medium text-gray-700">
                                    EMP Code
                                </Label>
                                <Input
                                    id="empCode"
                                    type="text"
                                    placeholder="Enter your EMP Code"
                                    value={empCode}
                                    onChange={(e) => setEmpCode(e.target.value)}
                                    className="h-12 border-gray-200 focus:border-[#225F8B] focus:ring-[#225F8B]"
                                    required
                                />
                            </div>
                            <div className="space-y-2 col-span-2">
                                <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                                    Email Address
                                </Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="Enter your email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="pl-10 h-12 border-gray-200 focus:border-[#225F8B] focus:ring-[#225F8B]"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="space-y-2 col-span-2">
                                <Label htmlFor="designation" className="text-sm font-medium text-gray-700">
                                    Designation
                                </Label>
                                <div className="relative">
                                    <Building2 className="absolute left-3 top-3 h-4 w-4 text-gray-400 z-10" />
                                    {/* Corrected the mapping to use designationsList */}
                                    <select
                                        id="designation"
                                        value={designation}
                                        onChange={e => {
                                            setDesignation(e.target.value);
                                        }}
                                        className="pl-10 h-12 border border-gray-200 focus:border-[#225F8B] focus:ring-[#225F8B] w-full rounded px-3 outline-none appearance-none"
                                        required
                                    >
                                        <option value="">Select designation</option>
                                        {designationsList.map(desg => (
                                            <option key={desg} value={desg}>{desg}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="space-y-2 col-span-2">
                                <Label htmlFor="department" className="text-sm font-medium text-gray-700">
                                    Department
                                </Label>
                                <div className="relative">
                                    <Building2 className="absolute left-3 top-3 h-4 w-4 text-gray-400 z-10" />
                                    <select
                                        id="department"
                                        value={department}
                                        onChange={e => {
                                            setDepartment(e.target.value);
                                            setTeam('');
                                        }}
                                        className="pl-10 h-12 border border-gray-200 focus:border-[#225F8B] focus:ring-[#225F8B] w-full rounded px-3 outline-none appearance-none"
                                        required
                                    >
                                        <option value="">Select department</option>
                                        {DEPARTMENTS.map(dep => (
                                            <option key={dep} value={dep}>{dep}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="space-y-2 col-span-2">
                                <Label htmlFor="team" className="text-sm font-medium text-gray-700">
                                    Team
                                </Label>
                                <div className="relative">
                                    <Building2 className="absolute left-3 top-3 h-4 w-4 text-gray-400 z-10" />
                                    <select
                                        id="team"
                                        value={team}
                                        onChange={e => setTeam(e.target.value)}
                                        className="pl-10 h-12 border border-gray-200 focus:border-[#225F8B] focus:ring-[#225F8B] w-full rounded px-3 outline-none appearance-none"
                                        required
                                        disabled={!department}
                                    >
                                        <option value="">Select team</option>
                                        {teamOptions.map(t => (
                                            <option key={t} value={t}>{t}</option>
                                        ))}
                                    </select>
                                </div>
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
                                    {"Signing up..."}
                                </div>
                            ) : (
                                <div className="flex items-center justify-center">
                                    <UserPlus className="h-4 w-4 mr-2" />
                                    {"Sign Up"}
                                </div>
                            )}
                        </Button>
                        <div className="text-center mt-2">
                            <button
                                type="button"
                                className="text-black hover:underline text-sm"
                                onClick={() => navigate('/login')}
                            >
                                {"Already have an account? Sign In"}
                            </button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};

export default Signup;