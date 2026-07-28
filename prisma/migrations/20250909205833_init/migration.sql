-- CreateTable
CREATE TABLE "profiles" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT,
    "first_name" TEXT,
    "last_name" TEXT,
    "full_name" TEXT,
    "phone" TEXT,
    "role" TEXT NOT NULL DEFAULT 'passenger',
    "avatar_url" TEXT,
    "wilaya" TEXT,
    "commune" TEXT,
    "address" TEXT,
    "date_of_birth" TEXT,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "bookings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "pickup_location" TEXT NOT NULL,
    "destination_location" TEXT NOT NULL,
    "passenger_id" TEXT,
    "driver_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "seats_booked" INTEGER NOT NULL DEFAULT 1,
    "total_amount" REAL,
    "payment_method" TEXT DEFAULT 'cod',
    "trip_id" TEXT,
    "notes" TEXT,
    "pickup_time" TEXT,
    "special_requests" TEXT,
    CONSTRAINT "bookings_passenger_id_fkey" FOREIGN KEY ("passenger_id") REFERENCES "profiles" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "bookings_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "profiles" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "bookings_trip_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "trips" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "trips" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "driver_id" TEXT NOT NULL,
    "vehicle_id" TEXT,
    "from_wilaya_id" INTEGER NOT NULL,
    "to_wilaya_id" INTEGER NOT NULL,
    "departure_date" TEXT NOT NULL,
    "departure_time" TEXT NOT NULL,
    "price_per_seat" REAL NOT NULL,
    "total_seats" INTEGER NOT NULL,
    "available_seats" INTEGER NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "trips_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "profiles" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "trips_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "vehicles" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "driver_id" TEXT NOT NULL,
    "make" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "color" TEXT NOT NULL,
    "license_plate" TEXT NOT NULL,
    "seats" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "vehicles_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "profiles" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "wilayas" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "code" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "name_ar" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "system_settings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "description" TEXT,
    "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" TEXT,
    CONSTRAINT "system_settings_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "profiles" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "admin_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "admin_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "target_type" TEXT,
    "target_id" TEXT,
    "details" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "admin_logs_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "profiles" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'info',
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "related_id" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "profiles_email_key" ON "profiles"("email");

-- CreateIndex
CREATE UNIQUE INDEX "wilayas_code_key" ON "wilayas"("code");

-- CreateIndex
CREATE UNIQUE INDEX "system_settings_key_key" ON "system_settings"("key");
