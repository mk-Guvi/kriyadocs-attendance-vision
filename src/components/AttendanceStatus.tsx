import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Clock, LogIn, LogOut, Users } from 'lucide-react';
import { AttendeeProfile, AttendanceRecord } from '@/types/attendance';
import { cn } from '@/lib/utils';

interface AttendanceStatusProps {
  profile?: AttendeeProfile;
  recentRecord?: AttendanceRecord;
  totalPresent: number;
}

export const AttendanceStatus: React.FC<AttendanceStatusProps> = ({
  profile,
  recentRecord,
  totalPresent
}) => {
  if (!profile || !recentRecord) {
    return (
      <Card className="border border-border">
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No recent attendance recorded</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const isEntry = recentRecord.type === 'ENTRY';
  const statusIcon = isEntry ? LogIn : LogOut;
  const statusColor = isEntry ? 'success' : 'warning';
  
  return (
    <Card className={cn(
      "border-2 transition-all duration-300",
      isEntry ? "border-success/30 bg-success/5" : "border-warning/30 bg-warning/5"
    )}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Recent Activity</span>
          <Badge variant={isEntry ? "default" : "secondary"} className={cn(
            isEntry && "bg-success text-success-foreground",
            !isEntry && "bg-warning text-warning-foreground"
          )}>
            {totalPresent} Present
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16 border-2 border-primary/20">
            <AvatarImage src={recentRecord.image} alt={profile.name} />
            <AvatarFallback className="bg-primary/10 text-primary">
              {profile.name ? profile.name.split(' ').map(n => n[0]).join('').toUpperCase() : 'U'}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              {React.createElement(statusIcon, { 
                className: cn(
                  "h-5 w-5", 
                  isEntry ? "text-success" : "text-warning"
                ) 
              })}
              <h3 className="font-semibold text-lg">{profile.name}</h3>
            </div>
            <p className="text-muted-foreground text-sm">{profile.email}</p>
            <div className="flex items-center gap-1 mt-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {recentRecord.timestamp.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        <div className="p-3 rounded-lg bg-muted/50">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Status:</span>
            <Badge variant={isEntry ? "default" : "outline"} className={cn(
              isEntry && "bg-success text-success-foreground",
              !isEntry && "border-warning text-warning"
            )}>
              {isEntry ? 'CHECKED IN' : 'CHECKED OUT'}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};