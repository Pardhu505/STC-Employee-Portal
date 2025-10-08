import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Separator } from './ui/separator';
import { User, Building, Users, Calendar, Edit3, Save, X, Network, ChevronRight, Lock, Eye, EyeOff, Upload, Trash2 } from 'lucide-react';
import { useToast } from '../hooks/use-toast';
import { fetchUserProfile, updateUserProfile, fetchEmployeesWorkDetails } from '../api'; // Correctly import from api.js
import { employeeAPI } from '../Services/api'; // Keep for other functions if needed

const UserProfile = () => {
  const { user, updateProfile, uploadProfilePicture, removeProfilePicture } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    emergency_contact: '',
    date_of_birth: ''
  });

  // State for fetched data from API
  const [userDetails, setUserDetails] = useState(null);
  const [allEmployees, setAllEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Fetch user and employee data from API
  useEffect(() => {
      const fetchData = async () => {
          if (!user?.email) return;

          try {
              setLoading(true);

              // Fetch all employees for the org chart and team view
              const allEmps = await fetchEmployeesWorkDetails();
              setAllEmployees(allEmps);

              // Fetch the current user's specific, enriched details
              const currentUserDetails = await fetchUserProfile(user.email);

              if (!currentUserDetails) {
                  console.warn(`⚠️ No user details found for email: ${user.email}`);
              }

              setUserDetails(currentUserDetails);

          } catch (error) {
              console.error("❌ Error fetching profile data:", error);
              toast({
                  title: "Error",
                  description: error.message || "Failed to load profile data.",
                  variant: "destructive",
              });
          } finally {
              setLoading(false);
          }
      };
      fetchData();
  }, [user?.email, toast]);

  // Sync formData with userDetails from API or user from AuthContext
  useEffect(() => {
    const source = userDetails || user;
    if (source) {
      setFormData({
        name: source.name || '',
        email: source.email || '',
        phone: source.phone || '',
        emergency_contact: source.emergency_contact || '',
        date_of_birth: source.date_of_birth ? source.date_of_birth.split('T')[0] : '' // Format for date input
      });
    }
  }, [user, userDetails]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePasswordChange = (field, value) => {
    setPasswordData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    try {
      // Use the new, more specific API endpoint for updating the user's own profile
      const updatedUser = await updateUserProfile(user.email, formData);
      // Update the user in AuthContext and localStorage
      updateProfile(updatedUser);
      setIsEditing(false);
      toast({
        title: "Profile Updated",
        description: "Your profile information has been saved successfully.",
      });
    } catch (error) {
      console.error("Failed to update profile:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handlePasswordSave = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "Error",
        description: "New passwords do not match.",
        variant: "destructive"
      });
      return;
    }

    try {
      // This functionality isn't in api.js, so we'll implement it here for now.
      const response = await fetch(`http://localhost:8000/api/users/${user.email}/change-password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ current_password: passwordData.currentPassword, new_password: passwordData.newPassword }),
      });

      if (!response.ok) throw new Error((await response.json()).detail || 'Failed to change password.');
      toast({
        title: "Password Updated",
        description: "Your password has been changed successfully.",
      });
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setShowPasswordChange(false);
    } catch (error) {
      console.error("Failed to change password:", error);
      toast({
        title: "Password Change Error",
        description: error.message || "Failed to change password.",
        variant: "destructive",
      });
    }
  };

  const handleCancel = () => {
    const source = userDetails || user;
    setFormData({
      name: source.name || '',
      email: source.email || '',
      phone: source.phone || '',
      emergency_contact: source.emergency_contact || '',
      date_of_birth: source.date_of_birth ? source.date_of_birth.split('T')[0] : ''
    });
    setIsEditing(false);
  };

  // Profile picture handlers
  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const handleUploadPicture = async () => {
    if (!selectedFile) return;
    setUploading(true);
    try {
      const base64 = await uploadProfilePicture(selectedFile);
      updateProfile({ profilePicture: base64 });
      toast({
        title: "Profile Picture Updated",
        description: "Your profile picture has been uploaded.",
      });
      setSelectedFile(null);
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to upload profile picture.",
        variant: "destructive"
      });
    }
    setUploading(false);
  };

  const handleRemovePicture = async () => {
    setUploading(true);
    try {
      // Use the centralized function from AuthContext
      await removeProfilePicture();

      toast({
        title: "Profile Picture Removed",
        description: "Your profile picture has been removed.",
      });
    } catch (error) {
      console.error("Failed to remove profile picture:", error);
      toast({
        title: "Error",
        description: "Failed to remove profile picture. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const { teammates, manager, directReports } = useMemo(() => {
    if (!userDetails || allEmployees.length === 0) {
        return { teammates: [], manager: null, directReports: [] };
    }

    const currentTeammates = allEmployees.filter(emp =>
      emp.department === userDetails.department &&
      emp.team === userDetails.team &&
      emp.email !== userDetails.email
    );

    const currentManager = allEmployees.find(emp => userDetails.reviewer?.includes(emp.name));

    const currentDirectReports = allEmployees.filter(emp => emp.reviewer?.includes(userDetails.name));

    return { teammates: currentTeammates, manager: currentManager, directReports: currentDirectReports };
  }, [userDetails, allEmployees]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">User Profile</h2>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={() => setShowPasswordChange(!showPasswordChange)}
            className="text-gray-600"
          >
            <Lock className="h-4 w-4 mr-2" />
            Change Password
          </Button>
          <Button
            variant={isEditing ? "outline" : "default"}
            onClick={() => setIsEditing(!isEditing)}
            className={isEditing ? "text-gray-600" : "bg-gradient-to-r from-[#225F8B] to-[#225F8B]/80 text-white"}
          >
            {isEditing ? (
              <><X className="h-4 w-4 mr-2" />Cancel</>
            ) : (
              <><Edit3 className="h-4 w-4 mr-2" />Edit Profile</>
            )}
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Summary */}
        <Card className="lg:col-span-1 bg-gradient-to-br from-[#225F8B]/10 to-[#225F8B]/20 border-[#225F8B]/20">
          <CardContent className="p-6">
            <div className="text-center">
              <Avatar key={user?.profilePicture || 'no-picture'} className="w-24 h-24 mx-auto mb-4">
                {user?.profilePicture ? (
                  <AvatarImage src={user.profilePicture} alt="Profile" />
                ) : (
                  <AvatarFallback className="bg-gradient-to-r from-[#225F8B] to-[#225F8B]/80 text-white text-2xl">
                    {user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </AvatarFallback>
                )}
              </Avatar>
              {isEditing && (
                <div className="flex justify-center space-x-2 mb-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                    ref={fileInputRef}
                    disabled={uploading}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={uploading}
                    type="button"
                    onClick={() => fileInputRef.current && fileInputRef.current.click()}
                  >
                    <Upload className="h-4 w-4 mr-1" />
                    Upload
                  </Button>
                  {user?.profilePicture && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemovePicture()}
                      disabled={uploading}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Remove
                    </Button>
                  )}
                  {selectedFile && (
                    <Button
                      size="sm"
                      onClick={handleUploadPicture}
                      disabled={uploading}
                      className="bg-gradient-to-r from-[#225F8B] to-[#225F8B]/80 text-white"
                    >
                      {uploading ? "Uploading..." : "Save"}
                    </Button>
                  )}
                </div>
              )}
              <h3 className="text-xl font-bold text-gray-900 mb-2">{user?.name}</h3>
              <p className="text-gray-600 mb-4">{user?.designation}</p>
              <Badge variant="outline" className="bg-white/50 text-[#225F8B] border-[#225F8B]/20">
                {user?.department}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Profile Details */}
        <Card className="lg:col-span-2 bg-white/80 backdrop-blur-sm border-0">
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="h-5 w-5 mr-2" />
              Profile Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                  Full Name
                </Label>
                {isEditing ? (
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="mt-1"
                  />
                ) : (
                  <p className="mt-1 text-sm text-gray-900">{user?.name}</p>
                )}
              </div>

              <div>
                <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                  Email Address
                </Label>
                {isEditing ? (
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="mt-1"
                  />
                ) : (
                  <p className="mt-1 text-sm text-gray-900">{user?.email}</p>
                )}
              </div>

              <div>
                <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
                  Phone Number
                </Label>
                {isEditing ? (
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="Enter phone number"
                    className="mt-1"
                  />
                ) : (
                  <p className="mt-1 text-sm text-gray-900">{user?.phone || 'Not provided'}</p>
                )}
              </div>

              <div>
                <Label htmlFor="emergency_contact" className="text-sm font-medium text-gray-700">
                  Emergency Contact
                </Label>
                {isEditing ? (
                  <Input
                    id="emergency_contact"
                    type="tel"
                    value={formData.emergency_contact}
                    onChange={(e) => handleInputChange('emergency_contact', e.target.value)}
                    placeholder="Enter emergency contact"
                    className="mt-1"
                  />
                ) : (
                  <p className="mt-1 text-sm text-gray-900">{user?.emergency_contact || 'Not provided'}</p>
                )}
              </div>

              <div>
                <Label htmlFor="date_of_birth" className="text-sm font-medium text-gray-700">
                  Date of Birth
                </Label>
                {isEditing ? (
                  <Input
                    id="date_of_birth"
                    type="date"
                    value={formData.date_of_birth}
                    onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
                    className="mt-1"
                  />
                ) : (
                  <p className="mt-1 text-sm text-gray-900">
                    {formData.date_of_birth ? new Date(formData.date_of_birth).toLocaleDateString('en-CA') : 'Not provided'}
                  </p>
                )}
              </div>
            </div>

            {isEditing && (
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={handleCancel}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  className="bg-gradient-to-r from-[#225F8B] to-[#225F8B]/80 text-white"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Password Change Section */}
      {showPasswordChange && (
        <Card className="bg-white/80 backdrop-blur-sm border-0">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Lock className="h-5 w-5 mr-2" />
              Change Password
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="currentPassword" className="text-sm font-medium text-gray-700">
                  Current Password
                </Label>
                <div className="relative mt-1">
                  <Input
                    id="currentPassword"
                    type={showCurrentPassword ? "text" : "password"}
                    value={passwordData.currentPassword}
                    onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
                    className="pr-10"
                    placeholder="Enter current password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-3 h-4 w-4 text-gray-400 hover:text-gray-600"
                  >
                    {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <Label htmlFor="newPassword" className="text-sm font-medium text-gray-700">
                  New Password
                </Label>
                <div className="relative mt-1">
                  <Input
                    id="newPassword"
                    type={showNewPassword ? "text" : "password"}
                    value={passwordData.newPassword}
                    onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                    className="pr-10"
                    placeholder="Enter new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-3 h-4 w-4 text-gray-400 hover:text-gray-600"
                  >
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                  Confirm New Password
                </Label>
                <div className="relative mt-1">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={passwordData.confirmPassword}
                    onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                    className="pr-10"
                    placeholder="Confirm new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-3 h-4 w-4 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowPasswordChange(false);
                  setPasswordData({
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: ''
                  });
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handlePasswordSave}
                disabled={!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
                className="bg-gradient-to-r from-[#225F8B] to-[#225F8B]/80 text-white"
              >
                <Save className="h-4 w-4 mr-2" />
                Update Password
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Work Information */}
      <Card className="bg-white/80 backdrop-blur-sm border-0">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Building className="h-5 w-5 mr-2" />
            Work Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  <div className="flex items-center space-x-3">
    <div className="w-10 h-10 bg-[#225F8B]/10 rounded-full flex items-center justify-center">
      <Building className="h-5 w-5 text-[#225F8B]" />
    </div>
    <div>
      <p className="text-sm font-medium text-gray-700">Department</p>
      <p className="text-sm text-gray-900">{userDetails?.department || "Not Assigned"}</p>
    </div>
  </div>

  <div className="flex items-center space-x-3">
    <div className="w-10 h-10 bg-[#225F8B]/10 rounded-full flex items-center justify-center">
      <Users className="h-5 w-5 text-[#225F8B]" />
    </div>
    <div>
      <p className="text-sm font-medium text-gray-700">Team</p>
      <p className="text-sm text-gray-900">{userDetails?.team || "Not Assigned"}</p>
    </div>
  </div>

  <div className="flex items-center space-x-3">
    <div className="w-10 h-10 bg-[#225F8B]/10 rounded-full flex items-center justify-center">
      <User className="h-5 w-5 text-[#225F8B]" />
    </div>
    <div>
      <p className="text-sm font-medium text-gray-700">Reviewer</p>
      <p className="text-sm text-gray-900">{userDetails?.reviewer || "Not Assigned"}</p>
    </div>
  </div>
</div>


          <Separator />

          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-[#225F8B]/10 rounded-full flex items-center justify-center">
              <Calendar className="h-5 w-5 text-[#225F8B]" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Last Login</p>
              <p className="text-sm text-gray-900">
                {user?.loginTime ? new Date(user.loginTime).toLocaleString() : 'Just now'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Team Structure and Organizational Hierarchy */}
      <Card className="bg-white/80 backdrop-blur-sm border-0">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center">
            <Network className="h-5 w-5 mr-2" />
            Team Structure & Organizational Hierarchy
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Reporting Manager */}
          {manager && (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                <User className="h-4 w-4 mr-2" />
                Reports To
              </h4>
              <Card className="bg-gradient-to-r from-[#225F8B]/5 to-[#225F8B]/10 border-[#225F8B]/20">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <Avatar className="w-10 h-10">
                      <AvatarFallback className="bg-[#225F8B] text-white text-sm">
                        {manager.name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-gray-900">{manager.name}</p>
                      <p className="text-sm text-gray-600">{manager.designation}</p>
                      <p className="text-xs text-gray-500">{manager.email}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Direct Reports */}
          {directReports.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                <Users className="h-4 w-4 mr-2" />
                Direct Reports ({directReports.length})
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {directReports.map((report, index) => (
                  <Card key={index} className="bg-gray-50 border-gray-200">
                    <CardContent className="p-3">
                      <div className="flex items-center space-x-3">
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className="bg-gray-600 text-white text-xs">
                            {report.name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{report.name}</p>
                          <p className="text-xs text-gray-600">{report.designation}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Team Members */}
          {teammates.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                <Building className="h-4 w-4 mr-2" />
                Team Members ({teammates.length})
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {teammates.map((teammate, index) => (
                  <Card key={index} className="bg-blue-50 border-blue-200">
                    <CardContent className="p-3">
                      <div className="flex items-center space-x-3">
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className="bg-blue-600 text-white text-xs"> 
                            {teammate.name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{teammate.name}</p>
                          <p className="text-xs text-gray-600">{teammate.designation}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Department Hierarchy */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
              <ChevronRight className="h-4 w-4 mr-2" />
              Department Hierarchy
            </h4>
            <Card className="bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2 text-sm">
                  <span className="text-gray-600">Organization</span>
                  <ChevronRight className="h-3 w-3 text-gray-400" />
                  <span className="font-medium text-[#225F8B]">{userDetails?.department || 'N/A'}</span>
                  {userDetails?.team && (
                    <>
                      <ChevronRight className="h-3 w-3 text-gray-400" />
                      <span className="font-medium text-gray-700">{userDetails?.team}</span>
                    </>
                  )}
                  <ChevronRight className="h-3 w-3 text-gray-400" />
                  <span className="text-gray-900 font-semibold">{user?.name}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserProfile;