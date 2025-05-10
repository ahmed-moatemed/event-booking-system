import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase/supabaseClient";
import { useAuth } from "../context/AuthContext";
import type { Event } from "../types/event";
import "../styles/adminDashboard.css";

const AdminDashboard = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteInProgress, setDeleteInProgress] = useState<string | null>(null);
  const { isAdmin, isLoading: authLoading, user } = useAuth();
  const navigate = useNavigate();

  // Check auth status on component mount
  useEffect(() => {
    if (!authLoading && !isAdmin && !user) {
      navigate("/login");
    } else if (!authLoading && !isAdmin && user) {
      navigate("/");
    }
  }, [authLoading, isAdmin, navigate, user]);

  useEffect(() => {
    let mounted = true;

    const fetchEvents = async () => {
      if (authLoading || !isAdmin) return;

      setLoading(true);
      setError(null);

      try {
        const { data, error } = await supabase
          .from("events")
          .select("*")
          .order("date", { ascending: true });

        if (error) throw error;

        if (mounted) {
          setEvents(data || []);
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
  }, [authLoading, isAdmin]);

  const deleteEvent = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this event?")) {
      return;
    }

    try {
      setError(null);
      setDeleteInProgress(id);

      // First delete all bookings for this event
      const { error: bookingsError } = await supabase
        .from("bookings")
        .delete()
        .eq("event_id", id);

      if (bookingsError) throw bookingsError;

      // Then delete the event
      const { error } = await supabase.from("events").delete().eq("id", id);

      if (error) throw error;

      // Update UI
      setEvents(events.filter((event) => event.id !== id));
    } catch (error) {
      console.error("Error deleting event:", error);
      setError("Failed to delete event. Please try again.");
    } finally {
      setDeleteInProgress(null);
    }
  };

  // Render loading state
  if (authLoading) {
    return <div className="loading-container">Checking permissions...</div>;
  }

  // If not admin and auth is complete, component will redirect

  // Render loading state for events
  if (loading) {
    return <div className="loading-container">Loading events...</div>;
  }

  return (
    <div className="admin-dashboard-container">
      <div className="admin-header">
        <h1>Admin Dashboard</h1>
        <Link to="/admin/events/new" className="create-event-button">
          Create New Event
        </Link>
      </div>

      {error && <div className="admin-error">{error}</div>}

      <div className="admin-content">
        <h2>Manage Events</h2>

        {events.length === 0 ? (
          <div className="no-events">
            <p>No events found. Create your first event!</p>
          </div>
        ) : (
          <div className="events-table-wrapper">
            <table className="events-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Date</th>
                  <th>Venue</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {events.map((event) => (
                  <tr key={event.id}>
                    <td>{event.name}</td>
                    <td>{new Date(event.date).toLocaleDateString()}</td>
                    <td>{event.venue}</td>
                    <td>{event.category}</td>
                    <td>${event.price.toFixed(2)}</td>
                    <td className="action-buttons">
                      <Link
                        to={`/admin/events/${event.id}`}
                        className="edit-button"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => deleteEvent(event.id)}
                        className="delete-button"
                        type="button"
                        disabled={deleteInProgress === event.id}
                      >
                        {deleteInProgress === event.id
                          ? "Deleting..."
                          : "Delete"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
