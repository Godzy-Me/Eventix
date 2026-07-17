import { Routes, Route } from "react-router-dom";
import Header from "./components/shared/Header";
import Footer from "./components/shared/Footer";
import Home from "./pages/Home";

function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home/>} />
          <Route path="/profile/:id" element={<h1>Profile Page</h1>} />
          <Route path="/movies" element={<h1>Movies Page</h1>} />
        </Routes>
      </main>

      <Footer />
    </div>
  );
}

export default App;