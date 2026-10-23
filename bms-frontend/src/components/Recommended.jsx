import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { getRecommendedMovies } from "../apis";
import { useNavigate, useLocation } from "react-router-dom";

const Recommended = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavigate = (movie) => {
    // Extract the state string (e.g., "West Bengal") from router state or fallback
    const userState = location.state || "West Bengal";

    const originalTitle = movie.title;
    const cleanedTitle = originalTitle.includes(":")
      ? originalTitle.replace(/:/g, "")
      : originalTitle;
    const formattedTitle = cleanedTitle.replace(/\s+/g, "-").toLowerCase();

    // Fixed: Removed the ":" before ${movie._id} and used userState string
    navigate(`/movies/${userState}/${formattedTitle}/${movie._id}/ticket`);
  };

  // API Call with React Query
  const { data: recMovies, isLoading, isError } = useQuery({
    queryKey: ["recommendedMovies"],
    queryFn: async () => {
      return await getRecommendedMovies();
    },
    placeholderData: keepPreviousData,
  });

  // Safe genre formatter
  const formatGenre = (genre) => {
    if (!genre) return "";
    if (Array.isArray(genre)) return genre.join(" | ");
    if (typeof genre === "string") return genre.replaceAll("/", " | ");
    return "";
  };

  if (isLoading) {
    return (
      <div className="w-full py-12 text-center">
        <p className="text-gray-500 font-medium text-lg">Loading recommended movies...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="w-full py-12 text-center">
        <p className="text-red-500 font-medium text-lg">Something went wrong fetching recommendations.</p>
      </div>
    );
  }

  return (
    <div className="w-full py-6 bg-white">
      <div className="max-w-screen-xl mx-auto px-4">
        <div className="items-center flex justify-between mb-4">
          <h2 className="text-2xl font-semibold">Recommended Movies</h2>
          <span 
          onClick={() => navigate("/movies")} className="text-md text-red-500 cursor-pointer hover:underline font-medium">
            See All
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {recMovies?.data?.topMovies?.map((movie, i) => {
            const imageUrl =
              movie.img ||
              movie.image ||
              movie.poster ||
              movie.posterUrl ||
              movie.poster_path;

            return (
              <div
                key={movie._id || movie.id || i}
                onClick={() => handleNavigate(movie)}
                className="rounded overflow-hidden cursor-pointer"
              >
                <div className="relative">
                  <img
                    src={imageUrl}
                    alt={movie.title}
                    className="w-full h-[300px] object-cover rounded"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "https://via.placeholder.com/300x450?text=No+Image";
                    }}
                  />
                </div>

                <div className="bg-black text-white text-sm px-2 py-1 flex items-center justify-between">
                  <span>⭐ {movie.rating}/10</span>
                  <span>{movie.votes} Votes</span>
                </div>

                <div className="px-2 py-1">
                  <h3 className="font-semibold text-lg">{movie.title}</h3>
                  <p className="text-md text-gray-500">
                    {formatGenre(movie.genre)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Recommended;