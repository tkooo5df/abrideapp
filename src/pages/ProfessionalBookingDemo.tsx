import { useState } from "react";
import ProfessionalBookingCard from "@/components/booking/ProfessionalBookingCard";

const ProfessionalBookingDemo = () => {
  const [bookings] = useState([
    {
      id: 1,
      from: "تمنراست",
      to: "تيارت",
      driverName: "amine Kerkar",
      driverPhone: "213559509817",
      date: "2000-11-11",
      time: "00:11:00",
      price: 2500,
      availableSeats: 4,
      totalSeats: 4,
      driverRating: 4.8,
      driverRatingsCount: 156
    },
    {
      id: 2,
      from: "الجزائر",
      to: "وهران",
      driverName: "محمد أحمد",
      driverPhone: "+213666123456",
      date: "2023-12-15",
      time: "14:30:00",
      price: 3200,
      availableSeats: 2,
      totalSeats: 4,
      driverRating: 4.5,
      driverRatingsCount: 203
    },
    {
      id: 3,
      from: "قسنطينة",
      to: "عنابة",
      driverName: "سارة بن رمضان",
      driverPhone: "+213555987654",
      date: "2023-12-18",
      time: "09:15:00",
      price: 1800,
      availableSeats: 3,
      totalSeats: 4,
      driverRating: 4.9,
      driverRatingsCount: 89
    }
  ]);

  const handleBookSeat = (id: number) => {
    alert(`تم حجز مقعد في الرحلة من ${bookings.find(b => b.id === id)?.from} إلى ${bookings.find(b => b.id === id)?.to}`);
  };

  const handleViewDetails = (id: number) => {
    alert(`عرض تفاصيل الرحلة من ${bookings.find(b => b.id === id)?.from} إلى ${bookings.find(b => b.id === id)?.to}`);
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8 text-center">بطاقات الحجز الاحترافية</h1>
      
      <div className="space-y-6">
        {bookings.map(booking => (
          <ProfessionalBookingCard
            key={booking.id}
            from={booking.from}
            to={booking.to}
            driverName={booking.driverName}
            driverPhone={booking.driverPhone}
            date={booking.date}
            time={booking.time}
            price={booking.price}
            availableSeats={booking.availableSeats}
            totalSeats={booking.totalSeats}
            driverRating={booking.driverRating}
            driverRatingsCount={booking.driverRatingsCount}
            onBookSeat={() => handleBookSeat(booking.id)}
            onViewDetails={() => handleViewDetails(booking.id)}
          />
        ))}
      </div>
    </div>
  );
};

export default ProfessionalBookingDemo;