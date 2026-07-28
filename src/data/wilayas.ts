export const wilayas = [
  { code: "01", name: "أدرار", nameEn: "Adrar", nameFr: "Adrar" },
  { code: "02", name: "الشلف", nameEn: "Chlef", nameFr: "Chlef" },
  { code: "03", name: "الأغواط", nameEn: "Laghouat", nameFr: "Laghouat" },
  { code: "04", name: "أم البواقي", nameEn: "Oum El Bouaghi", nameFr: "Oum El Bouaghi" },
  { code: "05", name: "باتنة", nameEn: "Batna", nameFr: "Batna" },
  { code: "06", name: "بجاية", nameEn: "Béjaïa", nameFr: "Béjaïa" },
  { code: "07", name: "بسكرة", nameEn: "Biskra", nameFr: "Biskra" },
  { code: "08", name: "بشار", nameEn: "Béchar", nameFr: "Béchar" },
  { code: "09", name: "البليدة", nameEn: "Blida", nameFr: "Blida" },
  { code: "10", name: "البويرة", nameEn: "Bouira", nameFr: "Bouira" },
  { code: "11", name: "تمنراست", nameEn: "Tamanrasset", nameFr: "Tamanrasset" },
  { code: "12", name: "تبسة", nameEn: "Tébessa", nameFr: "Tébessa" },
  { code: "13", name: "تلمسان", nameEn: "Tlemcen", nameFr: "Tlemcen" },
  { code: "14", name: "تيارت", nameEn: "Tiaret", nameFr: "Tiaret" },
  { code: "15", name: "تيزي وزو", nameEn: "Tizi Ouzou", nameFr: "Tizi Ouzou" },
  { code: "16", name: "الجزائر", nameEn: "Algiers", nameFr: "Alger" },
  { code: "17", name: "الجلفة", nameEn: "Djelfa", nameFr: "Djelfa" },
  { code: "18", name: "جيجل", nameEn: "Jijel", nameFr: "Jijel" },
  { code: "19", name: "سطيف", nameEn: "Sétif", nameFr: "Sétif" },
  { code: "20", name: "سعيدة", nameEn: "Saïda", nameFr: "Saïda" },
  { code: "21", name: "سكيكدة", nameEn: "Skikda", nameFr: "Skikda" },
  { code: "22", name: "سيدي بلعباس", nameEn: "Sidi Bel Abbès", nameFr: "Sidi Bel Abbès" },
  { code: "23", name: "عنابة", nameEn: "Annaba", nameFr: "Annaba" },
  { code: "24", name: "قالمة", nameEn: "Guelma", nameFr: "Guelma" },
  { code: "25", name: "قسنطينة", nameEn: "Constantine", nameFr: "Constantine" },
  { code: "26", name: "المدية", nameEn: "Médéa", nameFr: "Médéa" },
  { code: "27", name: "مستغانم", nameEn: "Mostaganem", nameFr: "Mostaganem" },
  { code: "28", name: "المسيلة", nameEn: "M'Sila", nameFr: "M'Sila" },
  { code: "29", name: "معسكر", nameEn: "Mascara", nameFr: "Mascara" },
  { code: "30", name: "ورقلة", nameEn: "Ouargla", nameFr: "Ouargla" },
  { code: "31", name: "وهران", nameEn: "Oran", nameFr: "Oran" },
  { code: "32", name: "البيض", nameEn: "El Bayadh", nameFr: "El Bayadh" },
  { code: "33", name: "إليزي", nameEn: "Illizi", nameFr: "Illizi" },
  { code: "34", name: "برج بوعريريج", nameEn: "Bordj Bou Arréridj", nameFr: "Bordj Bou Arréridj" },
  { code: "35", name: "بومرداس", nameEn: "Boumerdès", nameFr: "Boumerdès" },
  { code: "36", name: "الطارف", nameEn: "El Tarf", nameFr: "El Tarf" },
  { code: "37", name: "تندوف", nameEn: "Tindouf", nameFr: "Tindouf" },
  { code: "38", name: "تيسمسيلت", nameEn: "Tissemsilt", nameFr: "Tissemsilt" },
  { code: "39", name: "الوادي", nameEn: "El Oued", nameFr: "El Oued" },
  { code: "40", name: "خنشلة", nameEn: "Khenchela", nameFr: "Khenchela" },
  { code: "41", name: "سوق أهراس", nameEn: "Souk Ahras", nameFr: "Souk Ahras" },
  { code: "42", name: "تيبازة", nameEn: "Tipaza", nameFr: "Tipaza" },
  { code: "43", name: "ميلة", nameEn: "Mila", nameFr: "Mila" },
  { code: "44", name: "عين الدفلى", nameEn: "Aïn Defla", nameFr: "Aïn Defla" },
  { code: "45", name: "النعامة", nameEn: "Naâma", nameFr: "Naâma" },
  { code: "46", name: "عين تموشنت", nameEn: "Aïn Témouchent", nameFr: "Aïn Témouchent" },
  { code: "47", name: "غرداية", nameEn: "Ghardaïa", nameFr: "Ghardaïa" },
  { code: "48", name: "غليزان", nameEn: "Relizane", nameFr: "Relizane" }
];

export const getWilayaByCode = (code: string) => {
  return wilayas.find(w => w.code === code);
};

export const getWilayaByName = (name: string) => {
  return wilayas.find(w => w.name === name || w.nameEn === name || w.nameFr === name);
};

export const popularWilayas = [
  "47", // غرداية
  "16", // الجزائر
  "31", // وهران
  "25", // قسنطينة
  "19", // سطيف
  "23", // عنابة
  "06", // بجاية
  "15", // تيزي وزو
  "09"  // البليدة
];