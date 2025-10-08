import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Calendar, User, AlertCircle, Info, CheckCircle, Plus, Send, Shield } from 'lucide-react';
import { ANNOUNCEMENTS_DATA } from '../data/mock';
import { useToast } from '../hooks/use-toast';

const Announcements = ({ initialAnnouncements = [] }) => {
  const { user } = useAuth();
  const [selectedPriority, setSelectedPriority] = useState('all');
  const [announcements, setAnnouncements] = useState([...initialAnnouncements, ...ANNOUNCEMENTS_DATA]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newAnnouncement, setNewAnnouncement] = useState({
    title: '',
    content: '',
    priority: 'medium',
    author: user?.name || 'Admin'
  });
  const { toast } = useToast();

  // Check if user is admin
  const isAdmin = user?.isAdmin || user?.email === 'admin@showtimeconsulting.in';

  // Update announcements when new birthday announcements are passed
  useEffect(() => {
    if (initialAnnouncements.length > 0) {
      setAnnouncements(prev => {
        const existing = prev.filter(ann => !ann.type || ann.type !== 'birthday');
        return [...initialAnnouncements, ...existing];
      });
    }
  }, [initialAnnouncements]);

  const priorityColors = {
    high: 'bg-red-100 text-red-800 border-red-200',
    medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    low: 'bg-green-100 text-green-800 border-green-200'
  };

  const priorityIcons = {
    high: AlertCircle,
    medium: Info,
    low: CheckCircle
  };

  const filteredAnnouncements = selectedPriority === 'all' 
    ? announcements 
    : announcements.filter(ann => ann.priority === selectedPriority);

  const handleCreateAnnouncement = () => {
    if (!isAdmin) {
      toast({
        title: "Access Denied",
        description: "Only administrators can create announcements.",
        variant: "destructive"
      });
      return;
    }

    if (!newAnnouncement.title.trim() || !newAnnouncement.content.trim()) {
      toast({
        title: "Error",
        description: "Please fill in both title and content.",
        variant: "destructive"
      });
      return;
    }

    const announcement = {
      id: announcements.length + 1,
      title: newAnnouncement.title,
      content: newAnnouncement.content,
      priority: newAnnouncement.priority,
      author: user?.name || 'Admin',
      date: new Date().toISOString().split('T')[0]
    };

    setAnnouncements([announcement, ...announcements]);
    setNewAnnouncement({
      title: '',
      content: '',
      priority: 'medium',
      author: user?.name || 'Admin'
    });
    setShowCreateForm(false);
    
    toast({
      title: "Announcement Created",
      description: "Your announcement has been published successfully.",
    });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Announcements</h2>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="bg-[#225F8B]/10 text-[#225F8B] border-[#225F8B]/20">
            {filteredAnnouncements.length} {selectedPriority === 'all' ? 'Total' : selectedPriority}
          </Badge>
          {isAdmin && (
            <Button 
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="bg-gradient-to-r from-[#225F8B] to-[#225F8B]/80 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Announcement
            </Button>
          )}
          {!isAdmin && (
            <Badge variant="outline" className="bg-yellow-50 text-yellow-800 border-yellow-200">
              <Shield className="h-3 w-3 mr-1" />
              Admin Only
            </Badge>
          )}
        </div>
      </div>

      {/* Create Announcement Form */}
      {showCreateForm && isAdmin && (
        <Card className="bg-gradient-to-r from-[#225F8B]/5 to-[#225F8B]/10 border-[#225F8B]/20">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">
              Create New Announcement
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title" className="text-sm font-medium text-gray-700">
                  Title
                </Label>
                <Input
                  id="title"
                  value={newAnnouncement.title}
                  onChange={(e) => setNewAnnouncement({...newAnnouncement, title: e.target.value})}
                  placeholder="Enter announcement title"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="priority" className="text-sm font-medium text-gray-700">
                  Priority
                </Label>
                <Select 
                  value={newAnnouncement.priority} 
                  onValueChange={(value) => setNewAnnouncement({...newAnnouncement, priority: value})}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">High Priority</SelectItem>
                    <SelectItem value="medium">Medium Priority</SelectItem>
                    <SelectItem value="low">Low Priority</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="content" className="text-sm font-medium text-gray-700">
                Content
              </Label>
              <Textarea
                id="content"
                value={newAnnouncement.content}
                onChange={(e) => setNewAnnouncement({...newAnnouncement, content: e.target.value})}
                placeholder="Enter announcement content"
                rows={4}
                className="mt-1"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreateForm(false);
                  setNewAnnouncement({
                    title: '',
                    content: '',
                    priority: 'medium',
                    author: 'Admin'
                  });
                }}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleCreateAnnouncement}
                className="bg-gradient-to-r from-[#225F8B] to-[#225F8B]/80 text-white"
              >
                <Send className="h-4 w-4 mr-2" />
                Publish Announcement
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Priority Filter */}
      <div className="flex flex-wrap gap-2">
        {['all', 'high', 'medium', 'low'].map((priority) => (
          <Button
            key={priority}
            variant={selectedPriority === priority ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedPriority(priority)}
            className={`transition-all duration-200 ${
              selectedPriority === priority
                ? 'bg-gradient-to-r from-[#225F8B] to-[#225F8B]/80 text-white'
                : 'hover:bg-[#225F8B]/10 hover:border-[#225F8B]/50'
            }`}
          >
            {priority.charAt(0).toUpperCase() + priority.slice(1)}
          </Button>
        ))}
      </div>

      {/* Announcements List */}
      <div className="space-y-4">
        {filteredAnnouncements.length > 0 ? (
          filteredAnnouncements.map((announcement) => {
            const PriorityIcon = priorityIcons[announcement.priority];
            return (
              <Card 
                key={announcement.id} 
                className="hover:shadow-lg transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <div className={`p-2 rounded-full ${priorityColors[announcement.priority]}`}>
                        <PriorityIcon className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-lg font-semibold text-gray-900 mb-2">
                          {announcement.title}
                        </CardTitle>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-4 w-4" />
                            <span>{formatDate(announcement.date)}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <User className="h-4 w-4" />
                            <span>{announcement.author}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <Badge 
                      variant="outline" 
                      className={priorityColors[announcement.priority]}
                    >
                      {announcement.priority}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 leading-relaxed">
                    {announcement.content}
                  </p>
                </CardContent>
              </Card>
            );
          })
        ) : (
          <Card className="bg-gray-50 border-gray-200">
            <CardContent className="py-12 text-center">
              <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No Announcements Found
              </h3>
              <p className="text-gray-600">
                No announcements match the selected priority filter.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Quick Stats */}
      <Card className="bg-gradient-to-r from-[#225F8B]/5 to-[#225F8B]/10 border-[#225F8B]/20">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {announcements.filter(a => a.priority === 'high').length}
              </div>
              <div className="text-sm text-gray-600">High Priority</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {announcements.filter(a => a.priority === 'medium').length}
              </div>
              <div className="text-sm text-gray-600">Medium Priority</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {announcements.filter(a => a.priority === 'low').length}
              </div>
              <div className="text-sm text-gray-600">Low Priority</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Announcements;