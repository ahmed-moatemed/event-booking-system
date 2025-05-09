export interface Event {
  id: string;
  name: string;
  description: string;
  category: string;
  date: string;
  venue: string;
  price: number;
  image_url: string;
  created_at?: string;
}

export interface Booking {
  id: string;
  user_id: string;
  event_id: string;
  created_at: string;
  event?: Event;
} 