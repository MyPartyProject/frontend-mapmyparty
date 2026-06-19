import SupportWorkspace from "@/components/support/SupportWorkspace";

const OrganizerSupport = () => {
  return (
    <SupportWorkspace
      mode="requester"
      title="Organizer Support"
      description="Create and track organizer-side support tickets for payouts, listings, bookings, and account issues."
      defaultSourceSurface="ORGANIZER_SUPPORT"
      requesterTypeLabel="ORGANIZER"
    />
  );
};

export default OrganizerSupport;
