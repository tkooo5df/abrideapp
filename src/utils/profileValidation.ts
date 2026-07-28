/**
 * Profile validation utilities
 * Checks if user profile has all required fields for booking
 */

export interface ProfileValidationResult {
  isValid: boolean;
  missingFields: string[];
  message: string;
}

/**
 * Check if profile is complete for booking
 * Required fields: first_name, last_name, phone, age, wilaya, ksar (if wilaya = 47)
 */
export const validateProfileForBooking = (profile: any): ProfileValidationResult => {
  if (!profile) {
    return {
      isValid: false,
      missingFields: ['first_name', 'last_name', 'phone', 'age', 'wilaya'],
      message: 'الملف الشخصي غير موجود. يرجى إكمال بياناتك أولاً.'
    };
  }

  const missingFields: string[] = [];
  const fieldLabels: { [key: string]: string } = {
    first_name: 'الاسم الأول',
    last_name: 'اسم العائلة',
    phone: 'رقم الهاتف',
    age: 'السن',
    wilaya: 'الولاية',
    ksar: 'القصر'
  };

  // Check first_name (support both snake_case and camelCase)
  const firstName = profile.first_name || profile.firstName;
  if (!firstName || (typeof firstName === 'string' && firstName.trim() === '')) {
    missingFields.push('first_name');
  }

  // Check last_name (support both snake_case and camelCase)
  const lastName = profile.last_name || profile.lastName;
  if (!lastName || (typeof lastName === 'string' && lastName.trim() === '')) {
    missingFields.push('last_name');
  }

  // Check phone (support both 'phone' and 'phoneNumber')
  const phone = profile.phone || profile.phoneNumber;
  if (!phone || (typeof phone === 'string' && phone.trim() === '')) {
    missingFields.push('phone');
  }

  // Check age
  const age = profile.age;
  if (age === null || age === undefined || age === '') {
    missingFields.push('age');
  }

  // Check wilaya
  const wilaya = profile.wilaya;
  if (!wilaya || (typeof wilaya === 'string' && wilaya.trim() === '')) {
    missingFields.push('wilaya');
  }

  // Check ksar only if wilaya is 47 (Ghardaïa)
  const wilayaId = wilaya?.toString() || '';
  const wilayaCode = wilayaId.length === 1 ? `0${wilayaId}` : wilayaId;
  if (wilayaCode === '47' || wilayaId === '47') {
    if (!profile.ksar || (typeof profile.ksar === 'string' && profile.ksar.trim() === '')) {
      missingFields.push('ksar');
    }
  }

  const isValid = missingFields.length === 0;

  // Generate message
  let message = '';
  if (!isValid) {
    const missingLabels = missingFields.map(field => fieldLabels[field] || field).join('، ');
    message = `يرجى إكمال المعلومات الناقصة في الملف الشخصي: ${missingLabels}`;
  }

  return {
    isValid,
    missingFields,
    message
  };
};

/**
 * Legacy function for backward compatibility
 */
export const isProfileComplete = (profile: any): boolean => {
  if (!profile) return false;
  
  // Check for mandatory fields
  const mandatoryFields = [
    'fullName',
    'phone',
    'wilaya',
    'commune'
  ];
  
  // For local profiles
  if (profile.hasOwnProperty('isDemo')) {
    return mandatoryFields.every(field => 
      profile[field] && profile[field].toString().trim() !== ''
    );
  }
  
  // For Supabase profiles
  return mandatoryFields.every(field => {
    const value = profile[field] || profile[camelToSnake(field)];
    return value && value.toString().trim() !== '';
  });
};

export const getMissingProfileFields = (profile: any): string[] => {
  if (!profile) return ['fullName', 'phone', 'wilaya', 'commune'];
  
  const missing: string[] = [];
  const fields = ['fullName', 'phone', 'wilaya', 'commune'];
  
  fields.forEach(field => {
    const value = profile[field] || profile[camelToSnake(field)];
    if (!value || value.toString().trim() === '') {
      missing.push(field);
    }
  });
  
  return missing;
};

function camelToSnake(str: string): string {
  return str.replace(/([A-Z])/g, '_$1').toLowerCase();
}
