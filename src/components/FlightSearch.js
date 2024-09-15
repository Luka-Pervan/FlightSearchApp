import React, { useState } from "react";
import axios from "axios";
import { iataCodes, BASE_URL } from "./constants";

function FlightSearch() {
  const [formData, setFormData] = useState({
    origin: "",
    destination: "",
    departureDate: "",
    returnDate: "",
    passengers: 1,
    currency: "EUR",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [flightResults, setFlightResults] = useState([]);

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleString("hr-HR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: ["origin", "destination"].includes(e.target.name)
        ? e.target1?.value.toUpperCase()
        : e.target.value,
      [e.target.name]:
        ("returnDate" && e.target?.value == "") || e.target?.value == ""
          ? null
          : e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    try {
      setIsLoading(true);
      e.preventDefault();
      const response = await axios.post(`${BASE_URL}/Flights/search`, formData);
      setFlightResults(response.data.data);
      setError(false);
    } catch (error) {
      setError(error);
      setFlightResults([]);
      console.error("Error fetching flight data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  function getOriginAndDestinationSegments(itineraries) {
    // Initialize variables for origin and destination
    let originSegment = null;
    let destinationSegment = null;
    // Ensure there is at least one itinerary
    if (itineraries.length === 0) {
      return { originSegment, destinationSegment }; // Return null values if no itineraries exist
    }
    // Use only the first itinerary if there are multiple itineraries
    const firstItinerary = itineraries[0];
    const segments = firstItinerary.segments;
    // Logic for a single itinerary:
    if (segments.length === 1) {
      // If only 1 segment, the origin is the first segment's departure
      originSegment = segments[0];
    } else if (segments.length === 2) {
      // If only 2 segments, origin is the first segment's departure, destination is the first segment's arrival
      originSegment = segments[0];
      destinationSegment = segments[1]; // First segment also holds the destination
    } else {
      // For more than 2 segments:
      originSegment = segments[0]; // First segment's departure is always the origin

      // Determine the destination based on the number of segments:
      if (segments.length === 3 || segments.length === 4) {
        destinationSegment = segments[1]; // Destination from the 2nd segment
      } else if (segments.length === 5) {
        destinationSegment = segments[2]; // Destination from the 3rd segment
      } else {
        // Extend the logic for itineraries with more than 5 segments if necessary
        destinationSegment = segments[Math.floor(segments.length / 2)]; // Example: take mid-point segment as destination
      }
    }
    return { originSegment, destinationSegment };
  }

  return (
    <div>
      <div className="form">
        <h2 className="title">Search flights</h2>
        {error && error.message && (
          <div className="error-message">{error.message}</div>
        )}
        <form onSubmit={handleSubmit}>
          <div className="row">
            <div className="input-wrapper">
              <label htmlFor="origin">Origin (IATA):</label>
              <select
                name="origin"
                value={formData.origin}
                onChange={handleChange}
                required
              >
                <option value="">Select origin</option>
                {iataCodes.map((iata) => (
                  <option key={iata.code} value={iata.code}>
                    {iata.code} - {iata.airport}
                  </option>
                ))}
              </select>
            </div>

            <div className="input-wrapper">
              <label htmlFor="destination">Destination (IATA):</label>
              <select
                name="destination"
                id=""
                value={formData.destination}
                onChange={handleChange}
                required
              >
                <option value="">Select destination</option>
                {iataCodes.map((iata) => (
                  <option key={iata.code} value={iata.code}>
                    {iata.code} - {iata.airport}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="row">
            <div className="input-wrapper">
              <label>Departure date:</label>
              <input
                type="date"
                name="departureDate"
                max={formData.returnDate}
                value={formData.departureDate}
                onChange={handleChange}
                required
              />
            </div>

            <div className="input-wrapper">
              <label>Return date:</label>
              <input
                type="date"
                min={formData.departureDate}
                name="returnDate"
                value={formData.returnDate}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="row">
            <div className="input-wrapper">
              <label>Num. of passangers:</label>
              <input
                type="number"
                name="passangers"
                max={9}
                min={1}
                value={formData.passengers}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    passengers: e.target.value,
                  }))
                }
                required
              />
            </div>

            <div className="input-wrapper">
              <label>Currency:</label>
              <select
                name="currency"
                value={formData.currency}
                onChange={handleChange}
              >
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="HRK">HRK</option>
              </select>
            </div>
          </div>

          <button type="submit" className="submit-btn" disabled={isLoading}>
            {isLoading ? "Searching..." : "Search"}
          </button>
        </form>
      </div>

      <div className="flights">
        <table>
          <thead>
            <tr>
              <th>Departure</th>
              <th>Arrival</th>
              <th>Departure date</th>
              <th>Arrival date</th>
              <th>Itineraries</th>
              <th>Passangers</th>
              <th>Price</th>
              <th>Currency</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && <p className="loading">Loading...</p>}
            {!isLoading && flightResults?.length === 0 && <p>No results.</p>}
            {!isLoading &&
              flightResults?.length > 0 &&
              flightResults.map((flight, index) => {
                const { originSegment, destinationSegment } =
                  getOriginAndDestinationSegments(flight.itineraries);

                const departureDate = originSegment
                  ? formatDate(originSegment.departure.at)
                  : "N/A";
                const arrivalDate = destinationSegment
                  ? formatDate(destinationSegment.arrival.at)
                  : "N/A";

                // Broj presjedanja (broj segmenata - 1)
                const layovers = flight.itineraries[0]?.segments?.length;

                // Broj putnika
                const bookableSeats = flight.numberOfBookableSeats || 0;
                const passengers = 9 - bookableSeats;

                return (
                  <tr key={index}>
                    <td>{originSegment?.departure.iataCode}</td>
                    <td>{destinationSegment?.arrival?.iataCode}</td>
                    <td>{departureDate}</td>
                    <td>{arrivalDate}</td>
                    <td>{layovers}</td>
                    <td>{passengers}</td>
                    <td>{flight.price.grandTotal}</td>
                    <td>{flight.price.currency}</td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default FlightSearch;
