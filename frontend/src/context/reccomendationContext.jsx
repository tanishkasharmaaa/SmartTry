import { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";
import AuthContext from "./authContext"; // your existing auth context

const RecommendationContext = createContext();

export const RecommendationProvider = ({ children }) => {
  const { user } = useContext(AuthContext); // logged-in user
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchRecommendations = async () => {
    if (!user?._id) return;

    try {
      setLoading(true);
      setError(null);

      const res = await axios.get(
        `https://smarttry.onrender.com/api/recommendations/${user._id}`,
        { withCredentials: true }
      );

      setRecommendations(res|| []);
    } catch (err) {
      console.error(err);
      setError("Failed to load recommendations");
    } finally {
      setLoading(false);
    }
  };

  // Fetch when user logs in
  useEffect(() => {
    fetchRecommendations();
  }, [user?._id]);

  return (
    <RecommendationContext.Provider
      value={{
        recommendations,
        loading,
        error,
        refetchRecommendations: fetchRecommendations,
      }}
    >
      {children}
    </RecommendationContext.Provider>
  );
};

// Custom hook (clean usage)
// eslint-disable-next-line react-refresh/only-export-components
export const useRecommendations = () => useContext(RecommendationContext);
