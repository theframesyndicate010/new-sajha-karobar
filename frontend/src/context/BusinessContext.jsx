import { useEffect, useMemo, useState } from "react";

import { apiClient } from "../services/apiClient.js";
import { BusinessContext } from "./business-context.js";

const STORAGE_KEY = "sajha-karobar-active-business";

export function BusinessProvider({ children }) {
  const [businesses, setBusinesses] = useState([]);
  const [activeBusinessId, setActiveBusinessId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadBusinesses = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await apiClient.getBusinesses();
        const fetchedBusinesses = response.data || [];

        setBusinesses(fetchedBusinesses);

        const storedBusinessId = localStorage.getItem(STORAGE_KEY);
        const matchedStored = fetchedBusinesses.find((item) => item.id === storedBusinessId);

        if (matchedStored) {
          setActiveBusinessId(matchedStored.id);
        } else if (fetchedBusinesses[0]) {
          setActiveBusinessId(fetchedBusinesses[0].id);
        }
      } catch (loadError) {
        setError(loadError.message || "Failed to load businesses");
      } finally {
        setLoading(false);
      }
    };

    loadBusinesses();
  }, []);

  useEffect(() => {
    if (activeBusinessId) {
      localStorage.setItem(STORAGE_KEY, activeBusinessId);
    }
  }, [activeBusinessId]);

  const activeBusiness = useMemo(
    () => businesses.find((item) => item.id === activeBusinessId) || null,
    [activeBusinessId, businesses],
  );

  const value = {
    businesses,
    activeBusiness,
    activeBusinessId,
    setActiveBusinessId,
    loading,
    error,
  };

  return <BusinessContext.Provider value={value}>{children}</BusinessContext.Provider>;
}
