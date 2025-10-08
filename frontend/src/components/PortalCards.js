import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { ExternalLink, ArrowRight } from 'lucide-react';
import { PORTAL_DATA } from '../data/mock';

const PortalCards = () => {
  const handlePortalClick = (url) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Portal Access</h2>
        <Badge variant="outline" className="bg-[#225F8B]/10 text-[#225F8B] border-[#225F8B]/20">
          {PORTAL_DATA.length} Available
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {PORTAL_DATA.map((portal) => (
          <Card 
            key={portal.id} 
            className="group hover:shadow-xl transition-all duration-300 cursor-pointer border-0 bg-white/80 backdrop-blur-sm hover:scale-105"
            onClick={() => handlePortalClick(portal.url)}
          >
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${portal.gradient} flex items-center justify-center text-2xl shadow-lg`}>
                  {portal.icon}
                </div>
                <Badge variant="secondary" className="text-xs">
                  {portal.category}
                </Badge>
              </div>
              <CardTitle className="text-xl font-bold text-gray-900 group-hover:text-[#225F8B] transition-colors">
                {portal.title}
              </CardTitle>
            </CardHeader>
            
            <CardContent className="pt-0">
              <p className="text-gray-600 mb-6 text-sm leading-relaxed">
                {portal.description}
              </p>
              
              <div className="flex items-center justify-between">
                <Button 
                  variant="outline" 
                  size="sm"
                  className="group-hover:bg-[#225F8B]/10 group-hover:border-[#225F8B]/50 group-hover:text-[#225F8B] transition-all duration-200"
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePortalClick(portal.url);
                  }}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open Portal
                </Button>
                
                <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-[#225F8B] group-hover:translate-x-1 transition-all duration-200" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Access Info */}
      <Card className="bg-gradient-to-r from-[#225F8B]/5 to-[#225F8B]/10 border-[#225F8B]/20">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Quick Access Tips
              </h3>
              <p className="text-gray-600 text-sm">
                Click on any portal card to open it in a new tab. All portals are accessible to all employees.
              </p>
            </div>
            <div className="hidden md:block">
              <div className="w-16 h-16 bg-white/50 rounded-full flex items-center justify-center">
                <ExternalLink className="h-8 w-8 text-[#225F8B]" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PortalCards;