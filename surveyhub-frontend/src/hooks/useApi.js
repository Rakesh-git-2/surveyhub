import { useState } from 'react';
import { apiRequest } from '../api/api';

const useApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  // API call method using the apiRequest function
  const apiCall = async ({ method, url, params, data, headers }) => {
    setLoading(true);
    setError(null);

    try {
      const responseData = await apiRequest({ method, url, params, data, headers });
      setData(responseData);
      setLoading(false);
      return responseData;
    } catch (err) {
      setLoading(false);
      setError(err.message);
      throw err;
    }
  };

  return { loading, error, data, apiCall };
};

export default useApi;
