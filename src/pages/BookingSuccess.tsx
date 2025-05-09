import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

import type { Event } from "../types/event";
import "../styles/bookingSuccess.css";

interface LocationState {
  event?: Event;
}

const BookingSuccess = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState;
  const event = state?.event;

  useEffect(() => {
    if (!event) {
      navigate("/");
    }
  }, [event, navigate]);

  if (!event) return null;

  return (
    <div className="booking-success-container">
      <div className="booking-success-content">
        <div className="success-icon">🎉</div>
        <h1>Booking Confirmed!</h1>
        <p className="success-message">
          You have successfully booked a ticket for:
        </p>
        <div className="event-summary">
          <h2>{event.name}</h2>
          <p className="event-date">
            Date: {new Date(event.date).toLocaleDateString()}
          </p>
          <p className="event-venue">Venue: {event.venue}</p>
        </div>
        <p className="instructions">
          A confirmation email has been sent to your email address. You can view
          all your bookings in the "My Bookings" section.
        </p>
        <div className="success-actions">
          <button
            className="primary-button"
            onClick={() => navigate("/my-bookings")}
          >
            View My Bookings
          </button>
          <button className="secondary-button" onClick={() => navigate("/")}>
            Find More Events
          </button>
        </div>
      </div>
    </div>
  );
};

export default BookingSuccess;
