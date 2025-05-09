import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase/supabaseClient";
import { useAuth } from "../context/AuthContext";
import type { Event } from "../types/event";
import "../styles/eventDetails.css";

const EventDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [event, setEvent] = useState<Event | null>(null);
  const [isBooked, setIsBooked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [error, setError] = useState("");
  const { user } = useAuth();

  useEffect(() => {
    const fetchEventDetails = async () => {
      if (!id) return;

      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("events")
          .select("*")
          .eq("id", id)
          .single();

        if (error) throw error;
        setEvent(data);

        if (user) {
          const { data: bookings, error: bookingsError } = await supabase
            .from("bookings")
            .select("*")
            .eq("user_id", user.id)
            .eq("event_id", id);

          if (bookingsError) throw bookingsError;
          setIsBooked(bookings && bookings.length > 0);
        }
      } catch (error) {
        console.error("Error fetching event details:", error);
        setError("Failed to load event details");
      } finally {
        setLoading(false);
      }
    };

    fetchEventDetails();
  }, [id, user]);

  const handleBookEvent = async () => {
    if (!user || !event) return;

    setBookingLoading(true);
    try {
      const { error } = await supabase.from("bookings").insert({
        user_id: user.id,
        event_id: event.id,
      });

      if (error) throw error;
      setIsBooked(true);
      navigate("/booking-success", { state: { event } });
    } catch (error) {
      console.error("Error booking event:", error);
      setError("Failed to book event. Please try again.");
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) {
    return <div className="loading-container">Loading event details...</div>;
  }

  if (error || !event) {
    return (
      <div className="error-container">
        <p>{error || "Event not found"}</p>
        <button className="back-button" onClick={() => navigate("/")}>
          Back to Events
        </button>
      </div>
    );
  }

  return (
    <div className="event-details-container">
      <div className="event-details-content">
        <div className="event-details-image">
          <img
            src={event.image_url || "https://via.placeholder.com/800x400"}
            alt={event.name}
          />
        </div>
        <div className="event-details-info">
          <h1 className="event-details-title">{event.name}</h1>
          <div className="event-details-meta">
            <div className="event-meta-item">
              <span className="meta-label">Date:</span>
              <span className="meta-value">
                {new Date(event.date).toLocaleDateString()}
              </span>
            </div>
            <div className="event-meta-item">
              <span className="meta-label">Venue:</span>
              <span className="meta-value">{event.venue}</span>
            </div>
            <div className="event-meta-item">
              <span className="meta-label">Category:</span>
              <span className="meta-value">{event.category}</span>
            </div>
            <div className="event-meta-item">
              <span className="meta-label">Price:</span>
              <span className="meta-value">${event.price.toFixed(2)}</span>
            </div>
          </div>
          <div className="event-details-description">
            <h3>Description</h3>
            <p>{event.description}</p>
          </div>
          <div className="event-details-actions">
            {user ? (
              isBooked ? (
                <div className="booked-message">
                  <span className="booked-badge">Booked</span>
                  <p>You have already booked this event.</p>
                </div>
              ) : (
                <button
                  className="book-now-button"
                  onClick={handleBookEvent}
                  disabled={bookingLoading}
                >
                  {bookingLoading ? "Processing..." : "Book Now"}
                </button>
              )
            ) : (
              <button
                className="book-now-button"
                onClick={() => navigate("/login")}
              >
                Sign in to Book
              </button>
            )}
            <button className="back-button" onClick={() => navigate("/")}>
              Back to Events
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetails;

