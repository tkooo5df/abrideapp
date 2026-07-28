import { useMemo } from 'react';
import { useAuth } from './useAuth';
import { toast } from '@/hooks/use-toast';

interface LocalUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  phone: string;
  role: 'driver' | 'passenger' | 'admin' | 'developer';
  wilaya: string;
  commune: string;
  address: string;
  isVerified: boolean;
  avatarUrl?: string | null;
  createdAt: string;
  updatedAt: string;
}

const mapProfileToLocalUser = (profile: any, fallbackId?: string, fallbackEmail?: string): LocalUser | null => {
  if (!profile && !fallbackId) {
    return null;
  }

  const id = profile?.id ?? fallbackId ?? '';
  const email = profile?.email ?? fallbackEmail ?? '';
  const firstName = profile?.first_name ?? profile?.firstName ?? '';
  const lastName = profile?.last_name ?? profile?.lastName ?? '';
  const computedName = `${firstName} ${lastName}`.trim();
  const fullName = profile?.full_name ?? profile?.fullName ?? (computedName || email);

  return {
    id,
    email,
    firstName,
    lastName,
    fullName,
    phone: profile?.phone ?? '',
    role: (profile?.role ?? 'passenger') as 'driver' | 'passenger' | 'admin' | 'developer',
    wilaya: profile?.wilaya ?? 'الجزائر',
    commune: profile?.commune ?? 'غير محدد',
    address: profile?.address ?? 'غير محدد',
    isVerified: profile?.is_verified ?? false,
    avatarUrl: profile?.avatar_url ?? null,
    createdAt: profile?.created_at ?? new Date().toISOString(),
    updatedAt: profile?.updated_at ?? profile?.created_at ?? new Date().toISOString(),
  };
};

export const useLocalAuth = () => {
  const { user: supabaseUser, profile, loading, signIn, signOut, updateProfile } = useAuth();

  const localUser = useMemo(
    () => mapProfileToLocalUser(profile, supabaseUser?.id, supabaseUser?.email ?? undefined),
    [profile, supabaseUser?.email, supabaseUser?.id]
  );

  return {
    user: localUser,
    loading,
    signIn: async (email: string, password: string) => {
      try {
        await signIn(email, password);
        return { user: localUser, error: null };
      } catch (error: any) {
        return { user: null, error: error?.message ?? 'حدث خطأ غير متوقع' };
      }
    },
    signOut: async () => {
      await signOut();
    },
    updateProfile: async (updates: Partial<LocalUser>) => {
      if (!supabaseUser) {
        return { user: null, error: 'No user logged in' };
      }

      try {
        const { data, error } = await updateProfile({
          full_name: updates.fullName,
          first_name: updates.firstName,
          last_name: updates.lastName,
          phone: updates.phone,
          role: updates.role,
          wilaya: updates.wilaya,
          commune: updates.commune,
          address: updates.address,
        } as any);

        if (error) {
          throw new Error(error);
        }

        const mapped = mapProfileToLocalUser(data ?? profile, supabaseUser.id, supabaseUser.email ?? undefined);
        return { user: mapped, error: null };
      } catch (error: any) {
        toast({
          title: 'خطأ في التحديث',
          description: error?.message ?? 'حدث خطأ غير متوقع',
          variant: 'destructive',
        });
        return { user: null, error: error?.message ?? 'حدث خطأ غير متوقع' };
      }
    },
    testAccounts: null,
    loginAs: async () => {
      toast({
        title: 'غير مدعوم في وضع Supabase',
        description: 'تسجيل الدخول السريع متاح فقط في الوضع المحلي القديم.',
      });
      return { user: null };
    },
  };
};
