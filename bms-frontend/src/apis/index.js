import { axiosWrapper } from "./axiosWrapper";

// List all the endpoints;
export const getRecommendedMovies = () => axiosWrapper.get("/movies/recommended");
export const getAllMovies = () => axiosWrapper.get("/movies");
export const getMovieById = (data) => axiosWrapper.get(`/movies/${data}`);
export const getShowsByMovieAndLocation = (movieId, state, date) =>
    axiosWrapper.get("/shows", {
        params: {
            movieId, state, date
        }
    });

export const getShowById = (data) => axiosWrapper.get(`/shows/${data}`);

// ---- auth / user ----
export const sendOtp = (email) => axiosWrapper.post("/auth/send-otp", { email });
export const verifyOtp = (data) => axiosWrapper.post("/auth/verify-otp", data); // { email, otp, hash }
export const logoutUser = () => axiosWrapper.post("/auth/logout");
export const getUser = () => axiosWrapper.get("/users/me");
export const activateUser = (id, data) => axiosWrapper.put(`/users/activate/${id}`, data); // { name, phone }

// ---- bookings / payments ----
export const getMyLocks = (showId) => axiosWrapper.get(`/bookings/locks/${showId}`);
export const getMyBookings = () => axiosWrapper.get("/bookings/my");
export const getBookingById = (id) => axiosWrapper.get(`/bookings/${id}`);

export const createPaymentOrder = (data) => axiosWrapper.post("/payments/create-order", data); // { showId, seatIds }
export const verifyPayment = (data) => axiosWrapper.post("/payments/verify", data);
export const reportPaymentFailed = (data) => axiosWrapper.post("/payments/failed", data); // { orderId, reason }
export const cancelPendingBooking = (bookingId) => axiosWrapper.post("/payments/cancel", { bookingId });
export const mockPay = (orderId) => axiosWrapper.post("/payments/mock/pay", { orderId });
