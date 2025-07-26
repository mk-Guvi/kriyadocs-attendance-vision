import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { LogIn, LogOut, Clock, History } from 'lucide-react';
import { AttendanceRecord } from '@/types/attendance';
import { cn } from '@/lib/utils';

interface AttendanceListProps {
  records: AttendanceRecord[];
}

export const AttendanceList: React.FC<AttendanceListProps> = ({ records }) => {
  if (records.length === 0) {
    return (
      <Card className="border border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            <Clock className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No attendance records yet</p>
            <p className="text-sm">Start by capturing your first attendance</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Recent Activity ({records.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[400px]">
          <div className="p-4 space-y-3">
            {records.map((record) => {
              const isEntry = record.type === 'ENTRY';
              const icon = isEntry ? LogIn : LogOut;
              
              return (
                <div
                  key={record.id}
                  className={cn(
                    "flex items-center gap-4 p-3 rounded-lg border transition-all",
                    "hover:shadow-md",
                    isEntry ? "border-success/20 bg-success/5" : "border-warning/20 bg-warning/5"
                  )}
                >
                  <Avatar className="h-12 w-12 border border-border">
                    <AvatarImage src={record.image} alt={record.name} />
                    <AvatarFallback className="bg-muted">
                      {record.name ? record.name.split(' ').map(n => n[0]).join('').toUpperCase() : 'U'}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {React.createElement(icon, { 
                        className: cn(
                          "h-4 w-4 flex-shrink-0", 
                          isEntry ? "text-success" : "text-warning"
                        ) 
                      })}
                      <h4 className="font-medium truncate">{record.name}</h4>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{record.email}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        {record.timestamp.toLocaleString()}
                      </span>
                    </div>
                  </div>
                  
                  <Badge 
                    variant={isEntry ? "default" : "outline"}
                    className={cn(
                      "flex-shrink-0",
                      isEntry && "bg-success text-success-foreground",
                      !isEntry && "border-warning text-warning"
                    )}
                  >
                    {record.type}
                  </Badge>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};