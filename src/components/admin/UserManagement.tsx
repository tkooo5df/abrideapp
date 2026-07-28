import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { 
  Users, 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  Trash2, 
  Plus,
  CheckCircle,
  XCircle,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Shield,
  AlertTriangle,
  Loader2,
  Save
} from "lucide-react";
import { BrowserDatabaseService } from "@/integrations/database/browserServices";
import { wilayas } from "@/data/wilayas";
import { toast } from "@/hooks/use-toast";

interface User {
  id: string;
  email: string;
  role: string;
  status: string;
  created_at: string;
  last_sign_in: string;
  isDemo?: boolean;
  avatar_url?: string;
  full_name?: string;
  profile?: {
    first_name?: string;
    last_name?: string;
    phone?: string;
    wilaya?: string;
  };
}

interface UserManagementProps {
  users: User[];
  onUserAction: (userId: string, action: string) => void;
  processingAction?: { userId: string; action: string } | null;
}

const UserManagement = ({ users, onUserAction, processingAction }: UserManagementProps) => {
  // Add debug logging
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterDemo, setFilterDemo] = useState("all"); // This is correct
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editFormData, setEditFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    wilaya: '',
    commune: '',
    age: '',
    ksar: '',
    role: '',
    is_verified: false,
    account_suspended: false
  });
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // القصور الـ7 لواد مزاب
  const ksour = [
    { value: "قصر بريان", label: "قصر بريان" },
    { value: "قصر القرارة", label: "قصر القرارة" },
    { value: "قصر بني يزقن", label: "قصر بني يزقن" },
    { value: "قصر العطف", label: "قصر العطف" },
    { value: "قصر غرداية", label: "قصر غرداية" },
    { value: "قصر بنورة", label: "قصر بنورة" },
    { value: "قصر مليكة", label: "قصر مليكة" },
  ];

  // Add effect to log when filters change
  useEffect(() => {
  }, [filterRole, filterStatus, filterDemo]);

  const getStatusBadge = (status: string) => {
    const statusMap = {
      active: { label: "نشط", color: "bg-green-100 text-green-800" },
      pending: { label: "في الانتظار", color: "bg-yellow-100 text-yellow-800" },
      suspended: { label: "موقوف", color: "bg-red-100 text-red-800" },
      banned: { label: "محظور", color: "bg-red-100 text-red-800" }
    };
    return statusMap[status as keyof typeof statusMap] || statusMap.active;
  };

  const getRoleBadge = (role: string) => {
    const roles = {
      admin: { label: "مدير", color: "bg-purple-100 text-purple-800" },
      driver: { label: "سائق", color: "bg-blue-100 text-blue-800" },
      passenger: { label: "راكب", color: "bg-gray-100 text-gray-800" }
    };
    return roles[role as keyof typeof roles] || roles.passenger;
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.profile?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.profile?.last_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === "all" || user.role === filterRole;
    const matchesStatus = filterStatus === "all" || user.status === filterStatus;
    const matchesDemo = filterDemo === "all" || 
                       (filterDemo === "demo" && user.isDemo) || 
                       (filterDemo === "real" && !user.isDemo);
    return matchesSearch && matchesRole && matchesStatus && matchesDemo;
  });

  // Add effect to log filtered users
  useEffect(() => {
  }, [filteredUsers]);

  // Load user data for editing
  const handleEditClick = async (user: User) => {
    setEditingUser(user);
    setIsEditDialogOpen(true);
    
    // Fetch full user profile data
    try {
      const profile = await BrowserDatabaseService.getProfile(user.id);
      
      if (profile) {
        setEditFormData({
          first_name: profile.firstName || user.profile?.first_name || '',
          last_name: profile.lastName || user.profile?.last_name || '',
          email: user.email || '',
          phone: profile.phone || user.profile?.phone || '',
          wilaya: profile.wilaya || user.profile?.wilaya || '',
          commune: profile.commune || '',
          age: profile.age ? String(profile.age) : '',
          ksar: profile.ksar || '',
          role: user.role || '',
          is_verified: (user as any).is_verified || false,
          account_suspended: user.status === 'suspended'
        });
      } else {
        // Fallback to user data from props
        setEditFormData({
          first_name: user.profile?.first_name || '',
          last_name: user.profile?.last_name || '',
          email: user.email || '',
          phone: user.profile?.phone || '',
          wilaya: user.profile?.wilaya || '',
          commune: '',
          age: '',
          ksar: '',
          role: user.role || '',
          is_verified: (user as any).is_verified || false,
          account_suspended: user.status === 'suspended'
        });
      }
    } catch (error) {
      // Fallback to user data from props
      setEditFormData({
        first_name: user.profile?.first_name || '',
        last_name: user.profile?.last_name || '',
        email: user.email || '',
        phone: user.profile?.phone || '',
        wilaya: user.profile?.wilaya || '',
        commune: '',
        age: '',
        ksar: '',
        role: user.role || '',
        is_verified: (user as any).is_verified || false,
        account_suspended: user.status === 'suspended'
      });
    }
  };

  // Handle save edit
  const handleSaveEdit = async () => {
    if (!editingUser) return;
    
    setIsSaving(true);
    try {
      const updates: any = {
        first_name: editFormData.first_name,
        last_name: editFormData.last_name,
        phone: editFormData.phone || null,
        wilaya: editFormData.wilaya,
        commune: editFormData.commune || null,
        age: editFormData.age ? parseInt(editFormData.age, 10) : null,
        ksar: editFormData.ksar || null,
        role: editFormData.role,
        is_verified: editFormData.is_verified,
        account_suspended: editFormData.account_suspended
      };
      
      if (editFormData.email && editFormData.email !== editingUser.email) {
        updates.email = editFormData.email;
      }
      
      await BrowserDatabaseService.updateUserProfile(editingUser.id, updates);
      
      toast({
        title: '✅ تم التحديث',
        description: 'تم تحديث بيانات المستخدم بنجاح'
      });
      
      setIsEditDialogOpen(false);
      setEditingUser(null);
      
      // Refresh users list by calling onUserAction with refresh action
      // This will trigger a reload in the parent component
      setTimeout(() => {
        onUserAction(editingUser.id, 'refresh');
      }, 100);
    } catch (error: any) {
      toast({
        title: 'خطأ في التحديث',
        description: error?.message || 'حدث خطأ أثناء تحديث بيانات المستخدم',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Debug: Log users prop
  useEffect(() => {
    if (users.length === 0) {
    }
  }, [users]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">إدارة المستخدمين</h2>
          <p className="text-muted-foreground">
            إدارة جميع مستخدمي النظام - العدد الإجمالي: {users.length}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            تصدير البيانات
          </Button>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            إضافة مستخدم
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-wrap gap-4">
            <div className="relative flex-1 min-w-[300px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="البحث في المستخدمين (الاسم، البريد، الهاتف)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={filterRole} onValueChange={setFilterRole}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="الدور" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الأدوار</SelectItem>
                <SelectItem value="passenger">الركاب</SelectItem>
                <SelectItem value="driver">السائقون</SelectItem>
                <SelectItem value="admin">المديرون</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="الحالة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الحالات</SelectItem>
                <SelectItem value="active">نشط</SelectItem>
                <SelectItem value="pending">في الانتظار</SelectItem>
                <SelectItem value="suspended">موقوف</SelectItem>
                <SelectItem value="banned">محظور</SelectItem>
              </SelectContent>
            </Select>
            
            {/* Add Demo Filter */}
            <Select value={filterDemo} onValueChange={setFilterDemo}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="نوع الحساب" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الحسابات</SelectItem>
                <SelectItem value="real">الحسابات الحقيقية</SelectItem>
                <SelectItem value="demo">الحسابات التجريبية</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users List */}
      <div className="grid gap-4">
        {filteredUsers.map((user) => {
          const statusInfo = getStatusBadge(user.status);
          const roleInfo = getRoleBadge(user.role);
          
          return (
            <Card key={user.id} className="hover:shadow-lg transition-all">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-14 w-14">
                      <AvatarImage src={user.avatar_url || "/placeholder.svg"} />
                      <AvatarFallback className="text-lg">
                        {user.profile?.first_name?.charAt(0) || user.email.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Link
                          to={`/profile?userId=${user.id}`}
                          className="text-lg font-semibold hover:text-primary transition-colors cursor-pointer underline-offset-2 hover:underline"
                          title="عرض ملف المستخدم"
                        >
                          {user.profile?.first_name && user.profile?.last_name
                            ? `${user.profile.first_name} ${user.profile.last_name}`
                            : user.full_name || user.profile?.first_name || user.email || 'مستخدم بدون اسم'}
                        </Link>
                        <Badge className={roleInfo.color}>{roleInfo.label}</Badge>
                        <Badge className={statusInfo.color}>{statusInfo.label}</Badge>
                        {/* Show demo badge if it's a demo account */}
                        {user.isDemo && (
                          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                            تجريبي
                          </Badge>
                        )}
                        {user.role === 'driver' && user.status === 'active' && (
                          <Shield className="h-4 w-4 text-green-600" />
                        )}
                      </div>
                      
                      <div className="grid md:grid-cols-2 gap-4 text-sm text-muted-foreground">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Mail className="h-3 w-3" />
                            <span>{user.email}</span>
                          </div>
                          {user.profile?.phone && (
                            <div className="flex items-center gap-2">
                              <Phone className="h-3 w-3" />
                              <span>{user.profile.phone}</span>
                            </div>
                          )}
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-3 w-3" />
                            <span>انضم في {user.created_at}</span>
                          </div>
                          {user.profile?.wilaya && (
                            <div className="flex items-center gap-2">
                              <MapPin className="h-3 w-3" />
                              <span>ولاية {user.profile.wilaya}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="outline" onClick={() => setSelectedUser(user)}>
                          <Eye className="h-4 w-4 mr-2" />
                          عرض
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>تفاصيل المستخدم</DialogTitle>
                        </DialogHeader>
                        {selectedUser && (
                          <div className="space-y-4">
                            <div className="flex items-center gap-4">
                              <Avatar className="h-16 w-16">
                                <AvatarImage src={selectedUser.avatar_url || "/placeholder.svg"} />
                                <AvatarFallback className="text-xl">
                                  {selectedUser.profile?.first_name?.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <h3 className="text-xl font-bold">
                                  {selectedUser.profile?.first_name} {selectedUser.profile?.last_name}
                                </h3>
                                <div className="flex gap-2 mt-1">
                                  <Badge className={getRoleBadge(selectedUser.role).color}>
                                    {getRoleBadge(selectedUser.role).label}
                                  </Badge>
                                  <Badge className={getStatusBadge(selectedUser.status).color}>
                                    {getStatusBadge(selectedUser.status).label}
                                  </Badge>
                                  {/* Show demo badge in details view as well */}
                                  {selectedUser.isDemo && (
                                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                                      تجريبي
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                            
                            <div className="grid md:grid-cols-2 gap-4">
                              <div>
                                <h4 className="font-semibold mb-2">معلومات الاتصال</h4>
                                <div className="space-y-2 text-sm">
                                  <div>البريد: {selectedUser.email}</div>
                                  <div>الهاتف: {selectedUser.profile?.phone || "غير محدد"}</div>
                                  <div>الولاية: {selectedUser.profile?.wilaya || "غير محدد"}</div>
                                </div>
                              </div>
                              <div>
                                <h4 className="font-semibold mb-2">معلومات الحساب</h4>
                                <div className="space-y-2 text-sm">
                                  <div>تاريخ التسجيل: {selectedUser.created_at}</div>
                                  <div>آخر دخول: {selectedUser.last_sign_in}</div>
                                  <div>الحالة: {getStatusBadge(selectedUser.status).label}</div>
                                  {/* Show if it's a demo account */}
                                  {selectedUser.isDemo && (
                                    <div>نوع الحساب: تجريبي</div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>
                    
                    <Dialog open={isEditDialogOpen && editingUser?.id === user.id} onOpenChange={(open) => {
                      if (!open) {
                        setIsEditDialogOpen(false);
                        setEditingUser(null);
                      }
                    }}>
                      <DialogTrigger asChild>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleEditClick(user)}
                          disabled={processingAction !== null && processingAction.userId === user.id}
                        >
                      <Edit className="h-4 w-4 mr-2" />
                      تعديل
                    </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>تعديل بيانات المستخدم</DialogTitle>
                          <DialogDescription>
                            قم بتعديل بيانات المستخدم حسب الحاجة
                          </DialogDescription>
                        </DialogHeader>
                        
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="edit-first_name">الاسم الأول *</Label>
                              <Input
                                id="edit-first_name"
                                value={editFormData.first_name}
                                onChange={(e) => setEditFormData({ ...editFormData, first_name: e.target.value })}
                                placeholder="الاسم الأول"
                              />
                            </div>
                            <div>
                              <Label htmlFor="edit-last_name">اسم العائلة *</Label>
                              <Input
                                id="edit-last_name"
                                value={editFormData.last_name}
                                onChange={(e) => setEditFormData({ ...editFormData, last_name: e.target.value })}
                                placeholder="اسم العائلة"
                              />
                            </div>
                          </div>
                          
                          <div>
                            <Label htmlFor="edit-email">البريد الإلكتروني *</Label>
                            <Input
                              id="edit-email"
                              type="email"
                              value={editFormData.email}
                              onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                              placeholder="البريد الإلكتروني"
                            />
                          </div>
                          
                          <div>
                            <Label htmlFor="edit-phone">رقم الهاتف</Label>
                            <Input
                              id="edit-phone"
                              type="tel"
                              value={editFormData.phone}
                              onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                              placeholder="0555 12 34 56"
                            />
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="edit-wilaya">الولاية *</Label>
                              <Select 
                                value={editFormData.wilaya} 
                                onValueChange={(value) => {
                                  setEditFormData({ 
                                    ...editFormData, 
                                    wilaya: value,
                                    ksar: value !== '47' ? '' : editFormData.ksar
                                  });
                                }}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="اختر الولاية" />
                                </SelectTrigger>
                                <SelectContent>
                                  {wilayas.map((w) => (
                                    <SelectItem key={w.code} value={w.code}>
                                      {w.code} - {w.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label htmlFor="edit-commune">البلدية</Label>
                              <Input
                                id="edit-commune"
                                value={editFormData.commune}
                                onChange={(e) => setEditFormData({ ...editFormData, commune: e.target.value })}
                                placeholder="أدخل البلدية"
                              />
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="edit-age">السن</Label>
                              <Input
                                id="edit-age"
                                type="number"
                                min="18"
                                max="100"
                                value={editFormData.age}
                                onChange={(e) => setEditFormData({ ...editFormData, age: e.target.value })}
                                placeholder="السن"
                              />
                            </div>
                            {editFormData.wilaya === '47' && (
                              <div>
                                <Label htmlFor="edit-ksar">القصر</Label>
                                <Select 
                                  value={editFormData.ksar} 
                                  onValueChange={(value) => setEditFormData({ ...editFormData, ksar: value })}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="اختر القصر" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {ksour.map((ksar) => (
                                      <SelectItem key={ksar.value} value={ksar.value}>
                                        {ksar.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            )}
                          </div>
                          
                          <div>
                            <Label htmlFor="edit-role">الدور *</Label>
                            <Select 
                              value={editFormData.role} 
                              onValueChange={(value) => setEditFormData({ ...editFormData, role: value })}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="اختر الدور" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="passenger">راكب</SelectItem>
                                <SelectItem value="driver">سائق</SelectItem>
                                <SelectItem value="admin">مدير</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div className="flex items-center space-x-2 space-x-reverse">
                            <input
                              type="checkbox"
                              id="edit-is_verified"
                              checked={editFormData.is_verified}
                              onChange={(e) => setEditFormData({ ...editFormData, is_verified: e.target.checked })}
                              className="rounded"
                            />
                            <Label htmlFor="edit-is_verified" className="cursor-pointer">
                              موثق (للسائقين)
                            </Label>
                          </div>
                          
                          <div className="flex items-center space-x-2 space-x-reverse">
                            <input
                              type="checkbox"
                              id="edit-account_suspended"
                              checked={editFormData.account_suspended}
                              onChange={(e) => setEditFormData({ ...editFormData, account_suspended: e.target.checked })}
                              className="rounded"
                            />
                            <Label htmlFor="edit-account_suspended" className="cursor-pointer">
                              حساب موقوف
                            </Label>
                          </div>
                        </div>
                        
                        <DialogFooter>
                          <Button
                            variant="outline"
                            onClick={() => {
                              setIsEditDialogOpen(false);
                              setEditingUser(null);
                            }}
                            disabled={isSaving}
                          >
                            إلغاء
                          </Button>
                          <Button
                            onClick={handleSaveEdit}
                            disabled={isSaving || !editFormData.first_name || !editFormData.last_name || !editFormData.email || !editFormData.wilaya || !editFormData.role}
                          >
                            {isSaving ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                جاري الحفظ...
                              </>
                            ) : (
                              <>
                                <Save className="h-4 w-4 mr-2" />
                                حفظ
                              </>
                            )}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                    
                    {user.status === 'pending' && (
                      <Button 
                        size="sm" 
                        onClick={() => onUserAction(user.id, 'approve')}
                        className="bg-green-600 hover:bg-green-700"
                        disabled={processingAction !== null}
                      >
                        {processingAction && processingAction.userId === user.id && processingAction.action === 'approve' ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            جاري الموافقة...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            موافقة
                          </>
                        )}
                      </Button>
                    )}
                    
                    {user.status === 'active' && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => onUserAction(user.id, 'suspend')}
                        className="border-orange-200 text-orange-600 hover:bg-orange-50"
                        disabled={processingAction !== null}
                      >
                        {processingAction && processingAction.userId === user.id && processingAction.action === 'suspend' ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            جاري الإيقاف...
                          </>
                        ) : (
                          <>
                            <AlertTriangle className="h-4 w-4 mr-2" />
                            إيقاف
                          </>
                        )}
                      </Button>
                    )}
                    
                    {user.status === 'suspended' && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => onUserAction(user.id, 'activate')}
                        className="border-green-200 text-green-600 hover:bg-green-50"
                        disabled={processingAction !== null}
                      >
                        {processingAction && processingAction.userId === user.id && processingAction.action === 'activate' ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            جاري التفعيل...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            تفعيل
                          </>
                        )}
                      </Button>
                    )}
                    
                    <Button 
                      size="sm" 
                      variant="destructive"
                      onClick={() => onUserAction(user.id, 'delete')}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      حذف
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* No Results */}
      {users.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">لا يوجد مستخدمين</h3>
            <p className="text-muted-foreground mb-4">
              لم يتم العثور على أي مستخدمين في قاعدة البيانات
            </p>
            <div className="mt-4 text-left bg-muted p-4 rounded">
              <h4 className="font-semibold mb-2">معلومات التصحيح:</h4>
              <p>عدد المستخدمين المتلقاة: {users.length}</p>
              <p>مصطلح البحث: "{searchTerm}"</p>
              <p>فلتر الدور: {filterRole}</p>
              <p>فلتر الحالة: {filterStatus}</p>
              <p>فلتر النوع: {filterDemo}</p>
            </div>
          </CardContent>
        </Card>
      ) : filteredUsers.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">لا توجد نتائج</h3>
            <p className="text-muted-foreground mb-4">جرب تغيير معايير البحث أو التصفية</p>
            {/* Add debug info */}
            <div className="mt-4 text-left bg-muted p-4 rounded">
              <h4 className="font-semibold mb-2">معلومات التصحيح:</h4>
              <p>إجمالي المستخدمين المتلقاة: {users.length}</p>
              <p>عدد النتائج المفلترة: {filteredUsers.length}</p>
              <p>الحسابات الحقيقية: {users.filter(u => !u.isDemo).length}</p>
              <p>الحسابات التجريبية: {users.filter(u => u.isDemo).length}</p>
              <p>مصطلح البحث: "{searchTerm}"</p>
              <p>فلتر الدور: {filterRole}</p>
              <p>فلتر الحالة: {filterStatus}</p>
              <p>فلتر النوع: {filterDemo === 'all' ? 'جميع الحسابات' : filterDemo === 'real' ? 'الحسابات الحقيقية' : 'الحسابات التجريبية'}</p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  setSearchTerm('');
                  setFilterRole('all');
                  setFilterStatus('all');
                  setFilterDemo('all');
                }}
                className="mt-2"
              >
                إعادة تعيين الفلاتر
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
};

export default UserManagement;