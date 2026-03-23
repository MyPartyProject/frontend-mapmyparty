import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AnalyticsProgressBar from "@/components/analytics/AnalyticsProgressBar";
import { 
  Calendar, 
  Users, 
  DollarSign, 
  TrendingUp, 
  Activity,
  BarChart3,
  PieChart as PieChartIcon,
  LineChart as LineChartIcon,
  Eye,
  Clock
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

// Different color theme - Teal/Emerald/Indigo palette
const ANALYTICS_COLORS = {
  primary: "#14b8a6",      // Teal
  secondary: "#10b981",    // Emerald
  accent: "#6366f1",       // Indigo
  warning: "#f59e0b",      // Amber
  info: "#06b6d4",         // Cyan
  success: "#22c55e",      // Green
  purple: "#a855f7",       // Purple
};

const CHART_COLORS = [
  ANALYTICS_COLORS.primary,
  ANALYTICS_COLORS.secondary,
  ANALYTICS_COLORS.accent,
  ANALYTICS_COLORS.warning,
  ANALYTICS_COLORS.info,
  ANALYTICS_COLORS.success,
  ANALYTICS_COLORS.purple,
];

const EventDetailModal = ({ isOpen, onClose, event }) => {
  const enrolledPercentage =
    event.totalTickets > 0
      ? Math.round((event.ticketsSold / event.totalTickets) * 100)
      : 0;

  // Generate analytics data based on event
  const dailySalesData = [
    { day: "Day 1", sales: event.revenue * 0.15, tickets: Math.floor(event.ticketsSold * 0.12) },
    { day: "Day 2", sales: event.revenue * 0.18, tickets: Math.floor(event.ticketsSold * 0.15) },
    { day: "Day 3", sales: event.revenue * 0.22, tickets: Math.floor(event.ticketsSold * 0.20) },
    { day: "Day 4", sales: event.revenue * 0.20, tickets: Math.floor(event.ticketsSold * 0.18) },
    { day: "Day 5", sales: event.revenue * 0.25, tickets: Math.floor(event.ticketsSold * 0.35) },
  ];

  const ticketCategoryData = [
    { name: "VIP", value: 20, count: Math.floor(event.ticketsSold * 0.2), revenue: event.revenue * 0.35 },
    { name: "Premium", value: 40, count: Math.floor(event.ticketsSold * 0.4), revenue: event.revenue * 0.45 },
    { name: "Standard", value: 40, count: Math.floor(event.ticketsSold * 0.4), revenue: event.revenue * 0.20 },
  ];

  const salesBySource = [
    { source: "Website", sales: event.revenue * 0.45, tickets: Math.floor(event.ticketsSold * 0.45) },
    { source: "Social Media", sales: event.revenue * 0.30, tickets: Math.floor(event.ticketsSold * 0.30) },
    { source: "Email", sales: event.revenue * 0.15, tickets: Math.floor(event.ticketsSold * 0.15) },
    { source: "Direct", sales: event.revenue * 0.10, tickets: Math.floor(event.ticketsSold * 0.10) },
  ];

  const weeklyTrend = [
    { week: "Week 1", tickets: Math.floor(event.ticketsSold * 0.20), revenue: event.revenue * 0.18 },
    { week: "Week 2", tickets: Math.floor(event.ticketsSold * 0.25), revenue: event.revenue * 0.22 },
    { week: "Week 3", tickets: Math.floor(event.ticketsSold * 0.30), revenue: event.revenue * 0.28 },
    { week: "Week 4", tickets: Math.floor(event.ticketsSold * 0.25), revenue: event.revenue * 0.32 },
  ];

  const ticketDistribution = [
    { name: "Sold", value: enrolledPercentage, count: event.ticketsSold },
    { name: "Available", value: 100 - enrolledPercentage, count: event.totalTickets - event.ticketsSold },
  ];

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border rounded-lg shadow-xl p-3 animate-in fade-in-0 zoom-in-95">
          <p className="font-semibold mb-2 text-foreground">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Custom label for pie chart
  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? "start" : "end"}
        dominantBaseline="central"
        className="text-sm font-semibold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  const stats = [
    {
      title: "Total Revenue",
      value: `₹${event.revenue.toLocaleString()}`,
      change: "+24% from target",
      icon: DollarSign,
      color: ANALYTICS_COLORS.primary,
      bgColor: "bg-teal-100 dark:bg-teal-900/20",
    },
    {
      title: "Tickets Sold",
      value: event.ticketsSold.toLocaleString(),
      change: `${enrolledPercentage}% of capacity`,
      icon: Users,
      color: ANALYTICS_COLORS.secondary,
      bgColor: "bg-emerald-100 dark:bg-emerald-900/20",
    },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto animate-in fade-in-0 zoom-in-95 duration-300">
        <DialogHeader className="animate-in slide-in-from-top-4 duration-500">
          <div>
            <DialogTitle className="text-3xl font-bold bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">
              Event Analytics
            </DialogTitle>
            <DialogDescription className="text-base mt-2">
              Comprehensive insights for {event.title}
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {stats.map((stat, index) => (
              <Card
                key={stat.title}
                className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-2 hover:border-teal-200 dark:hover:border-teal-800 animate-in fade-in-0 slide-in-from-bottom-4"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-xs font-medium text-muted-foreground mb-1">
                        {stat.title}
                      </p>
                      <p className="text-2xl font-bold mb-1" style={{ color: stat.color }}>
                        {stat.value}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {stat.change}
                      </p>
                    </div>
                    <div className={`p-3 rounded-xl ${stat.bgColor} transition-transform duration-300 hover:scale-110`}>
                      <stat.icon className="w-5 h-5" style={{ color: stat.color }} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Tabs for different analytics views */}
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4 animate-in fade-in-0 slide-in-from-bottom-2 duration-500">
              <TabsTrigger value="overview" className="transition-all duration-200 hover:scale-105">
                Overview
              </TabsTrigger>
              <TabsTrigger value="sales" className="transition-all duration-200 hover:scale-105">
                Sales
              </TabsTrigger>
              <TabsTrigger value="tickets" className="transition-all duration-200 hover:scale-105">
                Tickets
              </TabsTrigger>
              <TabsTrigger value="performance" className="transition-all duration-200 hover:scale-105">
                Performance
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6 mt-6 animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Daily Sales Trend */}
                <Card className="hover:shadow-lg transition-all duration-300">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <LineChartIcon className="w-5 h-5 text-teal-600" />
                      Daily Sales Trend
                    </CardTitle>
                    <CardDescription>Revenue and ticket sales progression over time</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={dailySalesData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={ANALYTICS_COLORS.primary} stopOpacity={0.3} />
                            <stop offset="95%" stopColor={ANALYTICS_COLORS.primary} stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="colorTickets" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={ANALYTICS_COLORS.secondary} stopOpacity={0.3} />
                            <stop offset="95%" stopColor={ANALYTICS_COLORS.secondary} stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                        <XAxis 
                          dataKey="day" 
                          stroke="hsl(var(--muted-foreground))"
                          style={{ fontSize: '12px' }}
                        />
                        <YAxis 
                          stroke="hsl(var(--muted-foreground))"
                          style={{ fontSize: '12px' }}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                        <Area
                          type="monotone"
                          dataKey="sales"
                          stroke={ANALYTICS_COLORS.primary}
                          fillOpacity={1}
                          fill="url(#colorSales)"
                          name="Revenue (₹)"
                          strokeWidth={2}
                          animationDuration={800}
                        />
                        <Area
                          type="monotone"
                          dataKey="tickets"
                          stroke={ANALYTICS_COLORS.secondary}
                          fillOpacity={1}
                          fill="url(#colorTickets)"
                          name="Tickets Sold"
                          strokeWidth={2}
                          animationDuration={800}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Ticket Distribution */}
                <Card className="hover:shadow-lg transition-all duration-300">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <PieChartIcon className="w-5 h-5 text-emerald-600" />
                      Ticket Distribution
                    </CardTitle>
                    <CardDescription>Sold vs available tickets breakdown</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={ticketDistribution}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={renderCustomLabel}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                          animationBegin={0}
                          animationDuration={800}
                        >
                          {ticketDistribution.map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={index === 0 ? ANALYTICS_COLORS.success : ANALYTICS_COLORS.warning} 
                            />
                          ))}
                        </Pie>
                        <Tooltip 
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload;
                              return (
                                <div className="bg-background border border-border rounded-lg shadow-lg p-3">
                                  <p className="font-semibold mb-2">{data.name}</p>
                                  <p className="text-sm">Tickets: {data.count.toLocaleString()}</p>
                                  <p className="text-sm">Percentage: {data.value}%</p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              {/* Capacity Progress */}
              <Card className="hover:shadow-lg transition-all duration-300">
                <CardHeader>
                  <CardTitle>Capacity Progress</CardTitle>
                  <CardDescription>Event enrollment status</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Enrollment Progress</span>
                      <span className="text-sm font-bold text-teal-600">{enrolledPercentage}%</span>
                    </div>
                    <AnalyticsProgressBar
                      value={enrolledPercentage}
                      heightClassName="h-4"
                      trackClassName="bg-muted"
                      fillStyle={{ background: "linear-gradient(90deg, #14b8a6 0%, #10b981 100%)" }}
                    />
                    <div className="grid grid-cols-3 gap-4 pt-2">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-teal-600">{event.ticketsSold}</p>
                        <p className="text-xs text-muted-foreground">Sold</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-amber-600">{event.totalTickets - event.ticketsSold}</p>
                        <p className="text-xs text-muted-foreground">Available</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-indigo-600">{event.totalTickets}</p>
                        <p className="text-xs text-muted-foreground">Total</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Sales Tab */}
            <TabsContent value="sales" className="space-y-6 mt-6 animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Sales by Source */}
                <Card className="hover:shadow-lg transition-all duration-300">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-indigo-600" />
                      Sales by Source
                    </CardTitle>
                    <CardDescription>Revenue breakdown by marketing channel</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={salesBySource} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                        <XAxis 
                          dataKey="source" 
                          stroke="hsl(var(--muted-foreground))"
                          style={{ fontSize: '12px' }}
                        />
                        <YAxis 
                          stroke="hsl(var(--muted-foreground))"
                          style={{ fontSize: '12px' }}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                        <Bar 
                          dataKey="sales" 
                          fill={ANALYTICS_COLORS.primary}
                          name="Revenue (₹)"
                          radius={[8, 8, 0, 0]}
                          animationDuration={800}
                        />
                        <Bar 
                          dataKey="tickets" 
                          fill={ANALYTICS_COLORS.secondary}
                          name="Tickets"
                          radius={[8, 8, 0, 0]}
                          animationDuration={800}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Weekly Trend */}
                <Card className="hover:shadow-lg transition-all duration-300">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-emerald-600" />
                      Weekly Sales Trend
                    </CardTitle>
                    <CardDescription>Performance over the past weeks</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={weeklyTrend} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                        <XAxis 
                          dataKey="week" 
                          stroke="hsl(var(--muted-foreground))"
                          style={{ fontSize: '12px' }}
                        />
                        <YAxis 
                          stroke="hsl(var(--muted-foreground))"
                          style={{ fontSize: '12px' }}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="revenue"
                          stroke={ANALYTICS_COLORS.primary}
                          strokeWidth={3}
                          name="Revenue (₹)"
                          dot={{ fill: ANALYTICS_COLORS.primary, r: 5 }}
                          animationDuration={800}
                        />
                        <Line
                          type="monotone"
                          dataKey="tickets"
                          stroke={ANALYTICS_COLORS.accent}
                          strokeWidth={3}
                          name="Tickets Sold"
                          dot={{ fill: ANALYTICS_COLORS.accent, r: 5 }}
                          animationDuration={800}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Tickets Tab */}
            <TabsContent value="tickets" className="space-y-6 mt-6 animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Ticket Category Distribution */}
                <Card className="hover:shadow-lg transition-all duration-300">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <PieChartIcon className="w-5 h-5 text-teal-600" />
                      Ticket Category Distribution
                    </CardTitle>
                    <CardDescription>Breakdown by ticket type</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={ticketCategoryData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={renderCustomLabel}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                          animationBegin={0}
                          animationDuration={800}
                        >
                          {ticketCategoryData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload;
                              return (
                                <div className="bg-background border border-border rounded-lg shadow-lg p-3">
                                  <p className="font-semibold mb-2">{data.name}</p>
                                  <p className="text-sm text-emerald-600">Tickets: {data.count.toLocaleString()}</p>
                                  <p className="text-sm text-teal-600">Revenue: ₹{data.revenue.toLocaleString()}</p>
                                  <p className="text-sm text-indigo-600">Share: {data.value}%</p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Ticket Sales by Category */}
                <Card className="hover:shadow-lg transition-all duration-300">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-emerald-600" />
                      Ticket Sales by Category
                    </CardTitle>
                    <CardDescription>Revenue and count by ticket type</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={ticketCategoryData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                        <XAxis 
                          dataKey="name" 
                          stroke="hsl(var(--muted-foreground))"
                          style={{ fontSize: '12px' }}
                        />
                        <YAxis 
                          stroke="hsl(var(--muted-foreground))"
                          style={{ fontSize: '12px' }}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                        <Bar 
                          dataKey="count" 
                          fill={ANALYTICS_COLORS.secondary}
                          name="Tickets Sold"
                          radius={[8, 8, 0, 0]}
                          animationDuration={800}
                        />
                        <Bar 
                          dataKey="revenue" 
                          fill={ANALYTICS_COLORS.primary}
                          name="Revenue (₹)"
                          radius={[8, 8, 0, 0]}
                          animationDuration={800}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Performance Tab */}
            <TabsContent value="performance" className="space-y-6 mt-6 animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Performance Metrics */}
                <Card className="hover:shadow-lg transition-all duration-300">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="w-5 h-5 text-indigo-600" />
                      Performance Metrics
                    </CardTitle>
                    <CardDescription>Key performance indicators</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 rounded-lg bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-200 dark:border-indigo-800">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/20">
                            <Eye className="w-4 h-4 text-indigo-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">Page Views</p>
                            <p className="text-xs text-muted-foreground">Total views</p>
                          </div>
                        </div>
                        <p className="text-xl font-bold text-indigo-600">
                          {(event.ticketsSold * 15).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-lg bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/20">
                            <Clock className="w-4 h-4 text-amber-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">Time to Purchase</p>
                            <p className="text-xs text-muted-foreground">Average time</p>
                          </div>
                        </div>
                        <p className="text-xl font-bold text-amber-600">4.2 min</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Event Info Card */}
                <Card className="hover:shadow-lg transition-all duration-300">
                  <CardHeader>
                    <CardTitle>Event Information</CardTitle>
                    <CardDescription>Basic event details</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                        <Calendar className="w-5 h-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">Event Date</p>
                          <p className="text-sm text-muted-foreground">{event.date}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                        <Users className="w-5 h-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">Organizer</p>
                          <p className="text-sm text-muted-foreground">{event.organizer}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                        <Badge variant="outline">{event.category}</Badge>
                        <Badge variant={event.status === "published" ? "default" : "secondary"}>
                          {event.status}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EventDetailModal;
