import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { Badge } from './ui/badge';
import NotificationSystem from './NotificationSystem';
import { employeeAPI } from '../Services/api';
import { useToast } from '../hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from './ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import {
  LogOut,
  User,
  Users,
  Search,
  UserCheck,
  UserX,
  AlertTriangle
} from 'lucide-react';

const Header = ({ onSectionChange }) => {
  const { user, logout, newMessages, clearNewMessages, setNewMessages } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showDeactivateDialog, setShowDeactivateDialog] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleProfileClick = () => {
    if (onSectionChange) {
      onSectionChange('profile');
    }
  };

  const handleDeactivateAccount = async () => {
    try {
      const backendUrl ='https://stc-employee-portal.onrender.com';
      // Correcting the API call to match the backend endpoint
      const response = await fetch(`${backendUrl}/api/users/${user.email}/deactivate`, {
        method: 'PUT',
      });

      if (!response.ok) {
        // Handle specific case where user is already inactive
        if (response.status === 400) {
          const errorData = await response.json();
          toast({
            title: "Info",
            description: errorData.detail || "Account is already inactive.",
          });
          // Still log out the user
          logout();
          navigate('/login');
          return; // Stop further execution
        }
        throw new Error(`Server responded with status: ${response.status}`);
      }
      toast({
        title: "Account Deactivated",
        description: "Your account has been permanently deactivated.",
      });
      logout();
      navigate('/login');
    } catch (error) {
      console.error("Error deactivating user:", error);
      toast({
        title: "Error",
        description: "Failed to deactivate account. Please try again.",
        variant: "destructive",
      });
    }
    setShowDeactivateDialog(false);
  };



  return (
    <header className="bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <img 
              src="https://showtimeconsulting.in/images/settings/2fd13f50.png" 
              alt="Showtime Consulting" 
              className="h-10 w-auto object-contain"
            />
            <div className="hidden md:block">
              <h1 className="text-xl font-bold bg-gradient-to-r from-[#225F8B] to-[#225F8B]/80 bg-clip-text text-transparent">
                Showtime Consulting
              </h1>
              <p className="text-xs text-gray-500">Employee Portal</p>
            </div>
          </div>

          {/* Right Side - Notifications and User Menu */}
          <div className="flex items-center space-x-4">
            <NotificationSystem newMessages={newMessages} clearNewMessages={clearNewMessages} setNewMessages={setNewMessages} />
            
            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar key={user?.profilePicture || 'no-picture'} className="w-10 h-10">
                    {user?.profilePicture ? (
                      <AvatarImage src={user.profilePicture} alt="Profile" />
                    ) : (
                      <AvatarFallback className="bg-gradient-to-r from-[#225F8B] to-[#225F8B]/80 text-white text-lg">
                        {user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </AvatarFallback>
                    )}
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-64" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user?.name}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user?.email}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user?.designation} • {user?.department}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer" onClick={handleProfileClick}>
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>

                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="cursor-pointer text-red-600 hover:text-red-700"
                  onClick={() => setShowDeactivateDialog(true)}
                >
                  <UserX className="mr-2 h-4 w-4" />
                  <span>Deactivate Account</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="cursor-pointer text-red-600 hover:text-red-700"
                  onClick={handleLogout}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Deactivate Account Confirmation Dialog */}
      <Dialog open={showDeactivateDialog} onOpenChange={setShowDeactivateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Deactivate Account
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to deactivate your account? This action cannot be undone.
              Your account and all associated data will be permanently removed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeactivateDialog(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeactivateAccount}
            >
              Deactivate Account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </header>
  );
};

export default Header;
