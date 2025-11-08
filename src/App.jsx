// src/App.jsx

import { useState, useEffect } from 'react';
import apiClient from './apiClient'; // 👈 ADDED: Import our new API client
// import axios from 'axios';      // 👈 REMOVED: No longer using global axios
import Cookies from 'js-cookie';
import './App.css';

const COOKIE_NAME = 'secret-santa-drawn';

function App() {
  const [allPeople, setAllPeople] = useState([]);
  const [selectedPerson, setSelectedPerson] = useState('');
  const [drawnPerson, setDrawnPerson] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  // On component load, check if the cookie exists. No changes needed here.
  useEffect(() => {
    const previouslyDrawn = Cookies.get(COOKIE_NAME);
    if (previouslyDrawn) {
      setHasDrawn(true);
      setDrawnPerson(previouslyDrawn);
    }
  }, []);

  // On component load, fetch the list of all people for the dropdown
  useEffect(() => {
    if (!hasDrawn) {
      // 👇 CHANGED: Using apiClient and removed '/api' from the path
      apiClient.get('/all-people')
        .then(response => {
          if (response.data.success) {
            setAllPeople(response.data.people);
          }
        })
        .catch(err => {
          console.error("Failed to fetch people:", err);
          setError("Could not load participants. Please try refreshing.");
        });
    }
  }, [hasDrawn]);

  const handleDraw = async () => {
    if (!selectedPerson) {
      setError('Please select your name first!');
      return;
    }

    setIsLoading(true);
    setError('');
    setDrawnPerson(null);

    try {
      // 👇 CHANGED: Using apiClient and removed '/api' from the path
      const response = await apiClient.post('/draw', {
        drawerName: selectedPerson,
      });

      if (response.data.success) {
        const person = response.data.drawnPerson;
        setDrawnPerson(person);
        setHasDrawn(true);
        // Set a cookie that expires in 7 days
        Cookies.set(COOKIE_NAME, person, { expires: 7 });
      } else {
        setError(response.data.error || 'An unknown error occurred.');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.error || "An API error occurred. Maybe everyone has been picked?";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // The JSX below has no changes, as it only depends on state variables.
  if (hasDrawn) {
    return (
      <div className="container drawn-container">
        <h1>You have drawn your Secret Santa!</h1>
        <p className="drawn-name">{drawnPerson}</p>
        <p className="reminder">Don't forget! Keep it a secret.</p>
      </div>
    );
  }

  return (
    <div className="container">
      <h1>Secret Santa Picker</h1>
      <p>Select your name and draw your person!</p>
      
      <div className="controls">
        <select
          value={selectedPerson}
          onChange={(e) => setSelectedPerson(e.target.value)}
          disabled={isLoading}
        >
          <option value="">-- Who are you? --</option>
          {allPeople.map(person => (
            <option key={person.name} value={person.name}>{person.name}</option>
          ))}
        </select>
        <button onClick={handleDraw} disabled={isLoading || !selectedPerson}>
          {isLoading ? 'Drawing...' : 'Draw a Name'}
        </button>
      </div>
      
      {error && <p className="error-message">{error}</p>}
    </div>
  );
}

export default App;