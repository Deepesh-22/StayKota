import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  ImagePlus,
  X,
  AlertCircle,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { LOCALITIES, AMENITIES } from "../data/mockData";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import type { Hostel, RoomType, SharingType, ListingStatus } from "../types";
import { monthlyTotal } from "../lib/discovery";
import "../styles/owner-workspace.css";

const STEPS = [
  { id: 1, label: "Basics" },
  { id: 2, label: "Rooms & pricing" },
  { id: 3, label: "Amenities & rules" },
  { id: 4, label: "Photos" },
  { id: 5, label: "Review" },
] as const;

const SAMPLE_IMAGES = [
  "/images/room-shared.webp",
  "/images/room-single.webp",
  "/images/hostel-exterior.webp",
];

const emptyRoom = (): RoomType => ({
  id: `rt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
  hostelId: "",
  name: "Double Sharing",
  sharingType: "double",
  capacity: 2,
  rent: 6500,
  deposit: 5000,
  billingPeriod: "monthly",
  extraCharges: [],
  included: ["WiFi"],
  available: true,
  features: ["Attached bath"],
});

export function ListingWizardPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { user, hostels, addHostel, updateHostel } = useApp();

  const existing = isEdit
    ? hostels.find((h) => h.id === id && h.ownerId === user?.id)
    : null;

  const [step, setStep] = useState(1);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);

  const [name, setName] = useState("");
  const [category, setCategory] = useState<"boys" | "girls" | "co-ed">("boys");
  const [description, setDescription] = useState("");
  const [locality, setLocality] = useState(LOCALITIES[0]);
  const [address, setAddress] = useState("");
  const [landmark, setLandmark] = useState("");
  const [rooms, setRooms] = useState<RoomType[]>([emptyRoom()]);
  const [defaultDeposit, setDefaultDeposit] = useState(10000);
  const [electricity, setElectricity] = useState("Actuals · sub-metered");
  const [extraChargesNote, setExtraChargesNote] = useState("");
  const [amenities, setAmenities] = useState<string[]>(["WiFi", "Meals"]);
  const [rules, setRules] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [coverIndex, setCoverIndex] = useState(0);

  useEffect(() => {
    if (existing) {
      setName(existing.name);
      setCategory(existing.category);
      setDescription(existing.description);
      setLocality(existing.locality);
      setAddress(existing.address);
      setRooms(
        existing.roomTypes.map((r) => ({
          ...r,
          extraCharges: [...r.extraCharges],
        })),
      );
      setAmenities([...existing.amenities]);
      setImages(
        existing.images.length ? [...existing.images] : [existing.coverImage],
      );
      setDefaultDeposit(existing.roomTypes[0]?.deposit ?? 5000);
      setElectricity(
        existing.electricityPolicy ||
          "Metered electricity, charged by actual usage",
      );
      setExtraChargesNote(existing.extraChargesNote || "");
      setRules((existing.houseRules || []).join("\n"));
      setCoverIndex(Math.max(0, existing.images.indexOf(existing.coverImage)));
      setDirty(false);
    }
  }, [existing?.id]);

  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (dirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  const markDirty = () => setDirty(true);

  const strength = useMemo(() => {
    let s = 0;
    if (name.trim()) s += 15;
    if (address.trim()) s += 10;
    if (description.trim().length > 40) s += 10;
    if (rooms.length > 0 && rooms.every((r) => r.rent > 0)) s += 20;
    if (amenities.length >= 3) s += 15;
    if (images.length >= 1) s += 15;
    if (images.length >= 3) s += 10;
    if (rules.trim().length > 20) s += 5;
    return Math.min(100, s);
  }, [name, address, description, rooms, amenities, images, rules]);

  if (!user || user.role !== "owner") {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <p className="text-slate-600">Owner login required.</p>
        <Link
          to="/login?role=owner"
          className="text-teal-600 font-medium mt-4 inline-block"
        >
          Login as Owner
        </Link>
      </div>
    );
  }

  if (isEdit && !existing) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <p className="text-slate-600">Listing not found in your workspace.</p>
        <Link
          to="/owner"
          className="text-teal-600 font-medium mt-4 inline-block"
        >
          Back to dashboard
        </Link>
      </div>
    );
  }

  const validateStep = (s: number): boolean => {
    const e: Record<string, string> = {};
    if (s === 1) {
      if (!name.trim()) e.name = "Hostel name is required";
      if (!address.trim()) e.address = "Address is required";
      if (!locality) e.locality = "Locality is required";
    }
    if (s === 2) {
      if (rooms.length === 0) e.rooms = "Add at least one room type";
      rooms.forEach((r, i) => {
        if (!r.name.trim()) e[`room-name-${i}`] = "Name required";
        if (!Number.isFinite(r.rent) || r.rent <= 0)
          e[`room-rent-${i}`] = "Enter a monthly rent greater than zero";
        if (!Number.isFinite(r.deposit) || r.deposit < 0)
          e[`room-deposit-${i}`] = "Deposit must be zero or greater";
        if (
          r.extraCharges.some(
            (charge) => !Number.isFinite(charge.amount) || charge.amount < 0,
          )
        )
          e[`room-charge-${i}`] = "Charges must be zero or greater";
      });
    }
    if (s === 4 && images.length === 0) {
      e.images = "Add at least one sample photo";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const goNext = () => {
    if (!validateStep(step)) return;
    setStep((s) => Math.min(5, s + 1));
  };

  const goBack = () => setStep((s) => Math.max(1, s - 1));

  const buildHostel = (status: ListingStatus): Hostel => {
    const hostelId = existing?.id || `h-${Date.now()}`;
    const cover = images[coverIndex] || images[0] || SAMPLE_IMAGES[0];
    return {
      ...existing,
      id: hostelId,
      ownerId: user.id,
      name: name.trim(),
      description: description.trim() || "Owner-managed hostel listing.",
      locality,
      address: [address.trim(), landmark.trim()].filter(Boolean).join(" · "),
      category,
      status,
      amenities,
      houseRules: rules
        .split(/\n/)
        .map((rule) => rule.trim())
        .filter(Boolean),
      electricityPolicy: electricity.trim(),
      extraChargesNote: extraChargesNote.trim(),
      coverImage: cover,
      images: images.length ? images : [cover],
      roomTypes: rooms.map((r, i) => ({
        ...r,
        id: r.id || `rt-${hostelId}-${i}`,
        hostelId,
        deposit: Number.isFinite(r.deposit) ? r.deposit : defaultDeposit,
      })),
      createdAt: existing?.createdAt || new Date().toISOString().slice(0, 10),
      updatedAt: new Date().toISOString().slice(0, 10),
    };
  };

  const saveDraft = () => {
    if (saving) return;
    setSaving(true);
    setTimeout(() => {
      const h = buildHostel("draft");
      if (existing) updateHostel(h);
      else addHostel(h);
      setSaving(false);
      setDirty(false);
      setLastSaved(
        new Date().toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      );
      if (!isEdit) navigate(`/owner/listing/${h.id}/edit`, { replace: true });
    }, 400);
  };

  const submitForReview = () => {
    if (saving) return;
    for (const requiredStep of [1, 2, 4]) {
      if (!validateStep(requiredStep)) {
        setStep(requiredStep);
        return;
      }
    }
    setSaving(true);
    setTimeout(() => {
      const h = buildHostel("pending");
      if (existing) updateHostel(h);
      else addHostel(h);
      setSaving(false);
      setDirty(false);
      navigate("/owner");
    }, 500);
  };

  const simulateUpload = () => {
    setUploading(true);
    setUploadProgress(0);
    let p = 0;
    const t = setInterval(() => {
      p += 20 + Math.random() * 25;
      if (p >= 100) {
        clearInterval(t);
        setUploadProgress(100);
        const next = SAMPLE_IMAGES[images.length % SAMPLE_IMAGES.length];
        setImages((prev) => [...prev, next]);
        markDirty();
        setTimeout(() => {
          setUploading(false);
          setUploadProgress(0);
        }, 300);
      } else setUploadProgress(Math.min(99, Math.floor(p)));
    }, 180);
  };

  const updateRoom = (idx: number, patch: Partial<RoomType>) => {
    setRooms((rs) => rs.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
    markDirty();
  };

  return (
    <div className="owner-wizard animate-fade-in bg-[#faf8f5] min-h-[70vh]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <nav className="text-sm text-slate-500 mb-3">
          <Link to="/owner" className="hover:text-teal-700">
            Owner dashboard
          </Link>
          <span className="mx-2">›</span>
          <span className="text-slate-800">
            {isEdit ? "Edit listing" : "Add new hostel"}
          </span>
        </nav>

        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-6">
          <div>
            <h1 className="owner-wizard-heading text-2xl sm:text-3xl font-bold text-slate-900">
              {isEdit ? "Edit listing" : "List your hostel"}
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              A few thoughtful details help students find their place. Every
              submitted listing needs admin review.
            </p>
          </div>
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-800 border border-amber-100">
            {lastSaved
              ? `Draft saved at ${lastSaved}`
              : "Draft · not saved yet"}
          </span>
        </div>

        <nav className="owner-wizard-steps" aria-label="Listing steps">
          {STEPS.map((s) => (
            <button
              key={s.id}
              type="button"
              aria-current={step === s.id ? "step" : undefined}
              onClick={() => {
                if (s.id < step || validateStep(step)) setStep(s.id);
              }}
            >
              <span>{step > s.id ? <Check size={14} /> : s.id}</span>
              <span>{s.label}</span>
            </button>
          ))}
        </nav>

        <div className="grid lg:grid-cols-[1fr_240px] gap-6">
          <div className="space-y-5">
            {step === 1 && (
              <Card className="p-6 space-y-4 animate-fade-in">
                <h2 className="font-semibold text-lg text-slate-900">
                  Basic information
                </h2>
                <div>
                  <label
                    htmlFor="hostel-name"
                    className="text-sm font-medium text-slate-700"
                  >
                    Hostel name *
                  </label>
                  <input
                    id="hostel-name"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      markDirty();
                    }}
                    className={`mt-1 w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 ${errors.name ? "border-red-400" : "border-slate-200"}`}
                    placeholder="e.g. Shree Residency Boys Hostel"
                  />
                  {errors.name && (
                    <p className="text-xs text-red-600 mt-1" role="alert">
                      {errors.name}
                    </p>
                  )}
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor="hostel-category"
                      className="text-sm font-medium text-slate-700"
                    >
                      Category
                    </label>
                    <select
                      id="hostel-category"
                      value={category}
                      onChange={(e) => {
                        setCategory(e.target.value as typeof category);
                        markDirty();
                      }}
                      className="mt-1 w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm"
                    >
                      <option value="boys">Boys</option>
                      <option value="girls">Girls</option>
                      <option value="co-ed">Co-ed</option>
                    </select>
                  </div>
                  <div>
                    <label
                      htmlFor="hostel-locality"
                      className="text-sm font-medium text-slate-700"
                    >
                      Locality *
                    </label>
                    <select
                      id="hostel-locality"
                      value={locality}
                      onChange={(e) => {
                        setLocality(e.target.value);
                        markDirty();
                      }}
                      className={`mt-1 w-full px-3 py-2.5 rounded-xl border text-sm ${errors.locality ? "border-red-400" : "border-slate-200"}`}
                    >
                      {LOCALITIES.map((l) => (
                        <option key={l} value={l}>
                          {l}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label
                    htmlFor="hostel-address"
                    className="text-sm font-medium text-slate-700"
                  >
                    Full address *
                  </label>
                  <input
                    id="hostel-address"
                    value={address}
                    onChange={(e) => {
                      setAddress(e.target.value);
                      markDirty();
                    }}
                    className={`mt-1 w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 ${errors.address ? "border-red-400" : "border-slate-200"}`}
                    placeholder="House / street, Kota"
                  />
                  {errors.address && (
                    <p className="text-xs text-red-600 mt-1" role="alert">
                      {errors.address}
                    </p>
                  )}
                </div>
                <div>
                  <label
                    htmlFor="hostel-landmark"
                    className="text-sm font-medium text-slate-700"
                  >
                    Nearby landmark / coaching
                  </label>
                  <input
                    id="hostel-landmark"
                    value={landmark}
                    onChange={(e) => {
                      setLandmark(e.target.value);
                      markDirty();
                    }}
                    className="mt-1 w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm"
                    placeholder="e.g. Near Allen Sangyan, Talwandi"
                  />
                </div>
                <div>
                  <label
                    htmlFor="hostel-description"
                    className="text-sm font-medium text-slate-700"
                  >
                    Description
                  </label>
                  <textarea
                    id="hostel-description"
                    value={description}
                    onChange={(e) => {
                      setDescription(e.target.value);
                      markDirty();
                    }}
                    rows={4}
                    className="mt-1 w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-teal-500"
                    placeholder="Tell students about food, study environment, distance from coachings…"
                  />
                </div>
              </Card>
            )}

            {step === 2 && (
              <Card className="p-6 space-y-5 animate-fade-in">
                <h2 className="font-semibold text-lg text-slate-900">
                  Rooms & pricing
                </h2>
                <p className="text-xs text-slate-500">
                  All amounts are per student. Keep monthly charges separate
                  from the refundable deposit.
                </p>
                {errors.rooms && (
                  <p className="text-sm text-red-600" role="alert">
                    {errors.rooms}
                  </p>
                )}
                <div className="grid sm:grid-cols-2 gap-4">
                  {rooms.map((r, idx) => (
                    <div key={r.id} className="wizard-room-card">
                      {rooms.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            setRooms((rs) => rs.filter((_, i) => i !== idx));
                            markDirty();
                          }}
                          aria-label={"Remove room type " + (idx + 1)}
                          className="absolute top-2 right-2 p-1 text-slate-400 hover:text-red-500"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <label className="sr-only" htmlFor={"room-name-" + idx}>
                        Room type name {idx + 1}
                      </label>
                      <input
                        id={"room-name-" + idx}
                        value={r.name}
                        onChange={(e) =>
                          updateRoom(idx, { name: e.target.value })
                        }
                        className="font-semibold text-slate-900 bg-transparent border-0 p-0 w-full focus:outline-none text-sm pr-5"
                      />
                      <p className="text-xs text-slate-400 mt-1 mb-4">
                        Per student · monthly
                      </p>
                      <div className="wizard-room-fields">
                        <label htmlFor={"room-sharing-" + idx}>
                          Sharing
                          <select
                            id={"room-sharing-" + idx}
                            value={r.sharingType}
                            onChange={(e) => {
                              const v = e.target.value as SharingType;
                              updateRoom(idx, {
                                sharingType: v,
                                capacity:
                                  v === "single"
                                    ? 1
                                    : v === "double"
                                      ? 2
                                      : v === "triple"
                                        ? 3
                                        : 4,
                              });
                            }}
                          >
                            <option value="single">Single</option>
                            <option value="double">Double</option>
                            <option value="triple">Triple</option>
                            <option value="four">Four sharing</option>
                          </select>
                        </label>
                        <label htmlFor={"room-bathroom-" + idx}>
                          Bathroom
                          <select
                            id={"room-bathroom-" + idx}
                            value={
                              r.features.some((feature) =>
                                /attached/i.test(feature),
                              )
                                ? "attached"
                                : "shared"
                            }
                            onChange={(e) =>
                              updateRoom(idx, {
                                features: [
                                  ...r.features.filter(
                                    (feature) => !/bath|toilet/i.test(feature),
                                  ),
                                  e.target.value === "attached"
                                    ? "Attached bathroom"
                                    : "Shared bathroom",
                                ],
                              })
                            }
                          >
                            <option value="attached">Attached</option>
                            <option value="shared">Shared / common</option>
                          </select>
                        </label>
                        <label htmlFor={"room-rent-" + idx}>
                          Monthly rent ₹
                          <input
                            id={"room-rent-" + idx}
                            type="number"
                            min={1}
                            step={100}
                            value={r.rent}
                            onChange={(e) =>
                              updateRoom(idx, { rent: Number(e.target.value) })
                            }
                          />
                        </label>
                        <label htmlFor={"room-mess-" + idx}>
                          Mandatory mess ₹
                          <input
                            id={"room-mess-" + idx}
                            type="number"
                            min={0}
                            step={100}
                            value={
                              r.extraCharges.find(
                                (charge) =>
                                  /mess/i.test(charge.name) && !charge.optional,
                              )?.amount || 0
                            }
                            onChange={(e) => {
                              const amount = Number(e.target.value);
                              updateRoom(idx, {
                                extraCharges: [
                                  ...r.extraCharges.filter(
                                    (charge) =>
                                      !(
                                        /mess/i.test(charge.name) &&
                                        !charge.optional
                                      ),
                                  ),
                                  ...(amount > 0
                                    ? [
                                        {
                                          name: "Mess",
                                          amount,
                                          optional: false,
                                        },
                                      ]
                                    : []),
                                ],
                              });
                            }}
                          />
                        </label>
                        <label htmlFor={"room-deposit-" + idx}>
                          Refundable deposit ₹
                          <input
                            id={"room-deposit-" + idx}
                            type="number"
                            min={0}
                            step={100}
                            value={r.deposit}
                            onChange={(e) =>
                              updateRoom(idx, {
                                deposit: Number(e.target.value),
                              })
                            }
                          />
                        </label>
                        <label htmlFor={"room-ac-" + idx}>
                          Air conditioning
                          <select
                            id={"room-ac-" + idx}
                            value={
                              r.features.includes("AC") ||
                              r.included.includes("AC")
                                ? "yes"
                                : "no"
                            }
                            onChange={(e) =>
                              updateRoom(idx, {
                                features: [
                                  ...r.features.filter(
                                    (feature) => feature !== "AC",
                                  ),
                                  ...(e.target.value === "yes" ? ["AC"] : []),
                                ],
                                included:
                                  e.target.value === "no"
                                    ? r.included.filter((item) => item !== "AC")
                                    : r.included,
                              })
                            }
                          >
                            <option value="no">Not included</option>
                            <option value="yes">Available</option>
                          </select>
                        </label>
                      </div>
                      <div className="wizard-price-total">
                        <span>Fixed monthly total</span>
                        <strong>
                          ₹{monthlyTotal(r).toLocaleString("en-IN")}
                        </strong>
                      </div>
                      <label className="flex items-center gap-2 text-xs text-slate-600 mt-3">
                        <input
                          type="checkbox"
                          checked={r.available}
                          onChange={(e) =>
                            updateRoom(idx, { available: e.target.checked })
                          }
                        />{" "}
                        Available for enquiries
                      </label>
                      <p className="text-[10px] text-slate-400 mt-2">
                        Deposit, optional services and metered electricity are
                        separate.
                      </p>
                      {(errors["room-name-" + idx] ||
                        errors["room-rent-" + idx] ||
                        errors["room-deposit-" + idx] ||
                        errors["room-charge-" + idx]) && (
                        <p className="text-xs text-red-600 mt-2" role="alert">
                          {errors["room-name-" + idx] ||
                            errors["room-rent-" + idx] ||
                            errors["room-deposit-" + idx] ||
                            errors["room-charge-" + idx]}
                        </p>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      setRooms((rs) => [
                        ...rs,
                        { ...emptyRoom(), deposit: defaultDeposit },
                      ]);
                      markDirty();
                    }}
                    className="min-h-[140px] rounded-2xl border-2 border-dashed border-slate-200 text-slate-400 hover:border-teal-400 hover:text-teal-700 flex flex-col items-center justify-center gap-1 text-sm"
                  >
                    <Plus className="w-5 h-5" />
                    Add room type
                  </button>
                </div>
                <div className="grid sm:grid-cols-2 gap-3 pt-2">
                  <div>
                    <label
                      htmlFor="default-deposit"
                      className="text-sm font-medium text-slate-700"
                    >
                      Default deposit for new rooms
                    </label>
                    <input
                      id="default-deposit"
                      type="number"
                      value={defaultDeposit}
                      onChange={(e) => {
                        setDefaultDeposit(Number(e.target.value));
                        markDirty();
                      }}
                      className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
                    />
                    <p className="text-xs text-slate-400 mt-1">
                      Used for newly added room types. Each room can have its
                      own deposit.
                    </p>
                  </div>
                  <div>
                    <label
                      htmlFor="electricity-policy"
                      className="text-sm font-medium text-slate-700"
                    >
                      Electricity
                    </label>
                    <input
                      id="electricity-policy"
                      value={electricity}
                      onChange={(e) => {
                        setElectricity(e.target.value);
                        markDirty();
                      }}
                      className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
                      placeholder="Actuals · sub-metered"
                    />
                  </div>
                </div>
                <div>
                  <label
                    htmlFor="charges-note"
                    className="text-sm font-medium text-slate-700"
                  >
                    Extra charges (optional note)
                  </label>
                  <input
                    id="charges-note"
                    value={extraChargesNote}
                    onChange={(e) => {
                      setExtraChargesNote(e.target.value);
                      markDirty();
                    }}
                    className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
                    placeholder="Laundry ₹400/mo · Cooler ₹300/mo (Apr–Jul)"
                  />
                </div>
              </Card>
            )}

            {step === 3 && (
              <Card className="p-6 space-y-5 animate-fade-in">
                <div>
                  <h2 className="font-semibold text-lg text-slate-900">
                    Amenities
                  </h2>
                  <p className="text-sm text-slate-500 mt-1">
                    Select only facilities you actually provide.
                  </p>
                  <div className="flex flex-wrap gap-2 mt-4">
                    {AMENITIES.map((a) => {
                      const on = amenities.includes(a);
                      return (
                        <button
                          key={a}
                          type="button"
                          onClick={() => {
                            setAmenities((prev) =>
                              on ? prev.filter((x) => x !== a) : [...prev, a],
                            );
                            markDirty();
                          }}
                          className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                            on
                              ? "bg-slate-900 text-white border-slate-900"
                              : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                          }`}
                        >
                          {a}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <label
                    htmlFor="house-rules"
                    className="text-sm font-medium text-slate-700"
                  >
                    House rules
                  </label>
                  <p className="text-xs text-slate-400 mt-1">
                    One rule per line. Include visiting hours, notice period and
                    deposit refund terms where applicable.
                  </p>
                  <textarea
                    id="house-rules"
                    value={rules}
                    onChange={(e) => {
                      setRules(e.target.value);
                      markDirty();
                    }}
                    rows={4}
                    className="mt-1 w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </Card>
            )}

            {step === 4 && (
              <Card className="p-6 space-y-4 animate-fade-in">
                <h2 className="font-semibold text-lg text-slate-900">Photos</h2>
                <p className="text-sm text-slate-500">
                  Add sample room and exterior photos to try the listing flow.
                  Real uploads will be connected with the backend.
                </p>
                {errors.images && (
                  <p className="text-sm text-red-600" role="alert">
                    {errors.images}
                  </p>
                )}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={simulateUpload}
                    disabled={uploading}
                    className="aspect-[4/3] rounded-2xl border-2 border-dashed border-amber-200 bg-amber-50/50 flex flex-col items-center justify-center gap-2 text-slate-500 hover:border-teal-400 transition-colors"
                  >
                    <ImagePlus className="w-6 h-6" />
                    <span className="text-xs font-medium">
                      {uploading
                        ? `Adding ${uploadProgress}%`
                        : "Add sample photo"}
                    </span>
                    {uploading && (
                      <div className="w-20 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-teal-500 transition-all"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    )}
                  </button>
                  {images.map((src, i) => (
                    <div
                      key={src + i}
                      className={`relative aspect-[4/3] rounded-2xl overflow-hidden border-2 ${coverIndex === i ? "border-teal-500" : "border-transparent"}`}
                    >
                      <img
                        src={src}
                        alt={"Sample hostel photograph " + (i + 1)}
                        className="w-full h-full object-cover"
                      />
                      <div className="wizard-photo-actions">
                        <button
                          type="button"
                          onClick={() => {
                            setCoverIndex(i);
                            markDirty();
                          }}
                          className="px-2 py-1 bg-white rounded-lg text-xs font-medium"
                        >
                          {coverIndex === i ? "Cover" : "Set cover"}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setImages((imgs) => imgs.filter((_, j) => j !== i));
                            if (coverIndex >= images.length - 1)
                              setCoverIndex(0);
                            markDirty();
                          }}
                          aria-label={"Remove photo " + (i + 1)}
                          className="p-1.5 bg-white rounded-lg text-red-500"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      {coverIndex === i && (
                        <span className="absolute top-2 left-2 px-2 py-0.5 bg-teal-600 text-white text-[10px] font-semibold rounded-full">
                          Cover
                        </span>
                      )}
                    </div>
                  ))}
                </div>
                <p className="wizard-local-note">
                  This demo adds generated sample photographs. No real files are
                  uploaded or shared.
                </p>
              </Card>
            )}

            {step === 5 && (
              <Card className="p-6 space-y-5 animate-fade-in">
                <h2 className="font-semibold text-lg text-slate-900">
                  Review & submit
                </h2>
                <div className="flex gap-4">
                  {images[0] && (
                    <img
                      src={images[coverIndex] || images[0]}
                      alt=""
                      className="w-28 h-20 rounded-xl object-cover"
                    />
                  )}
                  <div>
                    <p className="font-semibold text-slate-900">
                      {name || "Untitled hostel"}
                    </p>
                    <p className="text-sm text-slate-500">
                      {locality} · {category} · {address}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      {rooms.length} room types · {amenities.length} amenities ·{" "}
                      {images.length} photos
                    </p>
                  </div>
                </div>
                <p className="text-xs text-slate-500">
                  Fixed monthly amounts per student. Metered electricity and
                  optional services are separate.
                </p>
                <ul className="divide-y divide-slate-100 text-sm">
                  {rooms.map((r) => (
                    <li key={r.id} className="py-2 flex justify-between">
                      <span>
                        {r.name} ({r.sharingType})
                      </span>
                      <span className="font-medium">
                        ₹{monthlyTotal(r).toLocaleString("en-IN")}/month ·
                        deposit ₹{r.deposit.toLocaleString("en-IN")}
                      </span>
                    </li>
                  ))}
                </ul>
                <div className="wizard-side-summary">
                  <p>
                    <b>Electricity:</b> {electricity || "Not specified"}
                  </p>
                  {extraChargesNote && (
                    <p>
                      <b>Other charges:</b> {extraChargesNote}
                    </p>
                  )}
                  <p>
                    <b>House rules:</b> {rules || "Not specified"}
                  </p>
                </div>
                <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 border border-amber-100 text-sm text-amber-900">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <p>
                    Submitting sets status to <strong>Pending Review</strong>.
                    An admin must approve before the listing appears on Explore.
                    This is a frontend simulation — no real notification is
                    sent.
                  </p>
                </div>
              </Card>
            )}

            <div className="flex flex-wrap items-center gap-3 pt-2">
              {step > 1 ? (
                <Button
                  variant="outline"
                  className="rounded-xl"
                  onClick={goBack}
                >
                  <ChevronLeft className="w-4 h-4" /> Back
                </Button>
              ) : (
                <Link to="/owner">
                  <Button variant="outline" className="rounded-xl">
                    <ChevronLeft className="w-4 h-4" /> Dashboard
                  </Button>
                </Link>
              )}
              <div className="flex-1" />
              <Button
                variant="outline"
                className="rounded-xl"
                loading={saving}
                onClick={saveDraft}
              >
                Save draft
              </Button>
              {step < 5 ? (
                <Button className="rounded-xl" onClick={goNext}>
                  Continue <ChevronRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button
                  className="rounded-xl"
                  loading={saving}
                  onClick={submitForReview}
                >
                  Submit for review
                </Button>
              )}
            </div>
          </div>

          <aside className="space-y-4">
            <Card className="p-4 sticky top-24">
              <p className="owner-eyebrow">LIVE COST PREVIEW</p>
              <div className="wizard-side-summary">
                <strong>
                  ₹
                  {monthlyTotal(rooms[0] || emptyRoom()).toLocaleString(
                    "en-IN",
                  )}
                </strong>
                <p>{rooms[0]?.name || "Room type"} / student / month</p>
                <small>
                  ₹{(rooms[0]?.deposit || 0).toLocaleString("en-IN")} deposit
                  separately · electricity as stated
                </small>
              </div>
              <hr className="my-5 border-slate-100" />
              <p className="text-sm font-semibold text-slate-900">
                Listing strength
              </p>
              <div className="mt-3 h-2 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full bg-teal-500 transition-all duration-500"
                  style={{ width: `${strength}%` }}
                />
              </div>
              <p className="text-xs text-slate-500 mt-2">
                {strength}% complete
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {strength < 90
                  ? "Add photos + amenities to strengthen this listing."
                  : "Looking good for review."}
              </p>
            </Card>
            <Card className="p-4 wizard-side-note">
              <p className="text-sm font-medium text-amber-900">
                Tip for Kota owners
              </p>
              <p className="text-xs text-amber-800 mt-1">
                State the real room, food and electricity charges. Approval
                reviews the listing; it does not certify the property.
              </p>
            </Card>
          </aside>
        </div>
      </div>
    </div>
  );
}
