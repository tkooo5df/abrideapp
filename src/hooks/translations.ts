export type Language = 'ar' | 'en' | 'fr';

export const translations = {
  ar: {
    navigation: {
      home: "الرئيسية",
      about: "حولنا",
      contact: "اتصل بنا",
      login: "تسجيل الدخول",
      register: "إنشاء حساب",
      logout: "تسجيل الخروج",
      dashboard: "لوحة التحكم",
      admin: "الإدارة",
      notifications: "الإشعارات",
      settings: "الإعدادات"
    }
  },
  en: {
    navigation: {
      home: "Home",
      about: "About",
      contact: "Contact",
      login: "Login",
      register: "Register",
      logout: "Logout",
      dashboard: "Dashboard",
      admin: "Admin",
      notifications: "Notifications",
      settings: "Settings"
    }
  },
  fr: {
    navigation: {
      home: "Accueil",
      about: "À propos",
      contact: "Contact",
      login: "Connexion",
      register: "S'inscrire",
      logout: "Déconnexion",
      dashboard: "Tableau de bord",
      admin: "Admin",
      notifications: "Notifications",
      settings: "Paramètres"
    }
  }
} as const;