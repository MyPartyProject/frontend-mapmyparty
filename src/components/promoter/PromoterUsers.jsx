import { useCallback, useMemo } from "react";
import { Link, useOutletContext } from "react-router-dom";
import {
  AlertCircle,
  Calendar,
  ChevronRight,
  Lock,
  Loader,
  Mail,
  Phone,
  Search,
  ShieldCheck,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { usePromoterUsers } from "@/hooks/usePromoterUsers";

const PromoterUsers = () => {
  const { currency } = useOutletContext();
  const { users, loading, isFetching, error, pagination, filters, updateFilters, changePage } =
    usePromoterUsers();

  const handleSearchChange = useCallback(
    (e) => {
      updateFilters({ search: e.target.value });
    },
    [updateFilters]
  );

  const formatDate = useCallback((value) => {
    if (!value) return "N/A";
    return new Date(value).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }, []);

  const paginationNumbers = useMemo(() => {
    const pages = [];
    const maxPages = pagination.totalPages;
    const currentPage = pagination.page;

    if (maxPages <= 1) return [];

    pages.push(1);
    const startPage = Math.max(2, currentPage - 1);
    const endPage = Math.min(maxPages - 1, currentPage + 1);

    if (startPage > 2) pages.push("...");
    for (let pageNum = startPage; pageNum <= endPage; pageNum += 1) {
      if (pageNum !== 1 && pageNum !== maxPages) pages.push(pageNum);
    }
    if (endPage < maxPages - 1) pages.push("...");
    if (maxPages > 1) pages.push(maxPages);

    return pages;
  }, [pagination.page, pagination.totalPages]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold">Users</h2>
          <p className="text-muted-foreground">All attendee accounts with booking activity and spend.</p>
        </div>
        <Badge variant="outline" className="text-sm py-1 px-3 border-border/70">
          {pagination.total} Users
        </Badge>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search users (min 2 chars)..."
          value={filters.search}
          onChange={handleSearchChange}
          className="pl-9"
        />
        {isFetching && (
          <Loader className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
        )}
      </div>

      {isFetching && !loading && (
        <div className="h-0.5 w-full bg-muted overflow-hidden rounded-full">
          <div className="h-full w-1/3 bg-primary rounded-full animate-pulse" />
        </div>
      )}

      {error && (
        <Card className="bg-destructive/10 border-destructive/30">
          <CardContent className="pt-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-destructive">Error loading users</p>
              <p className="text-sm text-destructive/80">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {!loading && !isFetching && users.length === 0 && (
        <Card className="bg-card/70 border-border/60">
          <CardContent className="pt-6 text-center text-muted-foreground py-12">
            <p>No users found. Try adjusting your search.</p>
          </CardContent>
        </Card>
      )}

      {!loading && users.length > 0 && (
        <>
          <div className={`space-y-2 transition-opacity duration-150 ${isFetching ? "opacity-60" : "opacity-100"}`}>
            {users.map((user) => (
              <Card key={user.id} className="bg-card/70 border-border/60">
                <CardContent className="p-4">
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                    <div className="flex items-start gap-4">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback>{user.name?.slice(0, 2).toUpperCase() || "U"}</AvatarFallback>
                      </Avatar>
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold">{user.name || "Unnamed user"}</p>
                          <Badge variant={user.status === "active" ? "success" : "secondary"}>
                            {user.status}
                          </Badge>
                          {user.isSuspended && (
                            <Badge variant="destructive" className="gap-1">
                              <Lock className="h-3 w-3" />
                              Suspended
                            </Badge>
                          )}
                          {user.isVerified && (
                            <Badge variant="outline" className="border-emerald-500/30 text-emerald-600">
                              <ShieldCheck className="mr-1 h-3 w-3" />
                              Verified
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1">
                          <span className="inline-flex items-center gap-1.5">
                            <Mail className="w-3 h-3" />
                            {user.email || "No email"}
                          </span>
                          <span className="inline-flex items-center gap-1.5">
                            <Phone className="w-3 h-3" />
                            {user.phone || "No phone"}
                          </span>
                          <span className="inline-flex items-center gap-1.5">
                            <Calendar className="w-3 h-3" />
                            Joined {formatDate(user.joinedAt)}
                          </span>
                        </p>
                        {user.isSuspended && user.suspensionReason && (
                          <p className="text-xs text-destructive">
                            Suspension reason: {user.suspensionReason}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                      <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground">Bookings</p>
                          <p className="font-semibold">{Number(user.totalBookings || 0).toLocaleString()}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground">Tickets</p>
                          <p className="font-semibold">{Number(user.totalTickets || 0).toLocaleString()}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground">Spent</p>
                          <p className="font-semibold text-accent">{currency(user.totalSpent)}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground">Last booking</p>
                          <p className="font-semibold">{formatDate(user.lastBookingAt)}</p>
                        </div>
                      </div>

                      <Link
                        to={`/promoter/users/${user.id}`}
                        className="inline-flex items-center gap-2 text-sm font-semibold text-accent hover:text-accent/80 transition"
                      >
                        View details <ChevronRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {pagination.totalPages > 1 && (
            <div className="flex justify-center mt-6">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => changePage(pagination.page - 1)}
                      className={!pagination.hasPrevPage ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>

                  {paginationNumbers.map((pageNum, idx) => (
                    <PaginationItem key={`${pageNum}-${idx}`}>
                      {pageNum === "..." ? (
                        <PaginationEllipsis />
                      ) : (
                        <PaginationLink
                          onClick={() => changePage(pageNum)}
                          isActive={pageNum === pagination.page}
                          className="cursor-pointer"
                        >
                          {pageNum}
                        </PaginationLink>
                      )}
                    </PaginationItem>
                  ))}

                  <PaginationItem>
                    <PaginationNext
                      onClick={() => changePage(pagination.page + 1)}
                      className={!pagination.hasNextPage ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default PromoterUsers;
