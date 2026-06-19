import SupportWorkspace from "@/components/support/SupportWorkspace";

const DashboardSupport = () => {
  return (
    <SupportWorkspace
      mode="requester"
      title="Support"
      description="Raise attendee issues, follow replies, and keep your booking or account conversations in one place."
      defaultSourceSurface="ATTENDEE_SUPPORT"
      requesterTypeLabel="USER"
    />
  );
};

export default DashboardSupport;
