import { Routes, Route } from "react-router-dom";
import Header from "./components/shared/Header";
import Footer from "./components/shared/Footer";
import SignInModel from "./components/shared/SignInModel";
import RequireAuth from "./components/shared/RequireAuth";
import Home from "./pages/Home";
import Movies from "./pages/Movies";
import MovieDetails from "./pages/MovieDetails";
import Profile from "./pages/Profile";
import SeatLayout from "./pages/SeatLayout";
import BookingConfirmation from "./pages/BookingConfirmation";
import { useMatch } from "react-router-dom";
import { SeatProvider } from "./context/SeatContext";
import Checkout from "./pages/Checkout"; 
import { useLoadUser } from "./hooks/useLoaduser";
import FullScreenLoader from "./components/shared/FullScreenLoader";

function App() {
  const { isLoading } = useLoadUser();

  const isSeatLayoutPage = useMatch(
    "/movies/:movieId/:movieName/:state/theater/:theaterId/show/:showId/seat-layout"
  );

  const isCheckoutPage = useMatch("/shows/:showId/:state/checkout");

  if (isLoading) {
    return <FullScreenLoader />;
  }

  return (
    <SeatProvider>
      <div className="min-h-screen flex flex-col">
        {!isSeatLayoutPage && !isCheckoutPage && <Header />}

        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/movies" element={<Movies />} />
            <Route path="/movies/:state/:movieName/:id/ticket" element={<MovieDetails />} />
            <Route
              path="/profile"
              element={
                <RequireAuth>
                  <Profile />
                </RequireAuth>
              }
            />
            <Route
              path="/movies/:movieId/:movieName/:state/theater/:theaterId/show/:showId/seat-layout"
              element={
                <RequireAuth>
                  <SeatLayout />
                </RequireAuth>
              }
            />
            <Route
              path="/shows/:showId/:state/checkout"
              element={
                <RequireAuth>
                  <Checkout />
                </RequireAuth>
              }
            />
            <Route
              path="/booking/:bookingId/confirmation"
              element={
                <RequireAuth>
                  <BookingConfirmation />
                </RequireAuth>
              }
            />
          </Routes>
        </main>

        {!isSeatLayoutPage && !isCheckoutPage && <Footer />}
      </div>

      {/* sign-in modal is global so every page (including the seat/checkout pages) can open it */}
      <SignInModel />
    </SeatProvider>
  );
}

export default App;
