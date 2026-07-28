import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  TestTube, 
  Send, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle, 
  Clock,
  Users,
  Settings,
  BarChart3,
  Zap,
  MessageSquare,
  Calendar
} from 'lucide-react';
import { NotificationService, NotificationType, NotificationCategory, NotificationPriority } from '@/integrations/database/notificationService';
import { NotificationScheduler } from '@/integrations/database/notificationScheduler';
import { NotificationPreferencesManager } from '@/integrations/database/notificationPreferences';
import NotificationCenter from '@/components/NotificationCenter';
import NotificationAnalyticsDashboard from '@/components/NotificationAnalyticsDashboard';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

interface TestResult {
  id: string;
  test: string;
  status: 'pending' | 'running' | 'success' | 'error';
  message: string;
  timestamp: Date;
  duration?: number;
}

const NotificationSystemTest = () => {
  const { user } = useAuth();
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [customNotification, setCustomNotification] = useState({
    title: '',
    message: '',
    type: NotificationType.SYSTEM_ALERT,
    category: NotificationCategory.SYSTEM,
    priority: NotificationPriority.MEDIUM,
    targetUserId: ''
  });
  const [scheduledNotification, setScheduledNotification] = useState({
    title: '',
    message: '',
    scheduledFor: '',
    type: NotificationType.SYSTEM_ALERT
  });
  const [queueStats, setQueueStats] = useState<any>(null);

  const addTestResult = (test: string, status: 'pending' | 'running' | 'success' | 'error', message: string, duration?: number) => {
    const result: TestResult = {
      id: `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      test,
      status,
      message,
      timestamp: new Date(),
      duration
    };
    
    setTestResults(prev => [result, ...prev]);
    return result;
  };

  const updateTestResult = (id: string, status: TestResult['status'], message: string, duration?: number) => {
    setTestResults(prev => prev.map(result => 
      result.id === id 
        ? { ...result, status, message, duration }
        : result
    ));
  };

  const runComprehensiveTests = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to run tests",
        variant: "destructive"
      });
      return;
    }

    setIsRunningTests(true);
    setTestResults([]);

    const tests = [
      {
        name: 'Test Simple Notification',
        test: async () => {
          await NotificationService.sendSmartNotification({
            userId: user.id,
            title: '🧪 System Test',
            message: 'This is a test notification to verify system functionality',
            type: NotificationType.SYSTEM_ALERT,
            category: NotificationCategory.SYSTEM,
            priority: NotificationPriority.MEDIUM
          });
        }
      },
      {
        name: 'Test New Booking Notification',
        test: async () => {
          await NotificationService.notifyBookingCreated({
            bookingId: 999,
            passengerId: user.id,
            driverId: 'driver-test',
            tripId: 'trip-test',
            pickupLocation: 'Algiers',
            destinationLocation: 'Oran',
            seatsBooked: 2,
            totalAmount: 2500,
            paymentMethod: 'bpm'
          });
        }
      },
      {
        name: 'Test Scheduled Notification',
        test: async () => {
          const futureDate = new Date(Date.now() + 5000); // 5 seconds from now
          await NotificationScheduler.scheduleNotification({
            userId: user.id,
            title: '⏰ Scheduled Notification',
            message: 'This notification was scheduled to send after 5 seconds',
            type: NotificationType.SYSTEM_ALERT,
            category: NotificationCategory.SYSTEM,
            priority: NotificationPriority.LOW
          }, futureDate);
        }
      },
      {
        name: 'Test User Preferences',
        test: async () => {
          await NotificationPreferencesManager.initializeUserPreferences(user.id, user.role);
          const prefs = await NotificationPreferencesManager.getUserPreferences(user.id);
          if (!prefs.enableNotifications) {
            throw new Error('Failed to initialize user preferences');
          }
        }
      },
      {
        name: 'Test Bulk Send',
        test: async () => {
          await NotificationService.sendBulkNotification({
            userIds: [user.id],
            title: '📢 Bulk Notification',
            message: 'This is a test for bulk notification sending',
            type: NotificationType.SYSTEM_ALERT,
            category: NotificationCategory.SYSTEM,
            priority: NotificationPriority.MEDIUM
          });
        }
      },
      {
        name: 'Test Payment Notification',
        test: async () => {
          await NotificationService.notifyPaymentReceived({
            bookingId: 888,
            amount: 1500,
            paymentMethod: 'cod',
            payerId: user.id,
            recipientId: 'driver-test'
          });
        }
      },
      {
        name: 'Test Welcome Notification',
        test: async () => {
          await NotificationService.notifyWelcomeUser(user.id, user.role || 'passenger');
        }
      },
      {
        name: 'Test Queue Status',
        test: async () => {
          const stats = NotificationScheduler.getQueueStats();
          if (typeof stats.total !== 'number') {
            throw new Error('Failed to get queue statistics');
          }
        }
      }
    ];

    for (const { name, test } of tests) {
      const startTime = Date.now();
      const resultId = addTestResult(name, 'running', 'Running...');
      
      try {
        await test();
        const duration = Date.now() - startTime;
        updateTestResult(resultId.id, 'success', 'Success', duration);
        
        // Small delay between tests
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        const duration = Date.now() - startTime;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        updateTestResult(resultId.id, 'error', `Failed: ${errorMessage}`, duration);
      }
    }

    setIsRunningTests(false);
    
    toast({
      title: "Tests Completed",
      description: "All tests have been run"
    });
  };

  const sendCustomNotification = async () => {
    if (!user || !customNotification.title || !customNotification.message) {
      toast({
        title: "Error",
        description: "Please fill all required fields",
        variant: "destructive"
      });
      return;
    }

    try {
      await NotificationService.sendSmartNotification({
        userId: customNotification.targetUserId || user.id,
        title: customNotification.title,
        message: customNotification.message,
        type: customNotification.type,
        category: customNotification.category,
        priority: customNotification.priority
      });

      toast({
        title: "Sent",
        description: "Custom notification sent successfully"
      });

      // Reset form
      setCustomNotification({
        title: '',
        message: '',
        type: NotificationType.SYSTEM_ALERT,
        category: NotificationCategory.SYSTEM,
        priority: NotificationPriority.MEDIUM,
        targetUserId: ''
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send notification",
        variant: "destructive"
      });
    }
  };

  const scheduleCustomNotification = async () => {
    if (!user || !scheduledNotification.title || !scheduledNotification.message || !scheduledNotification.scheduledFor) {
      toast({
        title: "Error",
        description: "Please fill all required fields",
        variant: "destructive"
      });
      return;
    }

    try {
      const scheduledDate = new Date(scheduledNotification.scheduledFor);
      
      await NotificationScheduler.scheduleNotification({
        userId: user.id,
        title: scheduledNotification.title,
        message: scheduledNotification.message,
        type: scheduledNotification.type,
        category: NotificationCategory.SYSTEM,
        priority: NotificationPriority.MEDIUM
      }, scheduledDate);

      toast({
        title: "Scheduled",
        description: `Notification scheduled to send at ${scheduledDate.toLocaleString()}`
      });

      // Reset form
      setScheduledNotification({
        title: '',
        message: '',
        scheduledFor: '',
        type: NotificationType.SYSTEM_ALERT
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to schedule notification",
        variant: "destructive"
      });
    }
  };

  const refreshQueueStats = () => {
    const stats = NotificationScheduler.getQueueStats();
    setQueueStats(stats);
  };

  useEffect(() => {
    refreshQueueStats();
    const interval = setInterval(refreshQueueStats, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  if (!user) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-orange-500" />
            <p className="text-muted-foreground">You must be logged in to access the test page</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold flex items-center justify-center gap-2">
          <TestTube className="h-8 w-8" />
          🧪 Notification System Test
        </h1>
        <p className="text-muted-foreground mt-2">
          Comprehensive page to test all developed notification system features
        </p>
      </div>

      <Tabs defaultValue="tests" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="tests">Tests</TabsTrigger>
          <TabsTrigger value="custom">Custom</TabsTrigger>
          <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
          <TabsTrigger value="center">Center</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Comprehensive Tests */}
        <TabsContent value="tests" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Comprehensive System Tests
              </CardTitle>
              <CardDescription>
                Run a comprehensive set of tests to verify all system features
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 mb-6">
                <Button 
                  onClick={runComprehensiveTests} 
                  disabled={isRunningTests}
                  className="flex items-center gap-2"
                >
                  {isRunningTests ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Zap className="h-4 w-4" />
                  )}
                  {isRunningTests ? 'Running...' : 'Run All Tests'}
                </Button>
                
                {queueStats && (
                  <div className="flex items-center gap-4 text-sm">
                    <Badge variant="outline">Queue: {queueStats.total}</Badge>
                    <Badge variant="default">Sent: {queueStats.sent}</Badge>
                    <Badge variant="destructive">Failed: {queueStats.failed}</Badge>
                  </div>
                )}
              </div>

              {/* Test Results */}
              <ScrollArea className="h-96 border rounded p-4">
                <div className="space-y-3">
                  {testResults.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      No tests have been run yet
                    </p>
                  ) : (
                    testResults.map((result) => (
                      <div key={result.id} className="flex items-center gap-3 p-3 border rounded">
                        <div className="flex-shrink-0">
                          {result.status === 'pending' && <Clock className="h-4 w-4 text-gray-400" />}
                          {result.status === 'running' && <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />}
                          {result.status === 'success' && <CheckCircle className="h-4 w-4 text-green-500" />}
                          {result.status === 'error' && <AlertCircle className="h-4 w-4 text-red-500" />}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{result.test}</p>
                          <p className="text-sm text-muted-foreground">{result.message}</p>
                          {result.duration && (
                            <p className="text-xs text-muted-foreground">Duration: {result.duration}ms</p>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {result.timestamp.toLocaleTimeString()}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Custom Notification */}
        <TabsContent value="custom" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="h-5 w-5" />
                Send Custom Notification
              </CardTitle>
              <CardDescription>
                Create and send a custom notification for testing
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={customNotification.title}
                    onChange={(e) => setCustomNotification(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Notification title"
                  />
                </div>
                <div>
                  <Label htmlFor="targetUser">Target User (Optional)</Label>
                  <Input
                    id="targetUser"
                    value={customNotification.targetUserId}
                    onChange={(e) => setCustomNotification(prev => ({ ...prev, targetUserId: e.target.value }))}
                    placeholder="User ID (default: you)"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  value={customNotification.message}
                  onChange={(e) => setCustomNotification(prev => ({ ...prev, message: e.target.value }))}
                  placeholder="Notification content"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Notification Type</Label>
                  <Select
                    value={customNotification.type}
                    onValueChange={(value) => setCustomNotification(prev => ({ 
                      ...prev, 
                      type: value as NotificationType 
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NotificationType.SYSTEM_ALERT}>System Alert</SelectItem>
                      <SelectItem value={NotificationType.BOOKING_CREATED}>New Booking</SelectItem>
                      <SelectItem value={NotificationType.TRIP_CREATED}>New Trip</SelectItem>
                      <SelectItem value={NotificationType.PAYMENT_RECEIVED}>Payment Received</SelectItem>
                      <SelectItem value={NotificationType.WELCOME}>Welcome</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>Category</Label>
                  <Select
                    value={customNotification.category}
                    onValueChange={(value) => setCustomNotification(prev => ({ 
                      ...prev, 
                      category: value as NotificationCategory 
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NotificationCategory.SYSTEM}>System</SelectItem>
                      <SelectItem value={NotificationCategory.BOOKING}>Bookings</SelectItem>
                      <SelectItem value={NotificationCategory.TRIP}>Trips</SelectItem>
                      <SelectItem value={NotificationCategory.PAYMENT}>Payments</SelectItem>
                      <SelectItem value={NotificationCategory.ACCOUNT}>Account</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>Priority</Label>
                  <Select
                    value={customNotification.priority}
                    onValueChange={(value) => setCustomNotification(prev => ({ 
                      ...prev, 
                      priority: value as NotificationPriority 
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NotificationPriority.LOW}>Low</SelectItem>
                      <SelectItem value={NotificationPriority.MEDIUM}>Medium</SelectItem>
                      <SelectItem value={NotificationPriority.HIGH}>High</SelectItem>
                      <SelectItem value={NotificationPriority.URGENT}>Urgent</SelectItem>
                      <SelectItem value={NotificationPriority.CRITICAL}>Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button onClick={sendCustomNotification} className="w-full">
                <Send className="h-4 w-4 mr-2" />
                Send Notification
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Scheduled Notification */}
        <TabsContent value="scheduled" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Schedule Notification
              </CardTitle>
              <CardDescription>
                Schedule a notification to send at a specific time
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="schedTitle">Title</Label>
                <Input
                  id="schedTitle"
                  value={scheduledNotification.title}
                  onChange={(e) => setScheduledNotification(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Scheduled notification title"
                />
              </div>
              
              <div>
                <Label htmlFor="schedMessage">Message</Label>
                <Textarea
                  id="schedMessage"
                  value={scheduledNotification.message}
                  onChange={(e) => setScheduledNotification(prev => ({ ...prev, message: e.target.value }))}
                  placeholder="Scheduled notification content"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="schedTime">Send Time</Label>
                  <Input
                    id="schedTime"
                    type="datetime-local"
                    value={scheduledNotification.scheduledFor}
                    onChange={(e) => setScheduledNotification(prev => ({ ...prev, scheduledFor: e.target.value }))}
                  />
                </div>
                
                <div>
                  <Label>Notification Type</Label>
                  <Select
                    value={scheduledNotification.type}
                    onValueChange={(value) => setScheduledNotification(prev => ({ 
                      ...prev, 
                      type: value as NotificationType 
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NotificationType.SYSTEM_ALERT}>System Alert</SelectItem>
                      <SelectItem value={NotificationType.BOOKING_REMINDER}>Booking Reminder</SelectItem>
                      <SelectItem value={NotificationType.TRIP_STARTING}>Trip Starting</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button onClick={scheduleCustomNotification} className="w-full">
                <Calendar className="h-4 w-4 mr-2" />
                Schedule Notification
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notification Center */}
        <TabsContent value="center" className="space-y-4">
          <NotificationCenter />
        </TabsContent>

        {/* Analytics Dashboard */}
        <TabsContent value="analytics" className="space-y-4">
          <NotificationAnalyticsDashboard />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default NotificationSystemTest;