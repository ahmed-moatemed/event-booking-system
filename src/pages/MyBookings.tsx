import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase/supabaseClient";
import { useAuth } from "../context/AuthContext";
import type { Booking, Event } from "../types/event";
import "../styles/myBookings.css";

const MyBookings = () => {
  const [bookings, setBookings] = useState<(Booking & { event: Event })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { user } = useAuth();

  useEffect(() => {
    const fetchBookings = async () => {
      if (!user) return;

      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("bookings")
          .select("*, event:events(*)")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (error) throw error;
        setBookings(data || []);
      } catch (error) {
        console.error("Error fetching bookings:", error);
        setError("Failed to load your bookings");
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [user]);

  const cancelBooking = async (bookingId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("bookings")
        .delete()
        .eq("id", bookingId)
        .eq("user_id", user.id);

      if (error) throw error;

      // Update UI by removing the deleted booking
      setBookings(bookings.filter((booking) => booking.id !== bookingId));
    } catch (error) {
      console.error("Error canceling booking:", error);
      setError("Failed to cancel booking");
    }
  };

  if (loading) {
    return <div className="loading-container">Loading your bookings...</div>;
  }

  return (
    <div className="my-bookings-container">
      <h1>My Bookings</h1>

      {error && <div className="error-message">{error}</div>}

      {bookings.length === 0 ? (
        <div className="no-bookings">
          <p>You haven't booked any events yet.</p>
          <Link to="/" className="browse-events-button">
            Browse Events
          </Link>
        </div>
      ) : (
        <div className="bookings-list">
          {bookings.map((booking) => (
            <div key={booking.id} className="booking-card">
              <div className="booking-image">
                <img
                  src={
                    booking.event.image_url || "https://via.placeholder.com/150"
                  }
                  alt={booking.event.name}
                />
              </div>
              <div className="booking-details">
                <h3>{booking.event.name}</h3>
                <p className="booking-date">
                  <span>Date:</span>{" "}
                  {new Date(booking.event.date).toLocaleDateString()}
                </p>
                <p className="booking-venue">
                  <span>Venue:</span> {booking.event.venue}
                </p>
                <p className="booking-created">
                  <span>Booked on:</span>{" "}
                  {new Date(booking.created_at).toLocaleDateString()}
                </p>
              </div>
              <div className="booking-actions">
                <Link
                  to={`/events/${booking.event_id}`}
                  className="view-event-button"
                >
                  View Event
                </Link>
                <button
                  onClick={() => cancelBooking(booking.id)}
                  className="cancel-booking-button"
                >
                  Cancel Booking
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyBookings;
