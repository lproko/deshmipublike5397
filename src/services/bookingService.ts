import api from "./api";

export interface Booking {
  id?: string;
  date: string; // ISO string format
  timeSlot: {
    start: number;
    end: number;
  };
  userId: number;
  userName: string;
}

const bookingService = {
  getBookings: async (): Promise<Booking[]> => {
    try {
      const response = await api.get("/bookings");
      return response.data;
    } catch (error) {
      return Promise.reject(error);
    }
  },

  createBooking: async (booking: Omit<Booking, "id">): Promise<Booking> => {
    try {
      const response = await api.post("/bookings", booking);
      return response.data;
    } catch (error) {
      return Promise.reject(error);
    }
  },

  deleteBooking: async (id: string): Promise<void> => {
    try {
      await api.delete(`/bookings/${id}`);
      return Promise.resolve();
    } catch (error) {
      return Promise.reject(error);
    }
  },
};

export default bookingService;
