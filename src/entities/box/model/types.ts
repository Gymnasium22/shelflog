export type Box = {
  id: string;
  household_id: string;
  location_id: string | null;
  code: string;
  name: string | null;
  description: string | null;
  photo_path: string | null;
  qr_token: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
};
