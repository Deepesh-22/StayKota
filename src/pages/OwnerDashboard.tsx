import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  BedDouble,
  Building2,
  CalendarDays,
  ChevronRight,
  Clock3,
  FilePenLine,
  LayoutGrid,
  MapPin,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { Modal } from "../components/ui/Modal";
import type { Hostel, ListingStatus } from "../types";
import "../styles/owner-workspace.css";

type Section = "overview" | "listings" | "visits";
const statusLabels: Record<ListingStatus, string> = {
  draft: "Draft",
  pending: "Pending review",
  approved: "Published",
  rejected: "Hidden / rejected",
};
const dateLabel = (value: string) =>
  new Date(value + "T12:00:00").toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
const localToday = () => {
  const now = new Date();
  return [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("-");
};

export function OwnerDashboard() {
  const { user, hostels, visits, updateHostel } = useApp();
  const [section, setSection] = useState<Section>("overview");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<ListingStatus | "">("");
  const [notice, setNotice] = useState("");
  const [hideId, setHideId] = useState<string | null>(null);
  const [requestId, setRequestId] = useState<string | null>(null);
  const today = localToday();
  const myHostels = useMemo(
    () => hostels.filter((hostel) => hostel.ownerId === user?.id),
    [hostels, user?.id],
  );
  const myVisits = useMemo(
    () =>
      visits.filter((visit) =>
        myHostels.some((hostel) => hostel.id === visit.hostelId),
      ),
    [visits, myHostels],
  );
  const filtered = useMemo(
    () =>
      myHostels.filter(
        (hostel) =>
          (!status || hostel.status === status) &&
          (hostel.name + " " + hostel.locality)
            .toLowerCase()
            .includes(search.toLowerCase().trim()),
      ),
    [myHostels, status, search],
  );
  const activeVisits = myVisits.filter(
    (visit) => visit.status !== "cancelled" && visit.visitDate >= today,
  );
  const published = myHostels.filter((hostel) => hostel.status === "approved");
  const pending = myHostels.filter((hostel) => hostel.status === "pending");

  if (!user || user.role !== "owner")
    return (
      <div className="owner-guard">
        <Building2 size={34} />
        <h1>Your hostel, thoughtfully managed.</h1>
        <p>
          Sign in as an owner to create listings and see your visit requests.
        </p>
        <Link className="owner-primary" to="/login?role=owner&redirect=/owner">
          Owner sign in <ArrowUpRight size={17} />
        </Link>
      </div>
    );

  function changeStatus(hostel: Hostel, next: ListingStatus) {
    if (hostel.ownerId !== user?.id) return;
    updateHostel({ ...hostel, status: next });
    setNotice(
      next === "pending"
        ? "Submitted for review in this demo. An admin must approve before publication."
        : "Listing is now a draft and is hidden from public search.",
    );
  }
  const listingCard = (hostel: Hostel) => (
    <article className="owner-listing" key={hostel.id}>
      <img
        src={hostel.coverImage}
        alt={hostel.name + " sample accommodation"}
        onError={(event) => {
          event.currentTarget.onerror = null;
          event.currentTarget.src = "/images/room-shared.webp";
        }}
      />
      <div className="owner-listing-main">
        <div className="owner-listing-title">
          <h3>{hostel.name}</h3>
          <span className={"owner-status owner-status-" + hostel.status}>
            {statusLabels[hostel.status]}
          </span>
        </div>
        <p>
          <MapPin size={13} /> {hostel.locality}, Kota
        </p>
        <span className="owner-room-count">
          <BedDouble size={14} />
          {hostel.roomTypes.filter((room) => room.available).length} of{" "}
          {hostel.roomTypes.length} room types available
        </span>
      </div>
      <div className="owner-listing-actions">
        {hostel.status === "approved" && (
          <Link
            to={"/hostel/" + hostel.id}
            aria-label={"View " + hostel.name}
            className="owner-icon-link"
          >
            <ArrowUpRight size={18} />
          </Link>
        )}
        <Link
          className="owner-secondary"
          to={"/owner/listing/" + hostel.id + "/edit"}
        >
          <FilePenLine size={14} /> Edit
        </Link>
        {hostel.status === "draft" && (
          <button
            type="button"
            className="owner-text-action"
            onClick={() => changeStatus(hostel, "pending")}
          >
            Submit for review
          </button>
        )}
        {hostel.status === "approved" && (
          <button
            type="button"
            className="owner-text-action"
            onClick={() => changeStatus(hostel, "draft")}
          >
            Unpublish
          </button>
        )}
        <button
          type="button"
          className="owner-icon-link owner-remove"
          aria-label={"Hide " + hostel.name}
          onClick={() => setHideId(hostel.id)}
        >
          <Trash2 size={15} />
        </button>
      </div>
    </article>
  );
  const visitCards = (limit?: number) => {
    const items = (section === "overview" ? activeVisits : myVisits).slice(
      0,
      limit,
    );
    return items.length ? (
      <div className="owner-visits">
        {items.map((visit) => (
          <article className="owner-visit" key={visit.id}>
            <div className="owner-student-avatar">
              {visit.studentName.charAt(0)}
            </div>
            <div className="owner-visit-content">
              <h3>{visit.studentName}</h3>
              <p>
                {visit.hostelName}
                {visit.roomTypeName ? " · " + visit.roomTypeName : ""}
              </p>
              <span>
                <CalendarDays size={13} /> {dateLabel(visit.visitDate)}
              </span>
              {visit.message && <blockquote>{visit.message}</blockquote>}
              <p className="owner-small-note">
                Private local demo request. No notification was sent.
              </p>
            </div>
            <div className="owner-visit-actions">
              <Badge
                variant={
                  visit.status === "cancelled"
                    ? "default"
                    : visit.status === "confirmed"
                      ? "success"
                      : "warning"
                }
              >
                {visit.status === "cancelled"
                  ? "Cancelled"
                  : visit.status === "confirmed"
                    ? "Confirmed"
                    : "Coordination pending"}
              </Badge>
              <button type="button" onClick={() => setRequestId(visit.id)}>
                View request <ChevronRight size={12} />
              </button>
            </div>
          </article>
        ))}
      </div>
    ) : (
      <div className="owner-empty">
        <CalendarDays size={29} />
        <h3>No visit requests yet</h3>
        <p>
          Requests for your hostels will appear here. Keep your room
          availability and prices up to date.
        </p>
      </div>
    );
  };
  return (
    <div className="owner-workspace">
      <div className="owner-layout">
        <aside className="owner-sidebar">
          <p className="owner-eyebrow">OWNER WORKSPACE</p>
          <h2>
            Good stays.
            <br />
            Better beginnings.
          </h2>
          <nav aria-label="Owner workspace">
            {(
              [
                { id: "overview", label: "Overview", icon: LayoutGrid },
                { id: "listings", label: "My listings", icon: Building2 },
                { id: "visits", label: "Visit requests", icon: CalendarDays },
              ] as const
            ).map((item) => (
              <button
                type="button"
                key={item.id}
                onClick={() => {
                  setSection(item.id);
                  setNotice("");
                }}
                aria-current={section === item.id ? "page" : undefined}
              >
                <item.icon size={18} />
                <span>{item.label}</span>
                {item.id === "visits" && activeVisits.length > 0 && (
                  <small>{activeVisits.length}</small>
                )}
              </button>
            ))}
          </nav>
          <div className="owner-sidebar-note">
            <ShieldCheck size={21} />
            <strong>A little care goes a long way.</strong>
            <p>
              Clear photos, current availability and honest charges help
              students make a confident choice.
            </p>
            <span>Frontend demo · saved on this device</span>
          </div>
        </aside>
        <div className="owner-main">
          <header className="owner-page-header">
            <div>
              <p className="owner-eyebrow">YOUR HOSTELS, IN ONE PLACE</p>
              <h1>
                {section === "visits"
                  ? "Make room for a visit."
                  : section === "listings"
                    ? "Manage your hostels."
                    : "Hello, " + user.name.split(" ")[0] + "."}
              </h1>
              <p>
                {section === "visits"
                  ? "Help students take their next step. Coordinate a date before a visit."
                  : "Create a welcoming first impression, then keep the details fresh."}
              </p>
            </div>
            <Link className="owner-primary" to="/owner/listing/new">
              <Plus size={18} /> Add listing
            </Link>
          </header>
          {notice && (
            <div className="owner-notice" role="status">
              <ShieldCheck size={18} />
              <span>{notice}</span>
              <button
                type="button"
                onClick={() => setNotice("")}
                aria-label="Dismiss message"
              >
                ×
              </button>
            </div>
          )}
          {section === "overview" && (
            <>
              <div className="owner-stats">
                {[
                  {
                    icon: Building2,
                    label: "Published hostels",
                    value: published.length,
                    note: "Visible in student search",
                  },
                  {
                    icon: Clock3,
                    label: "Pending review",
                    value: pending.length,
                    note: "Waiting for admin review",
                  },
                  {
                    icon: CalendarDays,
                    label: "Upcoming requests",
                    value: activeVisits.length,
                    note: "Exact time to be coordinated",
                  },
                ].map((item) => (
                  <article key={item.label}>
                    <item.icon size={20} />
                    <strong>{item.value}</strong>
                    <span>{item.label}</span>
                    <small>{item.note}</small>
                  </article>
                ))}
              </div>
              <section className="owner-section">
                <div className="owner-section-header">
                  <div>
                    <p className="owner-eyebrow">A PLACE TO CALL HOME</p>
                    <h2>Your listings</h2>
                  </div>
                  <button type="button" onClick={() => setSection("listings")}>
                    Manage all <ChevronRight size={16} />
                  </button>
                </div>
                {myHostels.length ? (
                  <div className="owner-listings">
                    {myHostels.slice(0, 3).map(listingCard)}
                  </div>
                ) : (
                  <div className="owner-empty">
                    <Building2 size={32} />
                    <h3>Your first listing starts here</h3>
                    <p>
                      Add your hostel, room choices and transparent pricing.
                      Submit it when you are ready for review.
                    </p>
                    <Link className="owner-primary" to="/owner/listing/new">
                      Create a listing <ArrowUpRight size={16} />
                    </Link>
                  </div>
                )}
              </section>
              <section className="owner-section">
                <div className="owner-section-header">
                  <div>
                    <p className="owner-eyebrow">THE NEXT HELLO</p>
                    <h2>Recent visit requests</h2>
                  </div>
                  <button type="button" onClick={() => setSection("visits")}>
                    View all <ChevronRight size={16} />
                  </button>
                </div>
                {visitCards(3)}
              </section>
              <div className="owner-help-strip">
                <ShieldCheck size={25} />
                <div>
                  <strong>Details change. Your listing should too.</strong>
                  <p>
                    Update availability and charges whenever a room changes.
                    Material edits return to review.
                  </p>
                </div>
                <Link to="/how-it-works">
                  How it works <ArrowUpRight size={16} />
                </Link>
              </div>
            </>
          )}
          {section === "listings" && (
            <section className="owner-section">
              <div className="owner-filter-bar">
                <label>
                  <Search size={17} />
                  <input
                    aria-label="Search your listings"
                    placeholder="Search hostel or locality"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                  />
                </label>
                <select
                  aria-label="Filter listing status"
                  value={status}
                  onChange={(event) =>
                    setStatus(event.target.value as ListingStatus | "")
                  }
                >
                  <option value="">All statuses</option>
                  <option value="approved">Published</option>
                  <option value="pending">Pending review</option>
                  <option value="draft">Draft</option>
                  <option value="rejected">Hidden / rejected</option>
                </select>
              </div>
              {filtered.length ? (
                <div className="owner-listings">
                  {filtered.map(listingCard)}
                </div>
              ) : (
                <div className="owner-empty">
                  <Search size={28} />
                  <h3>No matching listings</h3>
                  <p>Try another name or clear the status filter.</p>
                  <button
                    type="button"
                    className="owner-secondary"
                    onClick={() => {
                      setSearch("");
                      setStatus("");
                    }}
                  >
                    Clear filters
                  </button>
                </div>
              )}
            </section>
          )}
          {section === "visits" && (
            <section className="owner-section">
              <p className="owner-explainer">
                A visit request expresses interest. It does not reserve a room
                or confirm a visit time.
              </p>
              {visitCards()}
            </section>
          )}
        </div>
      </div>
      <Modal
        open={Boolean(hideId)}
        onClose={() => setHideId(null)}
        title="Hide this listing?"
      >
        <p className="owner-dialog-copy">
          This moves the listing to draft and removes it from public search. You
          can edit it and submit it for review again.
        </p>
        <div className="owner-dialog-actions">
          <Button variant="outline" onClick={() => setHideId(null)}>
            Keep listing
          </Button>
          <Button
            variant="danger"
            onClick={() => {
              const hostel = myHostels.find((item) => item.id === hideId);
              if (hostel) updateHostel({ ...hostel, status: "draft" });
              setHideId(null);
              setNotice("Listing hidden from public search.");
            }}
          >
            Hide listing
          </Button>
        </div>
      </Modal>
      <Modal
        open={Boolean(requestId)}
        onClose={() => setRequestId(null)}
        title="Visit request details"
      >
        {(() => {
          const request = myVisits.find((item) => item.id === requestId);
          return request ? (
            <div className="owner-request-detail">
              <Badge
                variant={
                  request.status === "cancelled"
                    ? "default"
                    : request.status === "confirmed"
                      ? "success"
                      : "warning"
                }
              >
                {request.status === "cancelled"
                  ? "Cancelled"
                  : request.status === "confirmed"
                    ? "Confirmed"
                    : "Coordination pending"}
              </Badge>
              <h3>{request.studentName}</h3>
              <p>{request.hostelName}</p>
              <p>{request.roomTypeName || "Room preference not specified"}</p>
              <p>
                <CalendarDays size={15} /> {dateLabel(request.visitDate)}
              </p>
              {request.message && <blockquote>{request.message}</blockquote>}
              <div className="owner-explainer">
                This is a local prototype request. Contact and notification
                delivery will be connected with the backend. A requested date is
                not a confirmed visit time.
              </div>
              <div className="owner-dialog-actions">
                <Button onClick={() => setRequestId(null)}>Done</Button>
              </div>
            </div>
          ) : null;
        })()}
      </Modal>
    </div>
  );
}
