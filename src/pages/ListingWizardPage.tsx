import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeft,
  ArrowLeftRight,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Copy,
  ImagePlus,
  Loader2,
  LocateFixed,
  MapPin,
  Plus,
  Rocket,
  Sparkles,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { LOCALITIES, AMENITIES } from '../data/mockData';
import { Button } from '../components/ui/Button';
import type { Hostel, RoomType, SharingType, ListingStatus } from '../types';
import { monthlyTotal } from '../lib/discovery';
import {
  fetchCurrentOwnerPosition,
  validateOwnerCoordinates,
} from '../lib/owner-location';
import {
  SUGGESTED_SAMPLE_PHOTOS,
  hasRealUploadedPhotos,
  isSamplePhoto,
  processUploadedPhoto,
} from '../lib/owner-media';
import '../styles/owner-workspace.css';

const STEPS = [
  { id: 1, label: 'Basics & Location', short: 'Basics' },
  { id: 2, label: 'Rooms & Pricing', short: 'Rooms' },
  { id: 3, label: 'Amenities & Rules', short: 'Rules' },
  { id: 4, label: 'Photos', short: 'Photos' },
  { id: 5, label: 'Review & Publish', short: 'Publish' },
] as const;

const ROOM_INCLUSIONS = ['WiFi', 'Meals', 'Laundry', 'Power Backup', 'RO Water', 'Housekeeping'] as const;

const RULE_SUGGESTIONS = [
  'Gate entry timing: 10:00 PM (prior notice for late coaching tests).',
  '30-day prior notice for full security deposit refund.',
  'Quiet study hours observed after 10:30 PM on residential floors.',
  'Parents and guardians welcome during daytime visiting hours.',
];

interface WizardNavState {
  step?: number;
  savedAt?: string;
}

const emptyRoom = (deposit = 5000): RoomType => ({
  id: `rt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
  hostelId: '',
  name: 'Double Sharing',
  sharingType: 'double',
  capacity: 2,
  rent: 6500,
  deposit,
  billingPeriod: 'monthly',
  extraCharges: [],
  included: ['WiFi', 'Meals'],
  available: true,
  features: ['Attached bathroom', 'Study table'],
});

export function ListingWizardPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const routeLocation = useLocation();
  const navState = (routeLocation.state as WizardNavState | null) || null;
  const { user, hostels, addHostel, updateHostel } = useApp();

  const existing = isEdit
    ? hostels.find((h) => h.id === id && h.ownerId === user?.id)
    : null;

  const [step, setStep] = useState<number>(() =>
    navState?.step && navState.step >= 1 && navState.step <= 5 ? navState.step : 1,
  );
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(() => navState?.savedAt ?? null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Photo upload states
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [photoFeedback, setPhotoFeedback] = useState('');

  // Location auto-fetch states
  const [locating, setLocating] = useState(false);
  const [locationMessage, setLocationMessage] = useState('');

  // Form fields
  const [name, setName] = useState('');
  const [category, setCategory] = useState<'boys' | 'girls' | 'co-ed'>('boys');
  const [description, setDescription] = useState('');
  const [locality, setLocality] = useState(LOCALITIES[0]);
  const [address, setAddress] = useState('');
  const [landmark, setLandmark] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [rooms, setRooms] = useState<RoomType[]>([emptyRoom(5000)]);
  const [defaultDeposit, setDefaultDeposit] = useState(5000);
  const [electricity, setElectricity] = useState('Sub-metered · actual consumption');
  const [extraChargesNote, setExtraChargesNote] = useState('');
  const [refundPolicy, setRefundPolicy] = useState('');
  const [amenities, setAmenities] = useState<string[]>(['WiFi', 'Meals', 'RO Water', 'CCTV', 'Power Backup']);
  const [rules, setRules] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [photoCaptions, setPhotoCaptions] = useState<Record<string, string>>({});
  const [coverIndex, setCoverIndex] = useState(0);

  useEffect(() => {
    if (existing) {
      setName(existing.name);
      setCategory(existing.category);
      setDescription(existing.description);
      setLocality(LOCALITIES.includes(existing.locality) ? existing.locality : LOCALITIES[0]);
      setAddress(existing.address);
      setLandmark(existing.landmark ?? '');
      setLatitude(existing.latitude !== undefined ? String(existing.latitude) : '');
      setLongitude(existing.longitude !== undefined ? String(existing.longitude) : '');
      setContactPhone(existing.contact?.phone ?? '');
      setContactEmail(existing.contact?.email ?? '');
      setRooms(
        existing.roomTypes.map((r) => ({
          ...r,
          extraCharges: [...r.extraCharges],
          included: [...r.included],
          features: [...r.features],
        })),
      );
      setAmenities([...existing.amenities]);
      const loadedImages = existing.images.length
        ? [...existing.images]
        : existing.coverImage
          ? [existing.coverImage]
          : [];
      setImages(loadedImages);
      setPhotoCaptions({ ...existing.photoCaptions });
      setDefaultDeposit(existing.roomTypes[0]?.deposit ?? 5000);
      setElectricity(
        existing.electricityPolicy || 'Sub-metered · actual consumption',
      );
      setExtraChargesNote(existing.extraChargesNote || '');
      setRefundPolicy(existing.refundPolicy || '');
      setRules((existing.houseRules || []).join('\n'));
      setCoverIndex(Math.max(0, loadedImages.indexOf(existing.coverImage)));
      setDirty(false);
    }
  }, [existing?.id]);

  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (dirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [dirty]);

  const markDirty = () => setDirty(true);

  const coordinateStatus = useMemo(
    () => validateOwnerCoordinates(latitude, longitude),
    [latitude, longitude],
  );

  const checklist = useMemo(
    () => [
      { label: 'Hostel name & address', done: Boolean(name.trim() && address.trim()) },
      { label: 'GPS entrance coordinates', done: Boolean(coordinateStatus.valid && !coordinateStatus.empty) },
      { label: 'Rooms & monthly pricing', done: rooms.length > 0 && rooms.every((r) => r.name.trim() && r.rent > 0) },
      { label: 'Facilities & house rules', done: amenities.length >= 3 && rules.trim().length > 10 },
      { label: 'Hostel photos added', done: images.length >= 1 },
    ],
    [name, address, coordinateStatus, rooms, amenities, rules, images],
  );

  const strength = useMemo(() => {
    let score = 0;
    if (name.trim()) score += 18;
    if (address.trim()) score += 12;
    if (coordinateStatus.valid && !coordinateStatus.empty) score += 15;
    if (description.trim().length >= 25) score += 10;
    if (rooms.length > 0 && rooms.every((r) => r.rent > 0)) score += 20;
    if (amenities.length >= 3) score += 10;
    if (images.length >= 1) score += 10;
    if (images.length >= 3 || hasRealUploadedPhotos(images)) score += 5;
    return Math.min(100, score);
  }, [name, address, coordinateStatus, description, rooms, amenities, images]);

  if (!user || user.role !== 'owner') {
    return (
      <div className="owner-guard">
        <h1>Owner sign-in required</h1>
        <p>Sign in with your hostel owner workspace to create or update listings.</p>
        <Link className="owner-primary" to="/login?role=owner">
          Sign in as Owner
        </Link>
      </div>
    );
  }

  if (isEdit && !existing) {
    return (
      <div className="owner-guard">
        <h1>Listing not found</h1>
        <p>This hostel could not be found in your owner workspace.</p>
        <Link className="owner-primary" to="/owner">
          <ArrowLeft size={16} /> Back to dashboard
        </Link>
      </div>
    );
  }

  const handleUseMyCurrentLocation = async () => {
    if (locating) return;
    setLocating(true);
    setLocationMessage('');
    setErrors((prev) => {
      const next = { ...prev };
      delete next.coordinates;
      return next;
    });
    try {
      const pos = await fetchCurrentOwnerPosition();
      setLatitude(String(pos.latitude));
      setLongitude(String(pos.longitude));
      if (pos.nearestLocality) {
        setLocality(pos.nearestLocality);
      }
      setLocationMessage(
        `Current location captured: ${pos.latitude.toFixed(6)}, ${pos.longitude.toFixed(6)}${
          pos.accuracy ? ` (accuracy ±${pos.accuracy} m)` : ''
        }${
          pos.nearestLocality
            ? ` · Nearest Kota area: ${pos.nearestLocality}`
            : pos.outsideKota
              ? ' · Saved exact coordinates (outside Kota map bounds)'
              : ''
        }`,
      );
      markDirty();
    } catch (err) {
      setErrors((prev) => ({
        ...prev,
        coordinates:
          err instanceof Error
            ? err.message
            : 'Unable to fetch current location. Please check browser permissions.',
      }));
    } finally {
      setLocating(false);
    }
  };

  const handleSwapCoordinates = () => {
    const prevLat = latitude;
    const prevLng = longitude;
    setLatitude(prevLng);
    setLongitude(prevLat);
    setErrors((prev) => {
      const next = { ...prev };
      delete next.coordinates;
      return next;
    });
    markDirty();
  };

  const handleFilesSelected = async (fileList: FileList | File[]) => {
    const files = Array.from(fileList);
    if (!files.length) return;
    setUploading(true);
    setPhotoFeedback('');
    setErrors((prev) => {
      const next = { ...prev };
      delete next.images;
      return next;
    });

    const addedUrls: string[] = [];
    const addedCaptions: Record<string, string> = {};
    const failedMessages: string[] = [];

    for (const file of files) {
      try {
        const result = await processUploadedPhoto(file);
        addedUrls.push(result.src);
        addedCaptions[result.src] = result.caption;
      } catch (err) {
        failedMessages.push(
          err instanceof Error ? err.message : `Could not process ${file.name}`,
        );
      }
    }

    if (addedUrls.length > 0) {
      setImages((prev) => [...prev, ...addedUrls]);
      setPhotoCaptions((prev) => ({ ...prev, ...addedCaptions }));
      setPhotoFeedback(
        `Uploaded ${addedUrls.length} real ${addedUrls.length === 1 ? 'photo' : 'photos'} ready for your listing.`,
      );
      markDirty();
    }
    if (failedMessages.length > 0) {
      setErrors((prev) => ({ ...prev, images: failedMessages[0] }));
    }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const addSuggestedSamplePhoto = (sampleSrc: string, caption: string) => {
    if (!images.includes(sampleSrc)) {
      setImages((prev) => [...prev, sampleSrc]);
      setPhotoCaptions((prev) => ({ ...prev, [sampleSrc]: prev[sampleSrc] || caption }));
      setErrors((prev) => {
        const next = { ...prev };
        delete next.images;
        return next;
      });
      markDirty();
    }
  };

  const addAllSuggestedPhotos = () => {
    const missing = SUGGESTED_SAMPLE_PHOTOS.filter((item) => !images.includes(item.src));
    if (!missing.length) return;
    setImages((prev) => [...prev, ...missing.map((m) => m.src)]);
    setPhotoCaptions((prev) => {
      const next = { ...prev };
      for (const m of missing) next[m.src] = next[m.src] || m.caption;
      return next;
    });
    setErrors((prev) => {
      const next = { ...prev };
      delete next.images;
      return next;
    });
    markDirty();
  };

  const removePhotoAt = (index: number) => {
    setImages((prev) => {
      const next = prev.filter((_, idx) => idx !== index);
      setCoverIndex((currentCover) => {
        if (next.length === 0) return 0;
        if (index === currentCover) return 0;
        if (index < currentCover) return currentCover - 1;
        return Math.min(currentCover, next.length - 1);
      });
      return next;
    });
    markDirty();
  };

  const movePhoto = (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= images.length) return;
    const currentCoverSrc = images[coverIndex];
    const reordered = [...images];
    const [picked] = reordered.splice(index, 1);
    reordered.splice(targetIndex, 0, picked);
    setImages(reordered);
    if (currentCoverSrc) {
      const updatedCover = reordered.indexOf(currentCoverSrc);
      if (updatedCover >= 0) setCoverIndex(updatedCover);
    }
    markDirty();
  };

  const validateStep = (targetStep: number): boolean => {
    const nextErrors: Record<string, string> = {};
    if (targetStep === 1) {
      if (!name.trim()) nextErrors.name = 'Hostel name is required';
      if (!address.trim()) nextErrors.address = 'Street address is required';
      if (!coordinateStatus.valid && coordinateStatus.error) {
        nextErrors.coordinates = coordinateStatus.error;
      }
      if (!locality) nextErrors.locality = 'Select a locality';
      if (contactPhone.trim() && !/^[+\d ()-]{7,20}$/.test(contactPhone.trim())) {
        nextErrors.contactPhone = 'Enter a valid 10-digit phone number';
      }
      if (contactEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail.trim())) {
        nextErrors.contactEmail = 'Enter a valid email address';
      }
    }
    if (targetStep === 2) {
      if (rooms.length === 0) nextErrors.rooms = 'Add at least one room option';
      rooms.forEach((r, i) => {
        if (!r.name.trim()) nextErrors[`room-name-${i}`] = 'Enter a room title';
        if (!Number.isFinite(r.rent) || r.rent <= 0) {
          nextErrors[`room-rent-${i}`] = 'Enter a monthly rent greater than ₹0';
        }
        if (!Number.isFinite(r.deposit) || r.deposit < 0) {
          nextErrors[`room-deposit-${i}`] = 'Deposit must be ₹0 or more';
        }
        if (r.extraCharges.some((charge) => !Number.isFinite(charge.amount) || charge.amount < 0)) {
          nextErrors[`room-charge-${i}`] = 'Extra charges must be ₹0 or more';
        }
      });
    }
    if (targetStep === 4 && images.length === 0) {
      nextErrors.images = 'Upload at least one real photo or pick a suggested photo below to publish';
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const goNext = () => {
    if (!validateStep(step)) return;
    setStep((s) => Math.min(5, s + 1));
  };

  const goBack = () => setStep((s) => Math.max(1, s - 1));

  const buildHostel = (targetStatus: ListingStatus): Hostel => {
    const hostelId = existing?.id || `h-${Date.now()}`;
    const validPhotos = images.filter(Boolean);
    const finalImages = validPhotos.length ? validPhotos : [SUGGESTED_SAMPLE_PHOTOS[0].src];
    const safeCoverIdx = coverIndex >= 0 && coverIndex < finalImages.length ? coverIndex : 0;
    const cover = finalImages[safeCoverIdx];
    const orderedImages = [cover, ...finalImages.filter((src, idx) => idx !== safeCoverIdx)];
    const realUploaded = hasRealUploadedPhotos(orderedImages);

    const parsedCoords = validateOwnerCoordinates(latitude, longitude);
    const finalLat = parsedCoords.valid && !parsedCoords.empty ? parsedCoords.latitude : undefined;
    const finalLng = parsedCoords.valid && !parsedCoords.empty ? parsedCoords.longitude : undefined;

    const unchangedSeedLocation =
      existing &&
      String(finalLat ?? '') === String(existing.latitude ?? '') &&
      String(finalLng ?? '') === String(existing.longitude ?? '') &&
      address.trim() === existing.address;

    const cleanPhone = contactPhone.trim();
    const cleanEmail = contactEmail.trim();
    const contactObj =
      cleanPhone || cleanEmail
        ? {
            ...(cleanPhone ? { phone: cleanPhone } : {}),
            ...(cleanEmail ? { email: cleanEmail } : {}),
          }
        : existing?.contact;

    return {
      ...existing,
      id: hostelId,
      ownerId: user.id,
      name: name.trim() || 'Untitled Hostel',
      description: description.trim() || 'Well-maintained student accommodation in Kota.',
      locality,
      address: address.trim(),
      landmark: landmark.trim() || undefined,
      latitude: finalLat,
      longitude: finalLng,
      location: unchangedSeedLocation ? existing.location : { status: 'owner-provided' },
      contact: contactObj,
      category,
      status: targetStatus,
      amenities,
      houseRules: rules
        .split(/\n/)
        .map((rule) => rule.trim())
        .filter(Boolean),
      electricityPolicy: electricity.trim(),
      extraChargesNote: extraChargesNote.trim(),
      refundPolicy: refundPolicy.trim() || existing?.refundPolicy,
      photography: realUploaded ? 'property' : 'illustrative',
      photoCaptions: Object.keys(photoCaptions).length ? photoCaptions : existing?.photoCaptions,
      coverImage: cover,
      images: orderedImages,
      roomTypes: rooms.map((r, i) => ({
        ...r,
        id: r.id || `rt-${hostelId}-${i}`,
        hostelId,
        rent: Number.isFinite(r.rent) ? r.rent : 0,
        deposit: Number.isFinite(r.deposit) ? r.deposit : defaultDeposit,
      })),
      createdAt: existing?.createdAt || new Date().toISOString().slice(0, 10),
      updatedAt: new Date().toISOString().slice(0, 10),
    };
  };

  const saveDraft = () => {
    if (saving) return;
    if (!coordinateStatus.valid && coordinateStatus.error) {
      setErrors((prev) => ({ ...prev, coordinates: coordinateStatus.error! }));
      setStep(1);
      return;
    }
    setSaving(true);
    const savedAt = new Date().toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    });
    const draftHostel = buildHostel('draft');
    if (existing) updateHostel(draftHostel);
    else addHostel(draftHostel);
    setSaving(false);
    setDirty(false);
    setLastSaved(savedAt);
    if (!isEdit) {
      navigate(`/owner/listing/${draftHostel.id}/edit`, {
        replace: true,
        state: { step, savedAt } satisfies WizardNavState,
      });
    }
  };

  const finishListing = (mode: 'approved' | 'pending') => {
    if (saving) return;
    for (const requiredStep of [1, 2, 4]) {
      if (!validateStep(requiredStep)) {
        setStep(requiredStep);
        return;
      }
    }
    setSaving(true);
    const built = buildHostel(mode);
    if (existing) updateHostel(built);
    else addHostel(built);
    setSaving(false);
    setDirty(false);
    navigate(
      mode === 'approved'
        ? `/owner?published=${encodeURIComponent(built.id)}`
        : `/owner?submitted=${encodeURIComponent(built.id)}`,
    );
  };

  const updateRoom = (idx: number, patch: Partial<RoomType>) => {
    setRooms((rs) => rs.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
    markDirty();
  };

  const previewCover = images[coverIndex] || images[0] || SUGGESTED_SAMPLE_PHOTOS[0].src;
  const lowestMonthly = useMemo(() => {
    const valid = rooms.filter((r) => r.rent > 0).map(monthlyTotal);
    return valid.length ? Math.min(...valid) : monthlyTotal(rooms[0] || emptyRoom());
  }, [rooms]);

  return (
    <div className="owner-wizard animate-fade-in">
      <div className="owner-wizard-shell">
        <nav className="owner-wizard-breadcrumb" aria-label="Wizard breadcrumb">
          <Link to="/owner">
            <ArrowLeft size={14} /> Owner dashboard
          </Link>
          <span>/</span>
          <span>{isEdit ? `Edit · ${existing?.name || 'Hostel'}` : 'Add new hostel'}</span>
        </nav>

        <header className="owner-wizard-header">
          <div>
            <p className="owner-eyebrow">HOSTEL LISTING STUDIO</p>
            <h1 className="owner-wizard-heading">
              {isEdit ? 'Update your hostel listing' : 'List & publish your hostel'}
            </h1>
            <p className="owner-wizard-sub">
              Auto-detect GPS coordinates in one click, upload real property photos, set clear
              student pricing, and publish directly to StayKota.
            </p>
          </div>
          <div className="owner-wizard-status-pill">
            <span className={lastSaved ? 'is-saved' : ''}>
              {lastSaved
                ? `Saved at ${lastSaved}`
                : existing?.status === 'approved'
                  ? 'Currently Live · Editing'
                  : 'Unsaved changes'}
            </span>
          </div>
        </header>

        <nav className="owner-wizard-steps" aria-label="Listing steps">
          {STEPS.map((s) => {
            const completed = step > s.id;
            const active = step === s.id;
            return (
              <button
                key={s.id}
                type="button"
                aria-current={active ? 'step' : undefined}
                className={completed ? 'is-complete' : undefined}
                onClick={() => {
                  if (isEdit || s.id < step || validateStep(step)) {
                    setStep(s.id);
                  }
                }}
              >
                <span>{completed ? <Check size={14} /> : s.id}</span>
                <strong>{s.label}</strong>
              </button>
            );
          })}
        </nav>

        <div className="owner-wizard-grid">
          <div className="owner-wizard-main">
            {step === 1 && (
              <section className="wizard-panel animate-fade-in">
                <div className="wizard-panel-head">
                  <div>
                    <span className="owner-eyebrow">STEP 1 OF 5</span>
                    <h2>Basic information &amp; entrance location</h2>
                  </div>
                </div>

                <div className="wizard-field-group">
                  <div className="wizard-field">
                    <label htmlFor="hostel-name">Hostel / PG name *</label>
                    <input
                      id="hostel-name"
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                        markDirty();
                      }}
                      className={errors.name ? 'has-error' : undefined}
                      placeholder="e.g. Shree Residency Boys Hostel"
                    />
                    {errors.name && (
                      <p className="wizard-field-error" role="alert">
                        {errors.name}
                      </p>
                    )}
                  </div>

                  <div className="wizard-two-col">
                    <div className="wizard-field">
                      <label htmlFor="hostel-category">Student category *</label>
                      <select
                        id="hostel-category"
                        value={category}
                        onChange={(e) => {
                          setCategory(e.target.value as typeof category);
                          markDirty();
                        }}
                      >
                        <option value="boys">Boys hostel / PG</option>
                        <option value="girls">Girls hostel / PG</option>
                        <option value="co-ed">Co-ed stay (separate floors/wings)</option>
                      </select>
                    </div>

                    <div className="wizard-field">
                      <label htmlFor="hostel-locality">Kota locality *</label>
                      <select
                        id="hostel-locality"
                        value={locality}
                        onChange={(e) => {
                          setLocality(e.target.value);
                          markDirty();
                        }}
                        className={errors.locality ? 'has-error' : undefined}
                      >
                        {LOCALITIES.map((l) => (
                          <option key={l} value={l}>
                            {l}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="wizard-two-col">
                    <div className="wizard-field">
                      <label htmlFor="hostel-address">Full street address *</label>
                      <input
                        id="hostel-address"
                        value={address}
                        onChange={(e) => {
                          setAddress(e.target.value);
                          markDirty();
                        }}
                        className={errors.address ? 'has-error' : undefined}
                        placeholder="Plot / House No., Street, Area, Kota"
                      />
                      {errors.address && (
                        <p className="wizard-field-error" role="alert">
                          {errors.address}
                        </p>
                      )}
                    </div>

                    <div className="wizard-field">
                      <label htmlFor="hostel-landmark">Nearby coaching / landmark</label>
                      <input
                        id="hostel-landmark"
                        value={landmark}
                        onChange={(e) => {
                          setLandmark(e.target.value);
                          markDirty();
                        }}
                        placeholder="e.g. 200m from ALLEN Samyak / Sangyan"
                      />
                    </div>
                  </div>

                  <fieldset className="listing-coordinates">
                    <legend>Hostel entrance GPS coordinates</legend>
                    <div className="listing-coordinates-header">
                      <p>
                        Click <strong>Use my current location</strong> to automatically fill your exact
                        latitude &amp; longitude in one click, or enter coordinates manually.
                      </p>
                      <div className="listing-coordinates-btns">
                        <button
                          type="button"
                          className="listing-locate-btn"
                          onClick={() => void handleUseMyCurrentLocation()}
                          disabled={locating}
                        >
                          {locating ? (
                            <>
                              <Loader2 size={15} className="animate-spin" /> Fetching GPS…
                            </>
                          ) : (
                            <>
                              <LocateFixed size={15} /> Use my current location
                            </>
                          )}
                        </button>
                        {(latitude || longitude) && (
                          <button
                            type="button"
                            className="listing-clear-coords-btn"
                            onClick={() => {
                              setLatitude('');
                              setLongitude('');
                              setLocationMessage('');
                              setErrors((prev) => {
                                const next = { ...prev };
                                delete next.coordinates;
                                return next;
                              });
                              markDirty();
                            }}
                          >
                            Clear
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="listing-coordinates-inputs">
                      <label>
                        Latitude
                        <input
                          aria-label="Hostel latitude"
                          type="number"
                          step="any"
                          value={latitude}
                          placeholder="e.g. 25.148120"
                          onChange={(e) => {
                            setLatitude(e.target.value);
                            setLocationMessage('');
                            markDirty();
                          }}
                        />
                      </label>
                      <label>
                        Longitude
                        <input
                          aria-label="Hostel longitude"
                          type="number"
                          step="any"
                          value={longitude}
                          placeholder="e.g. 75.852340"
                          onChange={(e) => {
                            setLongitude(e.target.value);
                            setLocationMessage('');
                            markDirty();
                          }}
                        />
                      </label>
                    </div>

                    {locationMessage && (
                      <p className="listing-location-success" role="status">
                        <CheckCircle2 size={15} /> {locationMessage}
                      </p>
                    )}

                    {coordinateStatus.valid && !coordinateStatus.empty && (
                      <div className="listing-coordinates-links">
                        <a
                          href={`https://www.openstreetmap.org/?mlat=${coordinateStatus.latitude}&mlon=${coordinateStatus.longitude}#map=18/${coordinateStatus.latitude}/${coordinateStatus.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <MapPin size={13} /> Verify exact pin on OpenStreetMap ↗
                        </a>
                        {coordinateStatus.outsideKota && (
                          <span className="listing-outside-badge">
                            Saved exact coordinates (outside Kota map bounds)
                          </span>
                        )}
                      </div>
                    )}

                    {errors.coordinates && (
                      <div className="listing-coordinates-alert">
                        <p role="alert">{errors.coordinates}</p>
                        {coordinateStatus.swapped && (
                          <button
                            type="button"
                            className="listing-swap-btn"
                            onClick={handleSwapCoordinates}
                          >
                            <ArrowLeftRight size={13} /> Swap latitude ↔ longitude
                          </button>
                        )}
                      </div>
                    )}
                  </fieldset>

                  <div className="wizard-two-col">
                    <div className="wizard-field">
                      <label htmlFor="hostel-phone">Owner contact phone (for students)</label>
                      <input
                        id="hostel-phone"
                        type="tel"
                        value={contactPhone}
                        onChange={(e) => {
                          setContactPhone(e.target.value);
                          markDirty();
                        }}
                        className={errors.contactPhone ? 'has-error' : undefined}
                        placeholder="+91 98765 43210"
                      />
                      {errors.contactPhone && (
                        <p className="wizard-field-error" role="alert">
                          {errors.contactPhone}
                        </p>
                      )}
                    </div>

                    <div className="wizard-field">
                      <label htmlFor="hostel-email">Contact email (optional)</label>
                      <input
                        id="hostel-email"
                        type="email"
                        value={contactEmail}
                        onChange={(e) => {
                          setContactEmail(e.target.value);
                          markDirty();
                        }}
                        className={errors.contactEmail ? 'has-error' : undefined}
                        placeholder="owner@yourhostel.in"
                      />
                      {errors.contactEmail && (
                        <p className="wizard-field-error" role="alert">
                          {errors.contactEmail}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="wizard-field">
                    <label htmlFor="hostel-description">About your hostel</label>
                    <textarea
                      id="hostel-description"
                      value={description}
                      onChange={(e) => {
                        setDescription(e.target.value);
                        markDirty();
                      }}
                      rows={4}
                      placeholder="Describe room ventilation, homestyle mess food, study environment, walking distance to coaching institutes, warden support…"
                    />
                  </div>
                </div>
              </section>
            )}

            {step === 2 && (
              <section className="wizard-panel animate-fade-in">
                <div className="wizard-panel-head">
                  <div>
                    <span className="owner-eyebrow">STEP 2 OF 5</span>
                    <h2>Room types &amp; transparent monthly pricing</h2>
                    <p>
                      All amounts are per student per month. Keep monthly rent &amp; mandatory mess
                      clear and separate from refundable security deposits.
                    </p>
                  </div>
                </div>

                {errors.rooms && (
                  <p className="wizard-field-error" role="alert">
                    {errors.rooms}
                  </p>
                )}

                <div className="wizard-rooms-list">
                  {rooms.map((r, idx) => {
                    const mandatoryMess =
                      r.extraCharges.find(
                        (charge) => /mess/i.test(charge.name) && !charge.optional,
                      )?.amount || 0;

                    return (
                      <div key={r.id} className="wizard-room-card">
                        <div className="wizard-room-card-top">
                          <div className="wizard-room-title-wrap">
                            <label htmlFor={'room-name-' + idx}>
                              Room option {idx + 1} title *
                            </label>
                            <input
                              id={'room-name-' + idx}
                              value={r.name}
                              onChange={(e) => updateRoom(idx, { name: e.target.value })}
                              placeholder="e.g. Double Sharing AC with Study Desk"
                            />
                          </div>
                          <div className="wizard-room-top-btns">
                            <button
                              type="button"
                              className="wizard-icon-pill"
                              title="Duplicate room option"
                              onClick={() => {
                                const copy: RoomType = {
                                  ...r,
                                  id: `rt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                                  name: `${r.name} (Copy)`,
                                  extraCharges: [...r.extraCharges],
                                  included: [...r.included],
                                  features: [...r.features],
                                };
                                setRooms((prev) => [...prev, copy]);
                                markDirty();
                              }}
                            >
                              <Copy size={13} /> Duplicate
                            </button>
                            {rooms.length > 1 && (
                              <button
                                type="button"
                                onClick={() => {
                                  setRooms((rs) => rs.filter((_, i) => i !== idx));
                                  markDirty();
                                }}
                                aria-label={'Remove room type ' + (idx + 1)}
                                className="wizard-icon-pill is-danger"
                              >
                                <Trash2 size={13} />
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="wizard-room-fields">
                          <label htmlFor={'room-sharing-' + idx}>
                            Sharing capacity
                            <select
                              id={'room-sharing-' + idx}
                              value={r.sharingType}
                              onChange={(e) => {
                                const v = e.target.value as SharingType;
                                updateRoom(idx, {
                                  sharingType: v,
                                  capacity:
                                    v === 'single' ? 1 : v === 'double' ? 2 : v === 'triple' ? 3 : 4,
                                });
                              }}
                            >
                              <option value="single">Single occupancy (1 student)</option>
                              <option value="double">Double sharing (2 students)</option>
                              <option value="triple">Triple sharing (3 students)</option>
                              <option value="four">Four sharing (4 students)</option>
                            </select>
                          </label>

                          <label htmlFor={'room-bathroom-' + idx}>
                            Washroom type
                            <select
                              id={'room-bathroom-' + idx}
                              value={
                                r.features.some((feature) => /attached/i.test(feature))
                                  ? 'attached'
                                  : 'shared'
                              }
                              onChange={(e) =>
                                updateRoom(idx, {
                                  features: [
                                    ...r.features.filter((feature) => !/bath|toilet/i.test(feature)),
                                    e.target.value === 'attached'
                                      ? 'Attached bathroom'
                                      : 'Shared bathroom',
                                  ],
                                })
                              }
                            >
                              <option value="attached">Attached washroom</option>
                              <option value="shared">Common / shared washroom</option>
                            </select>
                          </label>

                          <label htmlFor={'room-rent-' + idx}>
                            Monthly room rent (₹) *
                            <input
                              id={'room-rent-' + idx}
                              type="number"
                              min={0}
                              step={100}
                              value={r.rent === 0 ? '' : r.rent}
                              placeholder="6500"
                              onChange={(e) =>
                                updateRoom(idx, {
                                  rent: e.target.value === '' ? 0 : Number(e.target.value),
                                })
                              }
                            />
                          </label>

                          <label htmlFor={'room-mess-' + idx}>
                            Mandatory mess / food (₹ / mo)
                            <input
                              id={'room-mess-' + idx}
                              type="number"
                              min={0}
                              step={100}
                              value={mandatoryMess === 0 ? '' : mandatoryMess}
                              placeholder="0 if included in rent"
                              onChange={(e) => {
                                const amount = e.target.value === '' ? 0 : Number(e.target.value);
                                updateRoom(idx, {
                                  extraCharges: [
                                    ...r.extraCharges.filter(
                                      (charge) => !(/mess/i.test(charge.name) && !charge.optional),
                                    ),
                                    ...(amount > 0
                                      ? [{ name: 'Mess', amount, optional: false }]
                                      : []),
                                  ],
                                });
                              }}
                            />
                          </label>

                          <label htmlFor={'room-deposit-' + idx}>
                            Refundable security deposit (₹)
                            <input
                              id={'room-deposit-' + idx}
                              type="number"
                              min={0}
                              step={500}
                              value={r.deposit === 0 ? '' : r.deposit}
                              placeholder="5000"
                              onChange={(e) =>
                                updateRoom(idx, {
                                  deposit: e.target.value === '' ? 0 : Number(e.target.value),
                                })
                              }
                            />
                          </label>

                          <label htmlFor={'room-ac-' + idx}>
                            Cooling / AC
                            <select
                              id={'room-ac-' + idx}
                              value={
                                r.features.includes('AC') || r.included.includes('AC')
                                  ? 'yes'
                                  : 'no'
                              }
                              onChange={(e) =>
                                updateRoom(idx, {
                                  features: [
                                    ...r.features.filter((feature) => feature !== 'AC'),
                                    ...(e.target.value === 'yes' ? ['AC'] : []),
                                  ],
                                  included:
                                    e.target.value === 'no'
                                      ? r.included.filter((item) => item !== 'AC')
                                      : r.included,
                                })
                              }
                            >
                              <option value="no">Non-AC / Air cooled</option>
                              <option value="yes">Air Conditioned (AC)</option>
                            </select>
                          </label>
                        </div>

                        <div className="wizard-inclusions">
                          <span>Included in monthly rent:</span>
                          <div className="wizard-chip-row">
                            {ROOM_INCLUSIONS.map((inc) => {
                              const active = r.included.includes(inc);
                              return (
                                <button
                                  key={inc}
                                  type="button"
                                  className={`wizard-chip${active ? ' is-on' : ''}`}
                                  onClick={() =>
                                    updateRoom(idx, {
                                      included: active
                                        ? r.included.filter((item) => item !== inc)
                                        : [...r.included, inc],
                                    })
                                  }
                                >
                                  {active && <Check size={12} />} {inc}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        <div className="wizard-price-total">
                          <div>
                            <span>Student fixed monthly total</span>
                            <small>
                              + ₹{r.deposit.toLocaleString('en-IN')} refundable one-time deposit
                            </small>
                          </div>
                          <strong>₹{monthlyTotal(r).toLocaleString('en-IN')}/mo</strong>
                        </div>

                        <label className="wizard-checkbox-row">
                          <input
                            type="checkbox"
                            checked={r.available}
                            onChange={(e) => updateRoom(idx, { available: e.target.checked })}
                          />
                          <span>Currently available for student enquiries &amp; visits</span>
                        </label>

                        {(errors['room-name-' + idx] ||
                          errors['room-rent-' + idx] ||
                          errors['room-deposit-' + idx] ||
                          errors['room-charge-' + idx]) && (
                          <p className="wizard-field-error" role="alert">
                            {errors['room-name-' + idx] ||
                              errors['room-rent-' + idx] ||
                              errors['room-deposit-' + idx] ||
                              errors['room-charge-' + idx]}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setRooms((rs) => [...rs, emptyRoom(defaultDeposit)]);
                    markDirty();
                  }}
                  className="wizard-add-room-btn"
                >
                  <Plus size={18} /> Add another room option
                </button>

                <div className="wizard-two-col">
                  <div className="wizard-field">
                    <label htmlFor="electricity-policy">Electricity billing policy</label>
                    <input
                      id="electricity-policy"
                      value={electricity}
                      onChange={(e) => {
                        setElectricity(e.target.value);
                        markDirty();
                      }}
                      placeholder="e.g. Sub-metered at ₹9/unit · shared equally"
                    />
                  </div>
                  <div className="wizard-field">
                    <label htmlFor="default-deposit">Default deposit for new rooms (₹)</label>
                    <input
                      id="default-deposit"
                      type="number"
                      min={0}
                      step={500}
                      value={defaultDeposit}
                      onChange={(e) => {
                        setDefaultDeposit(Number(e.target.value));
                        markDirty();
                      }}
                    />
                  </div>
                </div>

                <div className="wizard-field">
                  <label htmlFor="charges-note">Optional services / seasonal charges note</label>
                  <input
                    id="charges-note"
                    value={extraChargesNote}
                    onChange={(e) => {
                      setExtraChargesNote(e.target.value);
                      markDirty();
                    }}
                    placeholder="e.g. Optional AC ₹1,500/mo · Extra mattress for parents on request"
                  />
                </div>
              </section>
            )}

            {step === 3 && (
              <section className="wizard-panel animate-fade-in">
                <div className="wizard-panel-head">
                  <div>
                    <span className="owner-eyebrow">STEP 3 OF 5</span>
                    <h2>Amenities, house rules &amp; refund terms</h2>
                    <p>Highlight the facilities students can count on every single day.</p>
                  </div>
                </div>

                <div className="wizard-field">
                  <label>Hostel amenities ({amenities.length} selected)</label>
                  <div className="wizard-amenities-grid">
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
                          className={`wizard-amenity-btn${on ? ' is-selected' : ''}`}
                        >
                          <span className="wizard-amenity-check">
                            {on ? <Check size={13} /> : <Plus size={13} />}
                          </span>
                          <span>{a}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="wizard-field">
                  <label htmlFor="house-rules">House rules (one per line)</label>
                  <div className="wizard-chip-row wizard-rule-presets">
                    {RULE_SUGGESTIONS.map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        className="wizard-chip"
                        onClick={() => {
                          if (!rules.includes(preset)) {
                            setRules((prev) => (prev.trim() ? `${prev.trim()}\n${preset}` : preset));
                            markDirty();
                          }
                        }}
                      >
                        + {preset.slice(0, 38)}…
                      </button>
                    ))}
                  </div>
                  <textarea
                    id="house-rules"
                    value={rules}
                    onChange={(e) => {
                      setRules(e.target.value);
                      markDirty();
                    }}
                    rows={5}
                    placeholder="Enter gate timings, visitor rules, study quiet hours, and notice period…"
                  />
                </div>

                <div className="wizard-field">
                  <label htmlFor="refund-policy">Deposit refund &amp; notice policy</label>
                  <input
                    id="refund-policy"
                    value={refundPolicy}
                    onChange={(e) => {
                      setRefundPolicy(e.target.value);
                      markDirty();
                    }}
                    placeholder="e.g. 100% security deposit refunded within 7 days of vacating with 1-month notice"
                  />
                </div>
              </section>
            )}

            {step === 4 && (
              <section className="wizard-panel animate-fade-in">
                <div className="wizard-panel-head">
                  <div>
                    <span className="owner-eyebrow">STEP 4 OF 5</span>
                    <h2>Upload hostel photos</h2>
                    <p>
                      Upload real photos of your bedrooms, study desks, washrooms, mess dining area,
                      and building front — or add from suggested sample photos below while testing.
                    </p>
                  </div>
                </div>

                <input
                  ref={fileInputRef}
                  id="hostel-photo-upload"
                  type="file"
                  accept="image/*"
                  multiple
                  className="sr-only"
                  onChange={(e) => {
                    if (e.target.files?.length) {
                      void handleFilesSelected(e.target.files);
                    }
                  }}
                />

                <div
                  className={`wizard-upload-dropzone${dragActive ? ' is-dragging' : ''}`}
                  onDragEnter={(e) => {
                    e.preventDefault();
                    setDragActive(true);
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragActive(true);
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
                      setDragActive(false);
                    }
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragActive(false);
                    if (e.dataTransfer.files?.length) {
                      void handleFilesSelected(e.dataTransfer.files);
                    }
                  }}
                >
                  <div className="wizard-upload-icon">
                    {uploading ? <Loader2 size={26} className="animate-spin" /> : <Upload size={26} />}
                  </div>
                  <strong>
                    {uploading
                      ? 'Optimizing & adding your photos…'
                      : 'Upload real photos from your phone or computer'}
                  </strong>
                  <p>
                    Drag &amp; drop one or multiple images here, or browse files (JPG, PNG, WebP).
                  </p>
                  <button
                    type="button"
                    className="owner-primary"
                    disabled={uploading}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <ImagePlus size={16} /> Select photos from device
                  </button>
                </div>

                {photoFeedback && (
                  <p className="listing-location-success" role="status">
                    <CheckCircle2 size={15} /> {photoFeedback}
                  </p>
                )}

                {errors.images && (
                  <p className="wizard-field-error" role="alert">
                    {errors.images}
                  </p>
                )}

                {images.length > 0 && (
                  <div className="wizard-collected-section">
                    <div className="wizard-collected-head">
                      <h3>Your hostel gallery ({images.length})</h3>
                      <span>First / Cover photo appears on search cards &amp; Kota map</span>
                    </div>
                    <div className="wizard-photo-grid">
                      {images.map((src, i) => {
                        const isSample = isSamplePhoto(src);
                        const isCover = coverIndex === i;
                        return (
                          <div
                            key={`${src.slice(0, 32)}-${i}`}
                            className={`wizard-photo-card${isCover ? ' is-cover' : ''}`}
                          >
                            <div className="wizard-photo-thumb">
                              <img src={src} alt={`Hostel photograph ${i + 1}`} />
                              <span className={`wizard-photo-badge${isCover ? ' is-cover' : ''}`}>
                                {isCover ? '★ Cover photo' : isSample ? 'Sample' : 'Real photo'}
                              </span>
                              <button
                                type="button"
                                aria-label={'Remove photo ' + (i + 1)}
                                className="wizard-photo-delete"
                                onClick={() => removePhotoAt(i)}
                              >
                                <X size={14} />
                              </button>
                            </div>
                            <div className="wizard-photo-meta">
                              <input
                                type="text"
                                aria-label={`Caption for photo ${i + 1}`}
                                value={photoCaptions[src] || ''}
                                onChange={(e) => {
                                  setPhotoCaptions((prev) => ({
                                    ...prev,
                                    [src]: e.target.value,
                                  }));
                                  markDirty();
                                }}
                                placeholder="Add label (e.g. Double room)"
                              />
                              <div className="wizard-photo-card-btns">
                                <button
                                  type="button"
                                  disabled={isCover}
                                  onClick={() => {
                                    setCoverIndex(i);
                                    markDirty();
                                  }}
                                >
                                  {isCover ? 'Active cover' : 'Set as cover'}
                                </button>
                                <div>
                                  <button
                                    type="button"
                                    disabled={i === 0}
                                    aria-label={`Move photo ${i + 1} earlier`}
                                    onClick={() => movePhoto(i, -1)}
                                  >
                                    ←
                                  </button>
                                  <button
                                    type="button"
                                    disabled={i === images.length - 1}
                                    aria-label={`Move photo ${i + 1} later`}
                                    onClick={() => movePhoto(i, 1)}
                                  >
                                    →
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="wizard-suggestions-box">
                  <div className="wizard-suggestions-head">
                    <div>
                      <span className="owner-eyebrow">SUGGESTED DEMO PHOTOS (FOR QUICK TESTING)</span>
                      <h3>Quick-add sample hostel photos</h3>
                      <p>
                        Don’t have room photos handy right now? Pick any sample photo below to
                        preview how your listing looks — you can replace them with real photos anytime.
                      </p>
                    </div>
                    <button
                      type="button"
                      className="owner-secondary"
                      onClick={addAllSuggestedPhotos}
                    >
                      <Sparkles size={14} /> Add all 3 suggestions
                    </button>
                  </div>

                  <div className="wizard-suggestions-grid">
                    {SUGGESTED_SAMPLE_PHOTOS.map((sample) => {
                      const added = images.includes(sample.src);
                      return (
                        <button
                          key={sample.src}
                          type="button"
                          className={`wizard-suggestion-card${added ? ' is-added' : ''}`}
                          onClick={() => addSuggestedSamplePhoto(sample.src, sample.caption)}
                        >
                          <img src={sample.src} alt={sample.label} />
                          <div>
                            <strong>{sample.label}</strong>
                            <span>{added ? '✓ Added to gallery' : '+ Click to add'}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </section>
            )}

            {step === 5 && (
              <section className="wizard-panel animate-fade-in">
                <div className="wizard-panel-head">
                  <div>
                    <span className="owner-eyebrow">STEP 5 OF 5</span>
                    <h2>Review &amp; publish your hostel</h2>
                    <p>
                      Double-check your rooms, GPS coordinates, and photos below, then publish live
                      immediately or save as a draft.
                    </p>
                  </div>
                </div>

                <div className="wizard-review-hero">
                  <img src={previewCover} alt="" />
                  <div>
                    <span className="owner-category-chip">
                      {category === 'girls'
                        ? 'Girls hostel'
                        : category === 'co-ed'
                          ? 'Co-ed stay'
                          : 'Boys hostel'}
                    </span>
                    <h3>{name || 'Untitled Hostel'}</h3>
                    <p>
                      <MapPin size={14} /> {locality}, Kota · {address || 'Address pending'}
                      {landmark ? ` (${landmark})` : ''}
                    </p>
                    <p className="wizard-review-submeta">
                      {rooms.length} room {rooms.length === 1 ? 'option' : 'options'} ·{' '}
                      {amenities.length} amenities · {images.length}{' '}
                      {images.length === 1 ? 'photo' : 'photos'}{' '}
                      {hasRealUploadedPhotos(images) ? '(includes real property photos)' : '(sample photos)'}
                    </p>
                    {coordinateStatus.valid && !coordinateStatus.empty ? (
                      <p className="wizard-review-gps is-set">
                        <LocateFixed size={13} /> GPS pin set: {coordinateStatus.latitude},{' '}
                        {coordinateStatus.longitude}
                      </p>
                    ) : (
                      <p className="wizard-review-gps">
                        <AlertCircle size={13} /> No GPS coordinates set yet (listing will appear in
                        Explore list, not as a pin on the map until GPS is set)
                      </p>
                    )}
                  </div>
                </div>

                <div className="wizard-review-table">
                  {rooms.map((r) => (
                    <div key={r.id} className="wizard-review-row">
                      <div>
                        <strong>{r.name}</strong>
                        <span>
                          {r.sharingType} sharing · {r.available ? 'Available' : 'Full'}
                        </span>
                      </div>
                      <div className="wizard-review-price">
                        <strong>₹{monthlyTotal(r).toLocaleString('en-IN')}/mo</strong>
                        <small>Deposit ₹{r.deposit.toLocaleString('en-IN')}</small>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="wizard-review-policies">
                  <p>
                    <b>Electricity:</b> {electricity || 'Not specified'}
                  </p>
                  {extraChargesNote && (
                    <p>
                      <b>Optional charges:</b> {extraChargesNote}
                    </p>
                  )}
                  {refundPolicy && (
                    <p>
                      <b>Refund policy:</b> {refundPolicy}
                    </p>
                  )}
                  {contactPhone && (
                    <p>
                      <b>Student enquiry phone:</b> {contactPhone}
                    </p>
                  )}
                </div>

                <div className="wizard-publish-callout">
                  <Rocket size={19} />
                  <div>
                    <strong>Ready to go live on StayKota?</strong>
                    <p>
                      Click <strong>Publish hostel now</strong> below to make this listing
                      immediately discoverable on <b>Explore Hostels</b> and <b>Explore Kota Map</b>,
                      or choose <b>Submit for review</b> to test the admin moderation queue.
                    </p>
                  </div>
                </div>
              </section>
            )}

            <div className="wizard-footer-bar">
              {step > 1 ? (
                <Button variant="outline" onClick={goBack}>
                  <ChevronLeft className="w-4 h-4" /> Previous
                </Button>
              ) : (
                <Link to="/owner">
                  <Button variant="outline">
                    <ChevronLeft className="w-4 h-4" /> Dashboard
                  </Button>
                </Link>
              )}

              <div className="wizard-footer-spacer" />

              <Button variant="outline" loading={saving} onClick={saveDraft}>
                Save draft
              </Button>

              {step < 5 ? (
                <Button onClick={goNext}>
                  Continue <ChevronRight className="w-4 h-4" />
                </Button>
              ) : (
                <>
                  <Button
                    variant="secondary"
                    loading={saving}
                    onClick={() => finishListing('pending')}
                  >
                    Submit for review
                  </Button>
                  <Button loading={saving} onClick={() => finishListing('approved')}>
                    <Rocket className="w-4 h-4" />{' '}
                    {existing?.status === 'approved' ? 'Save & keep published' : 'Publish hostel now'}
                  </Button>
                </>
              )}
            </div>
          </div>

          <aside className="owner-wizard-sidebar">
            <div className="wizard-live-preview-card">
              <p className="owner-eyebrow">STUDENT CARD PREVIEW</p>
              <div className="wizard-preview-photo">
                <img src={previewCover} alt="" />
                <span>
                  {images.length > 0
                    ? `${images.length} ${images.length === 1 ? 'photo' : 'photos'}`
                    : 'Sample preview'}
                </span>
              </div>
              <div className="wizard-preview-body">
                <h4>{name.trim() || 'Your Hostel Name'}</h4>
                <p>
                  <MapPin size={13} /> {locality}, Kota
                </p>
                <div className="wizard-preview-price">
                  <strong>₹{lowestMonthly.toLocaleString('en-IN')}</strong>
                  <span>/ student / month</span>
                </div>
              </div>

              <hr />

              <div className="wizard-strength">
                <div className="wizard-strength-row">
                  <strong>Listing readiness</strong>
                  <span>{strength}%</span>
                </div>
                <div className="wizard-strength-bar">
                  <div style={{ width: `${strength}%` }} />
                </div>
                <ul className="wizard-checklist">
                  {checklist.map((item) => (
                    <li key={item.label} className={item.done ? 'is-done' : undefined}>
                      <Check size={13} />
                      <span>{item.label}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
