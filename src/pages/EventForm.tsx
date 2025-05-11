import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase/supabaseClient";
import { useAuth } from "../context/AuthContext";
import type { Event } from "../types/event";
import "../styles/eventForm.css";

const EventForm = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditMode = id !== "new";
  const { isAdmin, isLoading: authLoading } = useAuth();

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
  const [saving, setSaving] = useState(false);
  const [imagePreview, setImagePreview] = useState("");

  useEffect(() => {
    if (isEditMode && !authLoading) {
      fetchEvent();
    }
  }, [id, authLoading]);

  // Check if user is admin, else redirect
  useEffect(() => {
    if (!authLoading && !isAdmin) {
      navigate("/");
    }
  }, [authLoading, isAdmin, navigate]);

  const fetchEvent = async () => {
    if (!id) return;

    setLoading(true);
    setError("");

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
          image_url: data.image_url || "",
        });
        setImagePreview(data.image_url || "");
      }
    } catch (error) {
      console.error("Error fetching event:", error);
      setError("Failed to load event details. Please try again.");
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
      [name]: name === "price" ? parseFloat(value) || 0 : value,
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
    if (!selectedFile) return formData.image_url || "";

    setIsUploading(true);
    try {
      const fileExt = selectedFile.name.split(".").pop();
      const fileName = `${Date.now()}.${fileExt}`;
      // Simplify the path - don't use subfolders
      const filePath = fileName;

      // Check if file size is acceptable (less than 2MB)
      if (selectedFile.size > 2 * 1024 * 1024) {
        throw new Error(
          "Image file is too large. Please use an image smaller than 2MB."
        );
      }

      // Use the default bucket
      const bucketName = "event-images";

      try {
        // Try to upload to the bucket with more detailed error handling
        const { error: uploadError } = await supabase.storage
          .from(bucketName)
          .upload(filePath, selectedFile, {
            cacheControl: "3600",
            upsert: true,
          });

        if (uploadError) {
          console.error("Upload error details:", uploadError);

          if (
            uploadError.message.includes("bucket") ||
            uploadError.message.includes("not found")
          ) {
            throw new Error(
              `Storage bucket '${bucketName}' not found. Please create it in your Supabase dashboard.`
            );
          }

          if (
            uploadError.message.includes("permission") ||
            uploadError.message.includes("not authorized")
          ) {
            throw new Error(
              `Permission denied. Check your storage bucket policies to ensure uploads are allowed.`
            );
          }

          if (
            uploadError.message.includes("413") ||
            uploadError.message.includes("too large")
          ) {
            throw new Error(
              `File too large. Please use a smaller image (under 2MB).`
            );
          }

          throw new Error(`Upload failed: ${uploadError.message}`);
        }

        // Get the public URL for the uploaded image
        const { data: urlData } = supabase.storage
          .from(bucketName)
          .getPublicUrl(filePath);
        return urlData.publicUrl;
      } catch (error) {
        console.error("Upload error:", error);
        if (error instanceof Error) {
          if (
            error.message.includes("bucket") ||
            error.message.includes("not found")
          ) {
            throw new Error(
              `Storage bucket '${bucketName}' doesn't exist. Please go to your Supabase dashboard, navigate to Storage, and create a bucket named '${bucketName}' with public access enabled.`
            );
          }
          throw error;
        }
        throw new Error("Failed to upload image. Please try again.");
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      if (error instanceof Error) {
        throw new Error(error.message);
      } else {
        throw new Error("Failed to upload image. Please try again.");
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);

    try {
      // Validate form data
      if (
        !formData.name ||
        !formData.date ||
        !formData.venue ||
        formData.price < 0
      ) {
        setError("Please fill in all required fields");
        setSaving(false);
        return;
      }

      let imageUrl = formData.image_url || "";

      // Upload image if a new file is selected
      if (selectedFile) {
        try {
          imageUrl = await uploadImage();
        } catch (error) {
          if (error instanceof Error) {
            setError(error.message);
          } else {
            setError("Image upload failed. Please try again.");
          }
          setSaving(false);
          return;
        }
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
      setError("Failed to save event. Please check your input and try again.");
    } finally {
      setSaving(false);
    }
  };

  if (authLoading) {
    return <div className="loading-container">Checking permissions...</div>;
  }

  if (!isAdmin) {
    return null; // Will redirect in useEffect
  }

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
            disabled={saving}
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
            disabled={saving}
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
              disabled={saving}
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
              disabled={saving}
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
              disabled={saving}
            />
          </div>

          <div className="form-group">
            <label htmlFor="price">Price ($) *</label>
            <input
              type="number"
              id="price"
              name="price"
              value={formData.price}
              onChange={handleChange}
              step="0.01"
              min="0"
              required
              disabled={saving}
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
            disabled={saving || isUploading}
          />
          {imagePreview && (
            <div className="image-preview">
              <img src={imagePreview} alt="Event preview" />
            </div>
          )}
        </div>

        <div className="form-actions">
          <button
            type="button"
            onClick={() => navigate("/admin")}
            className="cancel-button"
            disabled={saving || isUploading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="save-button"
            disabled={saving || isUploading}
          >
            {saving || isUploading ? "Saving..." : "Save Event"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EventForm;
