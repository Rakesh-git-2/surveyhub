import React, { useEffect } from 'react';
import useApi from '../hooks/useApi';

const SurveyList = () => {
  const { loading, error, data, apiCall } = useApi();

  useEffect(() => {
    // Fetch surveys using GET method
    apiCall({
      method: 'GET',
      url: '/surveys',  // Replace with your actual endpoint
    });
  }, [apiCall]);

  if (loading) return <div>Loading surveys...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h1>Survey List</h1>
      <ul>
        {data && data.surveys && data.surveys.map((survey) => (
          <li key={survey.id}>{survey.title}</li>
        ))}
      </ul>
    </div>
  );
};

export default SurveyList;
