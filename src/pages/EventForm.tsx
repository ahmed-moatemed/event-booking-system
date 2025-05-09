import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase/supabaseClient";
import type { Event } from "../types/event";
import "../styles/eventForm.css";

const EventForm = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditMode = id !== "new";

  const [formData, setFormData] = useState<Omit<Event, "id" | "created_at">>({
    name: "",
    description: "",
    category: "",
    date: "",
    venue: "",
    price: 0,
    image_url: "",
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState("");

  useEffect(() => {
    if (isEditMode) {
      fetchEvent();
    }
  }, [id]);

  const fetchEvent = async () => {
    if (!id) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      if (data) {
        setFormData({
          name: data.name,
          description: data.description,
          category: data.category,
          // Format the date to match the input format
          date: new Date(data.date).toISOString().split("T")[0],
          venue: data.venue,
          price: data.price,
          image_url: data.image_url,
        });
        setImagePreview(data.image_url);
      }
    } catch (error) {
      console.error("Error fetching event:", error);
      setError("Failed to load event details");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "price" ? parseFloat(value) : value,
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setSelectedFile(file);

      // Create a preview of the selected image
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (): Promise<string> => {
    if (!selectedFile) return formData.image_url;

    setIsUploading(true);
    try {
      const fileExt = selectedFile.name.split(".").pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `events/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("event-images")
        .upload(filePath, selectedFile);

      if (uploadError) throw uploadError;

      // Get the public URL for the uploaded image
      const { data } = supabase.storage
        .from("event-images")
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      console.error("Error uploading image:", error);
      throw new Error("Failed to upload image");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      // Validate form data
      if (
        !formData.name ||
        !formData.date ||
        !formData.venue ||
        formData.price < 0
      ) {
        setError("Please fill in all required fields");
        return;
      }

      let imageUrl = formData.image_url;

      // Upload image if a new file is selected
      if (selectedFile) {
        imageUrl = await uploadImage();
      }

      // Prepare the data to save
      const eventData = {
        ...formData,
        image_url: imageUrl,
      };

      if (isEditMode) {
        // Update existing event
        const { error } = await supabase
          .from("events")
          .update(eventData)
          .eq("id", id);

        if (error) throw error;
      } else {
        // Create new event
        const { error } = await supabase.from("events").insert([eventData]);

        if (error) throw error;
      }

      // Redirect to admin dashboard
      navigate("/admin");
    } catch (error) {
      console.error("Error saving event:", error);
      setError("Failed to save event");
    }
  };

  if (loading) {
    return <div className="loading-container">Loading event details...</div>;
  }

  return (
    <div className="event-form-container">
      <div className="form-header">
        <h1>{isEditMode ? "Edit Event" : "Create New Event"}</h1>
      </div>

      {error && <div className="form-error">{error}</div>}

      <form onSubmit={handleSubmit} className="event-form">
        <div className="form-group">
          <label htmlFor="name">Event Name *</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="description">Description *</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={5}
            required
          ></textarea>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="category">Category *</label>
            <input
              type="text"
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="date">Date *</label>
            <input
              type="date"
              id="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="venue">Venue *</label>
            <input
              type="text"
              id="venue"
              name="venue"
              value={formData.venue}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="price">Price ($) *</label>
            <input
              type="number"
              id="price"
              name="price"
              min="0"
              step="0.01"
              value={formData.price}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="image">Event Image</label>
          <input
            type="file"
            id="image"
            accept="image/*"
            onChange={handleFileChange}
          />

          {imagePreview && (
            <div className="image-preview">
              <img src={imagePreview} alt="Preview" />
            </div>
          )}
        </div>

        <div className="form-actions">
          <button
            type="button"
            onClick={() => navigate("/admin")}
            className="cancel-button"
          >
            Cancel
          </button>
          <button type="submit" className="save-button" disabled={isUploading}>
            {isUploading
              ? "Uploading..."
              : isEditMode
              ? "Update Event"
              : "Create Event"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EventForm;
