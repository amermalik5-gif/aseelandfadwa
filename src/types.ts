export type RsvpDto = {
  attending: boolean;
  guestNames: string[];
  mobile: string | null;
  updatedAt: string;
};

export type InvitationDto = {
  id: string;
  code: string;
  name: string;
  maxGuests: number;
  phone: string | null;
  sentAt: string | null;
  viewedAt: string | null;
  notes: string | null;
  tableNo: string | null;
  createdAt: string;
  rsvp: RsvpDto | null;
};
