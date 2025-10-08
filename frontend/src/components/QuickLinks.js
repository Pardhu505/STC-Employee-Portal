import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { ExternalLink, ArrowRight } from 'lucide-react';
import { QUICK_LINKS_DATA } from '../data/mock';

const QuickLinks = () => {
  const handleLinkClick = (url) => {
    if (url === '#') {
      alert('This feature will be available soon!');
    } else {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Quick Links</h2>
        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
          {QUICK_LINKS_DATA.length} Available
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {QUICK_LINKS_DATA.map((link) => (
          <Card 
            key={link.id} 
            className="group hover:shadow-xl transition-all duration-300 cursor-pointer border-0 bg-white/80 backdrop-blur-sm hover:scale-105"
            onClick={() => handleLinkClick(link.url)}
          >
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-2xl shadow-lg">
                  {link.icon}
                </div>
                <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all duration-200" />
              </div>
              <CardTitle className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                {link.title}
              </CardTitle>
            </CardHeader>
            
            <CardContent className="pt-0">
              <p className="text-gray-600 mb-4 text-sm leading-relaxed">
                {link.description}
              </p>
              
              <Button 
                variant="outline" 
                size="sm"
                className="w-full group-hover:bg-blue-50 group-hover:border-blue-300 group-hover:text-blue-700 transition-all duration-200"
                onClick={(e) => {
                  e.stopPropagation();
                  handleLinkClick(link.url);
                }}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Access
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Help Section */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Need Help?
              </h3>
              <p className="text-gray-600 text-sm">
                Can't find what you're looking for? Contact IT Support for assistance with accessing company resources.
              </p>
            </div>
            <div className="hidden md:block">
              <Button 
                variant="outline"
                onClick={() => handleLinkClick('#')}
                className="hover:bg-blue-50 hover:border-blue-300"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Contact Support
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default QuickLinks;