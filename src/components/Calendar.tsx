import { useState, useEffect } from "react";
import "./Calendar.css";
import Modal from "./Modal";
import bookingService, { Booking } from "../services/bookingService";
import userService from "../services/userService";

// Albanian translations
const ALBANIAN_MONTHS = {
  January: "Janar",
  February: "Shkurt",
  March: "Mars",
  April: "Prill",
  May: "Maj",
  June: "Qershor",
  July: "Korrik",
  August: "Gusht",
  September: "Shtator",
  October: "Tetor",
  November: "Nëntor",
  December: "Dhjetor",
};

const ALBANIAN_DAYS = {
  Mon: "Hën",
  Tue: "Mar",
  Wed: "Mër",
  Thu: "Enj",
  Fri: "Pre",
  Sat: "Sht",
  Sun: "Die",
};

const ALBANIAN_WEEKDAYS = {
  Monday: "E Hënë",
  Tuesday: "E Martë",
  Wednesday: "E Mërkurë",
  Thursday: "E Enjte",
  Friday: "E Premte",
  Saturday: "E Shtunë",
  Sunday: "E Diel",
};

// Helper functions for date manipulation
const getWeekDates = (date: Date) => {
  const day = date.getDay();
  // Adjust to make Monday the first day (0) and Sunday the last (6)
  const diff = day === 0 ? 6 : day - 1;

  // Get Monday of the week
  const monday = new Date(date);
  monday.setDate(date.getDate() - diff);

  // Generate all days of the week
  const weekDates = [];
  for (let i = 0; i < 7; i++) {
    const currentDate = new Date(monday);
    currentDate.setDate(monday.getDate() + i);
    weekDates.push(currentDate);
  }

  return weekDates;
};

const formatDateHeader = (date: Date) => {
  const day = date.getDate();
  const weekday = date.toLocaleString("default", { weekday: "short" });
  // Translate the weekday to Albanian
  const albanianWeekday =
    ALBANIAN_DAYS[weekday as keyof typeof ALBANIAN_DAYS] || weekday;
  return `${day} ${albanianWeekday}`;
};

const formatMonthYear = (dates: Date[]) => {
  const months = Array.from(
    new Set(
      dates.map((date) => {
        const month = date.toLocaleString("default", { month: "long" });
        // Translate the month to Albanian
        return ALBANIAN_MONTHS[month as keyof typeof ALBANIAN_MONTHS] || month;
      })
    )
  );

  const year = dates[0].getFullYear();

  if (months.length === 1) {
    return `${months[0]} ${year}`;
  } else {
    return `${months[0]} - ${months[months.length - 1]} ${year}`;
  }
};

// Define 2-hour time slots
const TIME_SLOTS = [
  { start: 10, end: 12 },
  { start: 12, end: 14 },
  { start: 14, end: 16 },
  { start: 16, end: 18 },
  { start: 18, end: 20 },
];

// Maximum bookings per slot
const MAX_BOOKINGS_PER_SLOT = 2;

function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [weekDates, setWeekDates] = useState<Date[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [selectedSlot, setSelectedSlot] = useState<{
    date: Date;
    timeSlot: { start: number; end: number };
  } | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Load bookings and current user
  useEffect(() => {
    const fetchData = async () => {
      try {
        const bookingsData = await bookingService.getBookings();
        setBookings(bookingsData);

        const user = userService.getCurrentUser();
        setCurrentUser(user);
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    setWeekDates(getWeekDates(currentDate));
  }, [currentDate]);

  // Format time slot for display (e.g., "10:00-12:00")
  const formatTimeSlot = (timeSlot: { start: number; end: number }) => {
    return `${timeSlot.start.toString().padStart(2, "0")}:00-${timeSlot.end
      .toString()
      .padStart(2, "0")}:00`;
  };

  const goToPreviousWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() - 7);
    setCurrentDate(newDate);
  };

  const goToNextWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + 7);
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Check if a date is in the past (before today)
  const isDateInPast = (date: Date): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to beginning of day for comparison
    return date < today;
  };

  // Check if a time slot is in the past for today
  const isTimeSlotInPast = (
    date: Date,
    timeSlot: { start: number; end: number }
  ): boolean => {
    const now = new Date();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // If it's not today, use isDateInPast
    if (date.getTime() !== today.getTime()) {
      return isDateInPast(date);
    }

    // If it's today, check if the time slot has already passed
    return now.getHours() >= timeSlot.end;
  };

  const handleCellClick = (
    date: Date,
    timeSlot: { start: number; end: number }
  ) => {
    if (!currentUser) return; // Only allow booking if user is logged in

    // Check if the date or time slot is in the past
    if (isTimeSlotInPast(date, timeSlot)) {
      setErrorMessage(
        "Nuk mund të rezervoni në një datë ose orar që ka kaluar."
      );
      setIsErrorModalOpen(true);
      return;
    }

    // Check if the user already has a booking for this slot
    const dateStr = date.toISOString().split("T")[0];
    const userBookingsForSlot = bookings.filter((booking) => {
      const bookingDate = booking.date.split("T")[0];
      return (
        bookingDate === dateStr &&
        booking.timeSlot.start === timeSlot.start &&
        booking.timeSlot.end === timeSlot.end &&
        booking.userId === currentUser.id
      );
    });

    if (userBookingsForSlot.length > 0) {
      setErrorMessage("Ju tashmë keni një rezervim për këtë orar.");
      setIsErrorModalOpen(true);
      return;
    }

    // Check if the slot is already at maximum capacity
    const existingBookingsForSlot = bookings.filter((booking) => {
      const bookingDate = booking.date.split("T")[0];
      return (
        bookingDate === dateStr &&
        booking.timeSlot.start === timeSlot.start &&
        booking.timeSlot.end === timeSlot.end
      );
    });

    if (existingBookingsForSlot.length >= MAX_BOOKINGS_PER_SLOT) {
      setErrorMessage(
        `Ky orar është tashmë plotësisht i rezervuar (maksimumi ${MAX_BOOKINGS_PER_SLOT} rezervime).`
      );
      setIsErrorModalOpen(true);
      return;
    }

    setSelectedSlot({ date, timeSlot });
    setIsModalOpen(true);
  };

  const handleBooking = async () => {
    if (!selectedSlot || !currentUser) return;

    try {
      // Double-check that the slot isn't full (in case of race conditions)
      const dateStr = selectedSlot.date.toISOString().split("T")[0];
      const existingBookingsForSlot = bookings.filter((booking) => {
        const bookingDate = booking.date.split("T")[0];
        return (
          bookingDate === dateStr &&
          booking.timeSlot.start === selectedSlot.timeSlot.start &&
          booking.timeSlot.end === selectedSlot.timeSlot.end
        );
      });

      if (existingBookingsForSlot.length >= MAX_BOOKINGS_PER_SLOT) {
        setErrorMessage(
          `Ky orar është tashmë plotësisht i rezervuar (maksimumi ${MAX_BOOKINGS_PER_SLOT} rezervime).`
        );
        setIsErrorModalOpen(true);
        setIsModalOpen(false);
        return;
      }

      // Double-check that the date/time isn't in the past
      if (isTimeSlotInPast(selectedSlot.date, selectedSlot.timeSlot)) {
        setErrorMessage(
          "Nuk mund të rezervoni në një datë ose orar që ka kaluar."
        );
        setIsErrorModalOpen(true);
        setIsModalOpen(false);
        return;
      }

      const newBooking = await bookingService.createBooking({
        date: selectedSlot.date.toISOString(),
        timeSlot: selectedSlot.timeSlot,
        userId: currentUser.id,
        userName: currentUser.name,
      });

      setBookings([...bookings, newBooking]);
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error creating booking:", error);
      setErrorMessage(
        "Ndodhi një gabim gjatë krijimit të rezervimit tuaj. Ju lutemi provoni përsëri."
      );
      setIsErrorModalOpen(true);
      setIsModalOpen(false);
    }
  };

  const handleDeleteBooking = async (bookingId: string) => {
    if (!currentUser) return;

    try {
      await bookingService.deleteBooking(bookingId);
      setBookings(bookings.filter((booking) => booking.id !== bookingId));
    } catch (error) {
      console.error("Error deleting booking:", error);
      setErrorMessage(
        "Ndodhi një gabim gjatë fshirjes së rezervimit tuaj. Ju lutemi provoni përsëri."
      );
      setIsErrorModalOpen(true);
    }
  };

  const getBookingsForCell = (
    date: Date,
    timeSlot: { start: number; end: number }
  ) => {
    const dateStr = date.toISOString().split("T")[0]; // Get YYYY-MM-DD part
    return bookings.filter((booking) => {
      const bookingDate = booking.date.split("T")[0];
      return (
        bookingDate === dateStr &&
        booking.timeSlot?.start === timeSlot?.start &&
        booking.timeSlot?.end === timeSlot?.end
      );
    });
  };

  const formatDateForDisplay = (date: Date) => {
    const weekday = date.toLocaleDateString("en-US", { weekday: "long" });
    const month = date.toLocaleDateString("en-US", { month: "long" });
    const day = date.getDate();
    const year = date.getFullYear();

    // Translate to Albanian
    const albanianWeekday =
      ALBANIAN_WEEKDAYS[weekday as keyof typeof ALBANIAN_WEEKDAYS] || weekday;
    const albanianMonth =
      ALBANIAN_MONTHS[month as keyof typeof ALBANIAN_MONTHS] || month;

    return `${albanianWeekday}, ${day} ${albanianMonth} ${year}`;
  };

  const getCellBackgroundColor = (
    cellBookings: Booking[],
    date: Date,
    timeSlot: { start: number; end: number }
  ) => {
    // If the date or time slot is in the past, use a gray background
    if (isTimeSlotInPast(date, timeSlot)) return "#e0e0e0"; // Gray for past dates

    if (cellBookings.length >= MAX_BOOKINGS_PER_SLOT) return "#ffebeb"; // Light red for fully booked
    if (cellBookings.length === 1) return "#f8f9fa"; // Light gray for partially booked
    return "white"; // White for empty
  };

  if (loading) {
    return <div>Duke ngarkuar kalendarin...</div>;
  }

  return (
    <div className="calendar-container">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "15px",
        }}
      >
        <div>
          <button onClick={goToPreviousWeek} style={{ marginRight: "10px" }}>
            ←
          </button>
          <button onClick={goToToday}>Sot</button>
          <button onClick={goToNextWeek} style={{ marginLeft: "10px" }}>
            →
          </button>
        </div>
        <h2>{weekDates.length > 0 ? formatMonthYear(weekDates) : ""}</h2>
        <div></div> {/* Empty div for flex spacing */}
      </div>

      <div className="calendar">
        <div className="calendar-header">
          <div className="time-column-header"></div>
          {weekDates.map((date, index) => (
            <div key={index} className="day-header">
              {formatDateHeader(date)}
            </div>
          ))}
        </div>

        <div className="calendar-body">
          {TIME_SLOTS.map((timeSlot, timeIndex) => (
            <div key={timeIndex} className="calendar-row">
              <div className="time-slot">{formatTimeSlot(timeSlot)}</div>

              {weekDates.map((date, dateIndex) => {
                const cellBookings = getBookingsForCell(date, timeSlot);
                const isFull = cellBookings.length >= MAX_BOOKINGS_PER_SLOT;
                const isPast = isTimeSlotInPast(date, timeSlot);

                return (
                  <div
                    key={dateIndex}
                    className="calendar-cell"
                    onClick={() => handleCellClick(date, timeSlot)}
                    style={{
                      backgroundColor: getCellBackgroundColor(
                        cellBookings,
                        date,
                        timeSlot
                      ),
                      cursor: isPast || isFull ? "not-allowed" : "pointer",
                      height: "60px", // Make cells taller for 2-hour slots
                      opacity: isPast ? 0.7 : 1, // Reduce opacity for past dates
                    }}
                  >
                    {cellBookings.map((booking) => (
                      <div
                        key={booking.id}
                        className="booking"
                        style={{
                          backgroundColor:
                            booking.userId === currentUser?.id
                              ? "#4285f4"
                              : "#f5f5f5",
                          color:
                            booking.userId === currentUser?.id
                              ? "white"
                              : "black",
                          padding: "2px 5px",
                          margin: "2px 0",
                          borderRadius: "3px",
                          fontSize: "12px",
                          position: "relative",
                        }}
                      >
                        {booking.userName}
                        {booking.userId === currentUser?.id && !isPast && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteBooking(booking.id!);
                            }}
                            style={{
                              position: "absolute",
                              right: "2px",
                              top: "2px",
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              fontSize: "10px",
                              color: "white",
                            }}
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <h3>Konfirmo Rezervimin</h3>
        {selectedSlot && (
          <p>
            A jeni i sigurt që dëshironi të rezervoni për orarin{" "}
            {formatTimeSlot(selectedSlot.timeSlot)} në{" "}
            {formatDateForDisplay(selectedSlot.date)}?
          </p>
        )}
        <div className="modal-buttons">
          <button className="cancel" onClick={() => setIsModalOpen(false)}>
            Anulo
          </button>
          <button className="confirm" onClick={handleBooking}>
            Konfirmo
          </button>
        </div>
      </Modal>

      <Modal
        isOpen={isErrorModalOpen}
        onClose={() => setIsErrorModalOpen(false)}
      >
        <h3>Gabim Rezervimi</h3>
        <p>{errorMessage}</p>
        <div className="modal-buttons">
          <button
            className="confirm"
            onClick={() => setIsErrorModalOpen(false)}
          >
            OK
          </button>
        </div>
      </Modal>
    </div>
  );
}

export default Calendar;
