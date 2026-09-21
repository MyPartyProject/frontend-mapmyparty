import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area
} from "recharts";
import { useState } from "react";
import { TrendingUp, TrendingDown, BarChart3, PieChart as PieChartIcon, Activity, Loader2 } from "lucide-react";
import { useAnalytics } from "@/hooks/useAnalytics";
import { useAuth } from "@/contexts/AuthContext";

// Beautiful color palette
const COLORS = {
  primary: "#8438B0", // Brand series
  secondary: "#0F766E", // Distinct comparison series
  success: "#10b981",      // Green
  warning: "#f59e0b",       // Amber
  danger: "#ef4444",        // Red
  info: "#06b6d4",          // Cyan
  accent: "#ec4899",        // Pink
};

const CHART_COLORS = [
  COLORS.primary,
  COLORS.secondary,
  COLORS.success,
  COLORS.warning,
  COLORS.danger,
  COLORS.info,
  COLORS.accent,
];

const LoadingSkeleton = ({ className = "" }) => (
  <div className={`animate-pulse bg-muted rounded-lg ${className}`} />
);

const PromoterAnalytics = () => {
  const [viewType, setViewType] = useState("overall");
  const { role } = useAuth();
  const isAdmin = role?.toUpperCase() === "ADMIN";

  const {
    summary,
    revenueOverTime,
    categories,
    organizerRevenue,
    ticketDistribution,
    loading,
    error,
    filters,
    updateFilters,
  } = useAnalytics("month");

  const handleTimeFrameChange = (value) => {
    updateFilters({ timeFrame: value });
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border rounded-lg shadow-lg p-3 animate-in fade-in-0 zoom-in-95">
          <p className="font-semibold mb-2">{label}</p>
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
        fill="hsl(var(--foreground))"
        textAnchor={x > cx ? "start" : "end"}
        dominantBaseline="central"
        className="text-sm font-semibold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  const formatCurrency = (value) => {
    if (value == null) return "--";
    return `₹${Number(value).toLocaleString("en-IN")}`;
  };

  const formatNumber = (value) => {
    if (value == null) return "--";
    return Number(value).toLocaleString("en-IN");
  };

  const renderChangeIndicator = (change) => {
    if (change == null) return null;
    const isPositive = change >= 0;
    const Icon = isPositive ? TrendingUp : TrendingDown;
    const colorClass = isPositive ? "text-green-600" : "text-red-600";
    const rangeLabel = filters.timeFrame === "week" ? "last week" : filters.timeFrame === "year" ? "last year" : "last month";
    return (
      <p className={`text-xs ${colorClass} flex items-center gap-1 mt-1`}>
        <Icon className="w-3 h-3" />
        {isPositive ? "+" : ""}{change}% from {rangeLabel}
      </p>
    );
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-destructive text-lg font-semibold">Failed to load analytics</p>
          <p className="text-muted-foreground mt-1">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h2>
          <p className="text-muted-foreground mt-1">
            Comprehensive insights into your event performance
          </p>
        </div>
        <div className="flex gap-3">
          <Select value={viewType} onValueChange={setViewType}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="overall">Overall Data</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filters.timeFrame} onValueChange={handleTimeFrameChange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Overall Analytics - Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 animate-in fade-in-0 slide-in-from-left-4" style={{ animationDelay: "0ms" }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <LoadingSkeleton className="h-12 w-32" />
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold">{formatCurrency(summary?.totalRevenue)}</p>
                  {renderChangeIndicator(summary?.revenueChange)}
                </div>
                <div className="p-3 rounded-full bg-blue-100 ">
                  <BarChart3 className="w-5 h-5 text-blue-600" />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 animate-in fade-in-0 slide-in-from-left-4" style={{ animationDelay: "100ms" }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Tickets Sold</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <LoadingSkeleton className="h-12 w-32" />
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold">{formatNumber(summary?.totalTicketsSold)}</p>
                  {renderChangeIndicator(summary?.ticketsChange)}
                </div>
                <div className="p-3 rounded-full bg-purple-100 ">
                  <Activity className="w-5 h-5 text-purple-600" />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 animate-in fade-in-0 slide-in-from-left-4" style={{ animationDelay: "200ms" }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Events</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <LoadingSkeleton className="h-12 w-32" />
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold">{formatNumber(summary?.activeEvents)}</p>
                  <p className="text-xs text-muted-foreground mt-1">Across all categories</p>
                </div>
                <div className="p-3 rounded-full bg-green-100 ">
                  <PieChartIcon className="w-5 h-5 text-green-600" />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 animate-in fade-in-0 slide-in-from-left-4" style={{ animationDelay: "300ms" }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Ticket Sell-Through</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <LoadingSkeleton className="h-12 w-32" />
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold">
                    {ticketDistribution.length > 0 ? `${ticketDistribution[0]?.value || 0}%` : "--"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Sold vs total capacity</p>
                </div>
                <div className="p-3 rounded-full bg-amber-100 ">
                  <TrendingUp className="w-5 h-5 text-amber-600" />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue & Sales Over Time - Area Chart */}
        <Card className="hover:shadow-lg transition-all duration-300 animate-in fade-in-0 slide-in-from-bottom-4">
          <CardHeader>
            <CardTitle>Revenue & Sales Over Time</CardTitle>
            <CardDescription>Track your revenue and ticket sales performance</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <LoadingSkeleton className="h-[350px] w-full" />
            ) : revenueOverTime.length === 0 ? (
              <div className="flex items-center justify-center h-[350px] text-muted-foreground">
                No data available for the selected period
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={350}>
                <AreaChart data={revenueOverTime} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorTickets" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS.secondary} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={COLORS.secondary} stopOpacity={0} />
                    </linearGradient>
                  </defs>
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
                  <Area
                    type="monotone"
                    dataKey="sales"
                    stroke={COLORS.primary}
                    fillOpacity={1}
                    fill="url(#colorSales)"
                    name="Revenue (₹)"
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="tickets"
                    stroke={COLORS.secondary}
                    fillOpacity={1}
                    fill="url(#colorTickets)"
                    name="Tickets Sold"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Category Distribution - Pie Chart */}
        <Card className="hover:shadow-lg transition-all duration-300 animate-in fade-in-0 slide-in-from-bottom-4">
          <CardHeader>
            <CardTitle>Events by Category</CardTitle>
            <CardDescription>Distribution of events across different categories</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <LoadingSkeleton className="h-[350px] w-full" />
            ) : categories.length === 0 ? (
              <div className="flex items-center justify-center h-[350px] text-muted-foreground">
                No category data available
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={350}>
                <PieChart>
                  <Pie
                    data={categories}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={renderCustomLabel}
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="value"
                    animationBegin={0}
                    animationDuration={800}
                  >
                    {categories.map((entry, index) => (
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
                            <p className="text-sm text-blue-600">Events: {data.events}</p>
                            <p className="text-sm text-green-600">Revenue: ₹{(data.revenue || 0).toLocaleString()}</p>
                            <p className="text-sm text-purple-600">Share: {data.value}%</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    formatter={(value, entry) => (
                      <span style={{ color: entry.color }}>{value}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Revenue by Organizer - Bar Chart (ADMIN only) */}
        {isAdmin && (
          <Card className="hover:shadow-lg transition-all duration-300 animate-in fade-in-0 slide-in-from-bottom-4">
            <CardHeader>
              <CardTitle>Revenue by Organizer</CardTitle>
              <CardDescription>Top performing organizers by revenue</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <LoadingSkeleton className="h-[350px] w-full" />
              ) : organizerRevenue.length === 0 ? (
                <div className="flex items-center justify-center h-[350px] text-muted-foreground">
                  No organizer data available
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={organizerRevenue} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                    <XAxis
                      dataKey="name"
                      stroke="hsl(var(--muted-foreground))"
                      style={{ fontSize: '12px' }}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis
                      stroke="hsl(var(--muted-foreground))"
                      style={{ fontSize: '12px' }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar
                      dataKey="revenue"
                      fill={COLORS.primary}
                      name="Revenue (₹)"
                      radius={[8, 8, 0, 0]}
                      animationBegin={0}
                      animationDuration={800}
                    />
                    <Bar
                      dataKey="events"
                      fill={COLORS.secondary}
                      name="Events"
                      radius={[8, 8, 0, 0]}
                      animationBegin={100}
                      animationDuration={800}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        )}

        {/* Ticket Sales Distribution - Pie Chart */}
        <Card className="hover:shadow-lg transition-all duration-300 animate-in fade-in-0 slide-in-from-bottom-4">
          <CardHeader>
            <CardTitle>Ticket Sales Distribution</CardTitle>
            <CardDescription>Sold vs available tickets overview</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <LoadingSkeleton className="h-[350px] w-full" />
            ) : ticketDistribution.length === 0 ? (
              <div className="flex items-center justify-center h-[350px] text-muted-foreground">
                No ticket data available
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={350}>
                <PieChart>
                  <Pie
                    data={ticketDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={renderCustomLabel}
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="value"
                    animationBegin={0}
                    animationDuration={800}
                  >
                    {ticketDistribution.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={index === 0 ? COLORS.success : COLORS.warning}
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
                            <p className="text-sm">Tickets: {(data.count || 0).toLocaleString()}</p>
                            <p className="text-sm">Percentage: {data.value}%</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PromoterAnalytics;
