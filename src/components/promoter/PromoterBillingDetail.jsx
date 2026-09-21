import { useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Building2,
  DollarSign,
  CreditCard,
  Shield,
  Calendar,
  FileText,
  Download,
  Mail,
  Phone,
  MapPin,
  CheckCircle,
  AlertTriangle,
  Clock,
  TrendingUp,
  TrendingDown,
  Banknote,
  User,
  Edit,
  MoreVertical,
  Eye,
} from "lucide-react";

const PromoterBillingDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");

  // Dummy data for specific organizer - inspired by Prisma schema
  const organizerData = useMemo(() => ({
    id: "org-abc",
    slug: "abc-events",
    name: "ABC Events",
    description: "Large-format festival promoter curating multi-genre events across Mumbai and Pune.",
    email: "accounts@abcevents.in",
    contact: "+91 98200 12345",
    address: "Unit 12B, Bandra Kurla Complex, Mumbai, Maharashtra 400051",
    website: "https://abcevents.in",
    status: "VERIFIED",
    kycStatus: "VERIFIED",
    gstNumber: "27ABCDE1234F1Z5",
    panNumber: "ABCDE1234F",
    
    // Financial Overview
    financialOverview: {
      totalRevenue: 8200000,
      platformFees: 656000,
      netPayout: 7544000,
      currentBalance: 82000,
      totalBookings: 4850,
      totalEvents: 12,
      avgTicketPrice: 1690,
      revenueGrowth: 22.1,
      completionRate: 98.2,
      refundRate: 1.2,
    },

    // Bank Details
    bankDetails: {
      bankName: "ICICI Bank",
      accountNumber: "2021",
      accountHolder: "ABC Events Pvt Ltd",
      ifsc: "ICIC0002021",
      branch: "Bandra Kurla Complex, Mumbai",
      verificationStatus: "VERIFIED",
      addedOn: "2023-04-12",
      lastUpdated: "2024-02-14",
    },

    // Owner and Managers
    people: {
      owner: {
        name: "Amit Kulkarni",
        email: "amit@abc.events",
        phone: "+91 98200 12345",
        role: "OWNER",
        kycStatus: "VERIFIED",
      },
      managers: [
        {
          name: "Neha Shah",
          email: "neha@abc.events",
          phone: "+91 98222 11000",
          role: "MANAGER",
          kycStatus: "VERIFIED",
        },
        {
          name: "Rahul Menon",
          email: "rahul@abc.events",
          phone: "+91 98111 33000",
          role: "MANAGER",
          kycStatus: "VERIFIED",
        },
      ],
    },

    // Recent Payouts
    recentPayouts: [
      {
        id: "payout-001",
        amount: 320000,
        status: "COMPLETED",
        method: "IMPS",
        date: "2024-02-18",
        processedAt: "2024-02-18 14:30",
        referenceId: "IMPS20240218001",
        utr: "123456789012",
        processingTime: "2.1 hours",
        eventsCovered: ["Summer Music Festival 2024"],
      },
      {
        id: "payout-002",
        amount: 285000,
        status: "COMPLETED",
        method: "NEFT",
        date: "2024-02-01",
        processedAt: "2024-02-01 11:45",
        referenceId: "NEFT20240201001",
        utr: "987654321098",
        processingTime: "4.3 hours",
        eventsCovered: ["Arena EDM Night", "Tech Conference"],
      },
      {
        id: "payout-003",
        amount: 412000,
        status: "COMPLETED",
        method: "IMPS",
        date: "2024-01-15",
        processedAt: "2024-01-15 16:20",
        referenceId: "IMPS20240115001",
        utr: "456789012345",
        processingTime: "1.8 hours",
        eventsCovered: ["New Year Festival"],
      },
    ],

    // Upcoming Payout
    upcomingPayout: {
      amount: 82000,
      eta: "2024-03-04",
      status: "PENDING",
      eventsCovered: ["Food & Wine Festival"],
      estimatedProcessingTime: "2-4 hours",
    },

    // Billing Metrics
    billingMetrics: [
      {
        metric: "Monthly Revenue",
        current: 683333,
        previous: 560000,
        change: 22.1,
        status: "positive",
        icon: DollarSign,
      },
      {
        metric: "Platform Fee Rate",
        current: 8.0,
        previous: 8.0,
        change: 0.0,
        status: "neutral",
        icon: CreditCard,
      },
      {
        metric: "Payout Processing Time",
        current: 2.7,
        previous: 4.2,
        change: -35.7,
        status: "positive",
        icon: Clock,
      },
      {
        metric: "Transaction Success Rate",
        current: 98.5,
        previous: 96.2,
        change: 2.4,
        status: "positive",
        icon: TrendingUp,
      },
    ],

    // Documents
    documents: [
      {
        name: "GST Certificate",
        type: "GST_CERT",
        uploadedOn: "2023-04-12",
        status: "VERIFIED",
        url: "#",
      },
      {
        name: "PAN Card",
        type: "PAN_CARD",
        uploadedOn: "2023-04-12",
        status: "VERIFIED",
        url: "#",
      },
      {
        name: "Bank Statement",
        type: "BANK_STATEMENT",
        uploadedOn: "2024-01-15",
        status: "VERIFIED",
        url: "#",
      },
      {
        name: "Business Registration",
        type: "BUSINESS_REG",
        uploadedOn: "2023-04-12",
        status: "VERIFIED",
        url: "#",
      },
    ],

    // Events for current billing cycle
    currentCycleEvents: [
      {
        id: "evt-001",
        title: "Summer Music Festival 2024",
        date: "2024-02-14",
        revenue: 1250000,
        bookings: 4850,
        status: "COMPLETED",
      },
      {
        id: "evt-002",
        title: "Food & Wine Festival",
        date: "2024-02-28",
        revenue: 820000,
        bookings: 2875,
        status: "LIVE",
      },
    ],
  }), [slug]);

  const currency = (v) => `₹${Number(v || 0).toLocaleString("en-IN")}`;
  const percentage = (v) => `${Number(v || 0).toFixed(1)}%`;

  const statusBadge = (status) => {
    const map = {
      VERIFIED: "success",
      "ON-HOLD": "destructive",
      PENDING: "default",
      PROCESSING: "success",
      COMPLETED: "success",
      FAILED: "destructive",
      positive: "success",
      negative: "destructive",
      neutral: "outline",
    };
    return map[status] || "outline";
  };

  if (!organizerData) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Organization Not Found</h2>
          <Button onClick={() => navigate("/promoter/billing")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Billing
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => navigate("/promoter/billing")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Billing
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{organizerData.name}</h1>
            <p className="text-muted-foreground">{organizerData.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={statusBadge(organizerData.status)}>
            {organizerData.status}
          </Badge>
          <Badge variant={statusBadge(organizerData.kycStatus)}>
            KYC: {organizerData.kycStatus}
          </Badge>
          <Button variant="outline">
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Button>
          <Button>
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-border">
        <nav className="flex space-x-8">
          {["overview", "financials", "payouts", "documents", "settings"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-2 px-1 border-b-2 font-medium text-sm capitalize ${
                activeTab === tab
                  ? "border-primary text-accent-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-border/60 bg-card/70">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Current Balance</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{currency(organizerData.financialOverview.currentBalance)}</div>
                <p className="text-xs text-muted-foreground">
                  Next payout: {organizerData.upcomingPayout.eta}
                </p>
              </CardContent>
            </Card>

            <Card className="border-border/60 bg-card/70">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{currency(organizerData.financialOverview.totalRevenue)}</div>
                <p className="text-xs text-muted-foreground">
                  +{percentage(organizerData.financialOverview.revenueGrowth)} growth
                </p>
              </CardContent>
            </Card>

            <Card className="border-border/60 bg-card/70">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{percentage(organizerData.financialOverview.completionRate)}</div>
                <p className="text-xs text-muted-foreground">
                  {organizerData.financialOverview.totalEvents} events
                </p>
              </CardContent>
            </Card>

            <Card className="border-border/60 bg-card/70">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Refund Rate</CardTitle>
                <TrendingDown className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{percentage(organizerData.financialOverview.refundRate)}</div>
                <p className="text-xs text-muted-foreground">
                  {organizerData.financialOverview.totalBookings} bookings
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Contact Information */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-border/60 bg-card/70">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5" />
                  Organization Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Email</p>
                    <p className="text-sm">{organizerData.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Phone</p>
                    <p className="text-sm">{organizerData.contact}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Address</p>
                    <p className="text-sm">{organizerData.address}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">GST Number</p>
                    <p className="text-sm">{organizerData.gstNumber}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/60 bg-card/70">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Banknote className="w-5 h-5" />
                  Bank Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Bank</p>
                    <p className="text-sm">{organizerData.bankDetails.bankName}</p>
                  </div>
                  <Badge variant={statusBadge(organizerData.bankDetails.verificationStatus)}>
                    {organizerData.bankDetails.verificationStatus}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium">Account Holder</p>
                  <p className="text-sm">{organizerData.bankDetails.accountHolder}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Account Number</p>
                  <p className="text-sm">•••• {organizerData.bankDetails.accountNumber}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">IFSC Code</p>
                  <p className="text-sm">{organizerData.bankDetails.ifsc}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Branch</p>
                  <p className="text-sm">{organizerData.bankDetails.branch}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* People */}
          <Card className="border-border/60 bg-card/70">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Team Members
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 rounded-lg border border-border/40">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold">{organizerData.people.owner.name}</h4>
                      <p className="text-sm text-muted-foreground">{organizerData.people.owner.email}</p>
                      <p className="text-sm text-muted-foreground">{organizerData.people.owner.phone}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant="default">{organizerData.people.owner.role}</Badge>
                      <div className="mt-1">
                        <Badge variant={statusBadge(organizerData.people.owner.kycStatus)}>
                          KYC: {organizerData.people.owner.kycStatus}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
                {organizerData.people.managers.map((manager, index) => (
                  <div key={index} className="p-4 rounded-lg border border-border/40">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold">{manager.name}</h4>
                        <p className="text-sm text-muted-foreground">{manager.email}</p>
                        <p className="text-sm text-muted-foreground">{manager.phone}</p>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline">{manager.role}</Badge>
                        <div className="mt-1">
                          <Badge variant={statusBadge(manager.kycStatus)}>
                            KYC: {manager.kycStatus}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Financials Tab */}
      {activeTab === "financials" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {organizerData.billingMetrics.map((metric, index) => (
              <Card key={index} className="border-border/60 bg-card/70">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{metric.metric}</CardTitle>
                  <metric.icon className="w-5 h-5 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {metric.metric.includes("Rate") || metric.metric.includes("Time")
                      ? metric.metric.includes("Time")
                        ? `${metric.current}h`
                        : percentage(metric.current)
                      : currency(metric.current)
                    }
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {metric.change > 0 ? "+" : ""}{percentage(metric.change)} from last month
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="border-border/60 bg-card/70">
            <CardHeader>
              <CardTitle>Current Cycle Events</CardTitle>
              <CardDescription>Events contributing to the next payout</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {organizerData.currentCycleEvents.map((event, index) => (
                  <div key={index} className="flex items-center justify-between p-4 rounded-lg border border-border/40">
                    <div>
                      <h4 className="font-semibold">{event.title}</h4>
                      <p className="text-sm text-muted-foreground">{event.date}</p>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{currency(event.revenue)}</div>
                      <div className="text-sm text-muted-foreground">{event.bookings} bookings</div>
                      <Badge variant={statusBadge(event.status)}>{event.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Payouts Tab */}
      {activeTab === "payouts" && (
        <div className="space-y-6">
          {/* Upcoming Payout */}
          <Card className="border-border/60 bg-card/70">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Upcoming Payout
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold">{currency(organizerData.upcomingPayout.amount)}</div>
                  <p className="text-sm text-muted-foreground">
                    ETA: {organizerData.upcomingPayout.eta} • {organizerData.upcomingPayout.eventsCovered.join(", ")}
                  </p>
                </div>
                <Badge variant={statusBadge(organizerData.upcomingPayout.status)}>
                  {organizerData.upcomingPayout.status}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Recent Payouts */}
          <Card className="border-border/60 bg-card/70">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Recent Payouts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {organizerData.recentPayouts.map((payout, index) => (
                  <div key={index} className="p-4 rounded-lg border border-border/40">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-semibold">{currency(payout.amount)}</h4>
                        <p className="text-sm text-muted-foreground">{payout.date}</p>
                        <p className="text-sm text-muted-foreground">
                          Events: {payout.eventsCovered.join(", ")}
                        </p>
                      </div>
                      <Badge variant={statusBadge(payout.status)}>
                        {payout.status}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Method</span>
                        <div className="font-medium">{payout.method}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Reference</span>
                        <div className="font-medium">{payout.referenceId}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">UTR</span>
                        <div className="font-medium">{payout.utr}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Processing Time</span>
                        <div className="font-medium">{payout.processingTime}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Documents Tab */}
      {activeTab === "documents" && (
        <div className="space-y-6">
          <Card className="border-border/60 bg-card/70">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Verification Documents
              </CardTitle>
              <CardDescription>Uploaded documents for KYC and compliance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {organizerData.documents.map((doc, index) => (
                  <div key={index} className="flex items-center justify-between p-4 rounded-lg border border-border/40">
                    <div className="flex items-center gap-4">
                      <FileText className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <h4 className="font-semibold">{doc.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          Uploaded on {doc.uploadedOn}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={statusBadge(doc.status)}>
                        {doc.status}
                      </Badge>
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === "settings" && (
        <div className="space-y-6">
          <Card className="border-border/60 bg-card/70">
            <CardHeader>
              <CardTitle>Billing Settings</CardTitle>
              <CardDescription>Configure billing and payout preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg border border-border/40">
                <div>
                  <h4 className="font-semibold">Auto-Payout</h4>
                  <p className="text-sm text-muted-foreground">
                    Automatically process payouts when balance reaches threshold
                  </p>
                </div>
                <Button variant="outline">Configure</Button>
              </div>
              <div className="flex items-center justify-between p-4 rounded-lg border border-border/40">
                <div>
                  <h4 className="font-semibold">Payout Method</h4>
                  <p className="text-sm text-muted-foreground">
                    Default method: IMPS (can be changed per payout)
                  </p>
                </div>
                <Button variant="outline">Change</Button>
              </div>
              <div className="flex items-center justify-between p-4 rounded-lg border border-border/40">
                <div>
                  <h4 className="font-semibold">Billing Schedule</h4>
                  <p className="text-sm text-muted-foreground">
                    Weekly payouts every Monday
                  </p>
                </div>
                <Button variant="outline">Edit Schedule</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default PromoterBillingDetail;
