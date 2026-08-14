const fs = require('fs');

const typesFile = 'src/integrations/supabase/types.ts';
let content = fs.readFileSync(typesFile, 'utf8');

const reviewsType = `
        reviews: {
          Row: {
            id: string
            booking_id: string
            reviewer_id: string
            target_user_id: string
            target_type: string
            rating: number
            comment: string | null
            created_at: string
          }
          Insert: {
            id?: string
            booking_id: string
            reviewer_id: string
            target_user_id: string
            target_type: string
            rating: number
            comment?: string | null
            created_at?: string
          }
          Update: {
            id?: string
            booking_id?: string
            reviewer_id?: string
            target_user_id?: string
            target_type?: string
            rating?: number
            comment?: string | null
            created_at?: string
          }
          Relationships: [
            {
              foreignKeyName: "reviews_reviewer_id_fkey"
              columns: ["reviewer_id"]
              isOneToOne: false
              referencedRelation: "profiles"
              referencedColumns: ["id"]
            },
            {
              foreignKeyName: "reviews_target_user_id_fkey"
              columns: ["target_user_id"]
              isOneToOne: false
              referencedRelation: "profiles"
              referencedColumns: ["id"]
            }
          ]
        }`;

if (!content.includes('reviews: {')) {
  content = content.replace('      trips: {', reviewsType + '\n      trips: {');
}

// trips Row
content = content.replace(
  '            is_demo: boolean | null\n            created_at: string | null\n            updated_at: string | null',
  '            is_demo: boolean | null\n            is_round_trip: boolean | null\n            return_date: string | null\n            return_time: string | null\n            return_price_per_seat: number | null\n            return_available_seats: number | null\n            created_at: string | null\n            updated_at: string | null'
);

// trips Insert
content = content.replace(
  '            is_demo?: boolean | null\n            created_at?: string | null\n            updated_at?: string | null',
  '            is_demo?: boolean | null\n            is_round_trip?: boolean | null\n            return_date?: string | null\n            return_time?: string | null\n            return_price_per_seat?: number | null\n            return_available_seats?: number | null\n            created_at?: string | null\n            updated_at?: string | null'
);

// trips Update
content = content.replace(
  '            is_demo?: boolean | null\n            created_at?: string | null\n            updated_at?: string | null',
  '            is_demo?: boolean | null\n            is_round_trip?: boolean | null\n            return_date?: string | null\n            return_time?: string | null\n            return_price_per_seat?: number | null\n            return_available_seats?: number | null\n            created_at?: string | null\n            updated_at?: string | null'
);

// Bookings - replace the exact three locations
content = content.replace(
  '            status: string\n          }',
  '            status: string\n            trip_type: string | null\n          }'
);

content = content.replace(
  '            status?: string\n          }',
  '            status?: string\n            trip_type?: string | null\n          }'
);

content = content.replace(
  '            status?: string\n          }',
  '            status?: string\n            trip_type?: string | null\n          }'
);

fs.writeFileSync(typesFile, content);
console.log('Types updated');
