import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase/supabaseClient";
import { useAuth } from "../context/AuthContext";
import type { Event, Booking } from "../types/event";
import "../styles/home.css";

const Home = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    let mounted = true;

    const fetchEvents = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch events first
        let query = supabase.from("events").select("*");

        if (selectedCategory) {
          query = query.eq("category", selectedCategory);
        }

        const { data: eventsData, error: eventsError } = await query.order(
          "date",
          { ascending: true }
        );

        if (eventsError) throw eventsError;

        if (mounted) {
          setEvents(eventsData || []);

          // Extract unique categories for filter
          if (!selectedCategory) {
            const uniqueCategories = Array.from(
              new Set(eventsData?.map((event) => event.category) || [])
            );
            setCategories(uniqueCategories);
          }
        }

        // Fetch user bookings separately if logged in
        if (user) {
          try {
            const { data: bookingsData, error: bookingsError } = await supabase
              .from("bookings")
              .select("*")
              .eq("user_id", user.id);

            if (bookingsError) {
              console.error("Error fetching bookings:", bookingsError);
            } else if (mounted) {
              setBookings(bookingsData || []);
            }
          } catch (bookingFetchError) {
            console.error("Error in booking fetch:", bookingFetchError);
            // Don't throw here, we still want to show events even if bookings fail
          }
        }
      } catch (error) {
        console.error("Error fetching events:", error);
        if (mounted) {
          setError("Failed to load events. Please try again later.");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchEvents();

    return () => {
      mounted = false;
    };
  }, [selectedCategory, user]);

  const isBooked = (eventId: string) => {
    return bookings.some((booking) => booking.event_id === eventId);
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category === selectedCategory ? "" : category);
  };

  if (loading) {
    return <div className="loading-container">Loading events...</div>;
  }

  if (error) {
    return <div className="error-container">{error}</div>;
  }

  return (
    <div className="home-container">
      <div className="home-header">
        <h1>Upcoming Events</h1>
        <div className="category-filter">
          <span>Filter by category:</span>
          <div className="category-buttons">
            {categories.map((category) => (
              <button
                key={category}
                className={`category-button ${
                  selectedCategory === category ? "active" : ""
                }`}
                onClick={() => handleCategoryChange(category)}
              >
                {category}
              </button>
            ))}
            {selectedCategory && (
              <button
                className="category-button clear"
                onClick={() => setSelectedCategory("")}
              >
                Clear Filter
              </button>
            )}
          </div>
        </div>
      </div>

      {events.length === 0 ? (
        <div className="no-events">
          <p>No events found. Please check back later.</p>
        </div>
      ) : (
        <div className="events-grid">
          {events.map((event) => (
            <div key={event.id} className="event-card">
              <div className="event-image">
                <img
                  src={event.image_url || "https://via.placeholder.com/300x200"}
                  alt={event.name}
                />
              </div>
              <div className="event-content">
                <h3 className="event-title">{event.name}</h3>
                <p className="event-date">
                  {new Date(event.date).toLocaleDateString()}
                </p>
                <div className="event-footer">
                  <span className="event-price">${event.price.toFixed(2)}</span>
                  {user ? (
                    isBooked(event.id) ? (
                      <span className="booked-label">Booked</span>
                    ) : (
                      <Link to={`/events/${event.id}`} className="book-button">
                        Book Now
                      </Link>
                    )
                  ) : (
                    <Link to="/login" className="book-button">
                      Sign in to Book
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Home;
