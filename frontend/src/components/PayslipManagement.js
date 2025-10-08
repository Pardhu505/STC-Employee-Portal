import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback } from './ui/avatar';
import { 
  Upload, 
  Download, 
  FileText, 
  Calendar, 
  User, 
  Building, 
  Filter,
  Search,
  X,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { getAllEmployees } from '../data/mock';
import { useToast } from '../hooks/use-toast';

const PayslipManagement = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [employees, setEmployees] = useState([]);
  const [payslips, setPayslips] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [uploadFile, setUploadFile] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [filterYear, setFilterYear] = useState('');

  const isAdmin = user?.isAdmin || user?.email === 'admin@showtimeconsulting.in';

  // Load employees and payslips
  useEffect(() => {
    setEmployees(getAllEmployees());
    
    // Load payslips from localStorage
    const savedPayslips = localStorage.getItem('payslips');
    if (savedPayslips) {
      setPayslips(JSON.parse(savedPayslips));
    }
  }, []);

  // Save payslips to localStorage
  useEffect(() => {
    if (payslips.length > 0) {
      localStorage.setItem('payslips', JSON.stringify(payslips));
    }
  }, [payslips]);

  // Generate months and years
  const months = [
    { value: '01', label: 'January' },
    { value: '02', label: 'February' },
    { value: '03', label: 'March' },
    { value: '04', label: 'April' },
    { value: '05', label: 'May' },
    { value: '06', label: 'June' },
    { value: '07', label: 'July' },
    { value: '08', label: 'August' },
    { value: '09', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' }
  ];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file && file.type === 'application/pdf') {
      setUploadFile(file);
    } else {
      toast({
        title: "Invalid File",
        description: "Please select a PDF file.",
        variant: "destructive"
      });
    }
  };

  const handleUploadPayslip = () => {
    if (!selectedEmployee || !selectedMonth || !selectedYear || !uploadFile) {
      toast({
        title: "Missing Information",
        description: "Please fill all fields and select a PDF file.",
        variant: "destructive"
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const payslip = {
        id: Date.now(),
        employeeEmail: selectedEmployee,
        employeeName: employees.find(emp => emp["Email ID"] === selectedEmployee)?.Name,
        month: selectedMonth,
        year: selectedYear,
        fileName: uploadFile.name,
        fileData: e.target.result, // Base64 data
        uploadDate: new Date().toISOString(),
        uploadedBy: user.name
      };

      setPayslips([...payslips, payslip]);
      
      // Reset form
      setSelectedEmployee('');
      setSelectedMonth('');
      setSelectedYear('');
      setUploadFile(null);
      
      toast({
        title: "Payslip Uploaded",
        description: "Payslip has been successfully uploaded.",
      });
    };
    reader.readAsDataURL(uploadFile);
  };

  const handleDownloadPayslip = (payslip) => {
    // Create download link
    const link = document.createElement('a');
    link.href = payslip.fileData;
    link.download = payslip.fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getFilteredPayslips = () => {
    let filtered = payslips;

    // If not admin, show only user's payslips
    if (!isAdmin) {
      filtered = filtered.filter(payslip => payslip.employeeEmail === user.email);
    }

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(payslip => 
        payslip.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payslip.employeeEmail.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply month filter
    if (filterMonth) {
      filtered = filtered.filter(payslip => payslip.month === filterMonth);
    }

    // Apply year filter
    if (filterYear) {
      filtered = filtered.filter(payslip => payslip.year === filterYear);
    }

    return filtered.sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate));
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getMonthName = (monthValue) => {
    const month = months.find(m => m.value === monthValue);
    return month ? month.label : monthValue;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Payslip Management</h2>
          <p className="text-gray-600">
            {isAdmin ? 'Upload and manage employee payslips' : 'View and download your payslips'}
          </p>
        </div>
        <Badge variant="outline" className="bg-[#225F8B]/10 text-[#225F8B] border-[#225F8B]/20">
          {isAdmin ? 'Admin Panel' : 'Employee View'}
        </Badge>
      </div>

      {/* Upload Section (Admin Only) */}
      {isAdmin && (
        <Card className="bg-gradient-to-r from-[#225F8B]/5 to-[#225F8B]/10 border-[#225F8B]/20">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Upload className="h-5 w-5" />
              <span>Upload Payslip</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="employee">Employee</Label>
                <select 
                  value={selectedEmployee} 
                  onChange={(e) => setSelectedEmployee(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#225F8B] focus:border-[#225F8B]"
                >
                  <option value="">Select Employee</option>
                  {employees.map((emp) => (
                    <option key={emp["Email ID"]} value={emp["Email ID"]}>
                      {emp.Name} - {emp.Department}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <Label htmlFor="month">Month</Label>
                <select 
                  value={selectedMonth} 
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#225F8B] focus:border-[#225F8B]"
                >
                  <option value="">Select Month</option>
                  {months.map((month) => (
                    <option key={month.value} value={month.value}>
                      {month.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <Label htmlFor="year">Year</Label>
                <select 
                  value={selectedYear} 
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#225F8B] focus:border-[#225F8B]"
                >
                  <option value="">Select Year</option>
                  {years.map((year) => (
                    <option key={year} value={year.toString()}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div>
              <Label htmlFor="file">Payslip File (PDF)</Label>
              <Input
                id="file"
                type="file"
                accept=".pdf"
                onChange={handleFileUpload}
                className="mt-1"
              />
              {uploadFile && (
                <div className="mt-2 flex items-center space-x-2 text-sm text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  <span>{uploadFile.name}</span>
                </div>
              )}
            </div>
            
            <Button
              onClick={handleUploadPayslip}
              disabled={!selectedEmployee || !selectedMonth || !selectedYear || !uploadFile}
              className="bg-[#225F8B] hover:bg-[#225F8B]/90"
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload Payslip
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Filter Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="h-5 w-5" />
            <span>Filter Payslips</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {isAdmin && (
              <div>
                <Label htmlFor="search">Search Employee</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="search"
                    placeholder="Search by name or email"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            )}
            
            <div>
              <Label htmlFor="filterMonth">Month</Label>
              <select 
                value={filterMonth} 
                onChange={(e) => setFilterMonth(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#225F8B] focus:border-[#225F8B]"
              >
                <option value="">All Months</option>
                {months.map((month) => (
                  <option key={month.value} value={month.value}>
                    {month.label}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <Label htmlFor="filterYear">Year</Label>
              <select 
                value={filterYear} 
                onChange={(e) => setFilterYear(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#225F8B] focus:border-[#225F8B]"
              >
                <option value="">All Years</option>
                {years.map((year) => (
                  <option key={year} value={year.toString()}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm('');
                  setFilterMonth('');
                  setFilterYear('');
                }}
              >
                <X className="h-4 w-4 mr-2" />
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payslips List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <span>Payslips</span>
            </div>
            <Badge variant="outline">
              {getFilteredPayslips().length} payslips
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {getFilteredPayslips().length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Payslips Found</h3>
              <p className="text-gray-600">
                {isAdmin ? 'Upload payslips to get started.' : 'No payslips have been uploaded for you yet.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {getFilteredPayslips().map((payslip) => (
                <div
                  key={payslip.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                      <FileText className="h-6 w-6 text-red-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">
                        {getMonthName(payslip.month)} {payslip.year}
                      </h4>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        {isAdmin && (
                          <div className="flex items-center space-x-1">
                            <User className="h-4 w-4" />
                            <span>{payslip.employeeName}</span>
                          </div>
                        )}
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-4 w-4" />
                          <span>Uploaded: {formatDate(payslip.uploadDate)}</span>
                        </div>
                        {isAdmin && (
                          <div className="flex items-center space-x-1">
                            <Building className="h-4 w-4" />
                            <span>By: {payslip.uploadedBy}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button
                    onClick={() => handleDownloadPayslip(payslip)}
                    className="bg-[#225F8B] hover:bg-[#225F8B]/90"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PayslipManagement;