import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ArrowUpRight, Check, MapPin, Scale, Share2, Sparkles, X } from 'lucide-react';
import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useCompare } from '../context/CompareContext';
import { CAMPUSES } from '../data/campuses';
import { distanceKm, formatDistance, getCampus, getMatchingRooms, monthlyTotal } from '../lib/discovery';
import { CustomSelect } from '../components/ui/CustomSelect';
import { KotaHorizon3DCanvas } from '../components/three/KotaHorizon3DCanvas';
import { KotaShortlist3DCanvas } from '../components/three/KotaShortlist3DCanvas';
import { KotaBeacon3DCanvas } from '../components/three/KotaBeacon3DCanvas';
import type { Hostel, RoomType } from '../types';
import '../styles/compare.css';

export function ComparePage() {
  const { hostels } = useApp();
  const { comparisonIds, toggleCompare, isCompared, clearComparison } = useCompare();
  const [params, setParams] = useSearchParams();
  const [notice, setNotice] = useState('');
  const campus = getCampus(params.get('campus'));
  const ids = params.has('ids')
    ? [...new Set((params.get('ids') || '').split(','))].slice(0, 3)
    : comparisonIds;
  const selected = ids
    .map((id) => hostels.find((h) => h.id === id && h.status === 'approved'))
    .filter((h): h is Hostel => !!h);

  const number = (key: string) => {
    const v = params.get(key);
    return v !== null && v.trim() !== '' && Number.isFinite(Number(v)) && Number(v) >= 0
      ? Number(v)
      : undefined;
  };

  const rows = selected.map((hostel) => {
    const explicit = params.get(`room_${hostel.id}`);
    const room = explicit
      ? hostel.roomTypes.find((r) => r.id === explicit && r.available)
      : getMatchingRooms(hostel, {
          sharing: params.get('sharing') || '',
          minBudget: number('minBudget'),
          maxBudget: number('maxBudget'),
        })[0];
    return { hostel, room };
  });

  const update = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    next.set(key, value);
    setParams(next, { replace: true });
  };

  const remove = (id: string) => {
    if (isCompared(id)) toggleCompare(id);
    const next = new URLSearchParams(params);
    next.set(
      'ids',
      selected
        .filter((h) => h.id !== id)
        .map((h) => h.id)
        .join(','),
    );
    setParams(next, { replace: true });
  };

  const share = async () => {
    const next = new URLSearchParams(params);
    next.set('ids', selected.map((h) => h.id).join(','));
    const url = `${window.location.origin}/compare?${next}`;
    try {
      await navigator.clipboard.writeText(url);
      setNotice('Shortlist link copied. Only public listing and room IDs are shared.');
    } catch {
      setParams(next, { replace: true });
      setNotice('Copy the address from your browser to share this shortlist.');
    }
  };

  const features: { label: string; value: (hostel: Hostel, room?: RoomType) => string }[] = [
    {
      label: 'Fixed monthly / student',
      value: (_, room) =>
        room ? `₹${monthlyTotal(room).toLocaleString('en-IN')}` : 'Choose an available room',
    },
    {
      label: 'Room rent',
      value: (_, room) => (room ? `₹${room.rent.toLocaleString('en-IN')} / month` : '—'),
    },
    {
      label: 'Mandatory monthly extras',
      value: (_, room) =>
        room
          ? room.extraCharges
              .filter((c) => !c.optional)
              .map((c) => `${c.name}: ₹${c.amount.toLocaleString('en-IN')}`)
              .join(', ') || 'None listed'
          : '—',
    },
    {
      label: 'Refundable deposit',
      value: (_, room) => (room ? `₹${room.deposit.toLocaleString('en-IN')} separately` : '—'),
    },
    {
      label: 'Electricity',
      value: (hostel) => hostel.electricityPolicy || 'Confirm charges with owner',
    },
    {
      label: 'Campus distance',
      value: (hostel) => `${formatDistance(distanceKm(hostel, campus))} · sample straight-line`,
    },
    {
      label: 'Included services',
      value: (_, room) => room?.included.join(', ') || 'Not specified',
    },
    {
      label: 'Room features',
      value: (_, room) => room?.features.join(', ') || 'Not specified',
    },
    {
      label: 'Category',
      value: (hostel) =>
        hostel.category === 'co-ed' ? 'Co-ed' : hostel.category === 'girls' ? 'Girls' : 'Boys',
    },
  ];

  const skylineItems = rows.map(({ hostel, room }) => ({
    id: hostel.id,
    name: hostel.name,
    monthlyRent: room ? monthlyTotal(room) : 0,
    distanceKm: distanceKm(hostel, campus),
  }));

  const bestMonthly = rows
    .filter((entry): entry is { hostel: Hostel; room: RoomType } => Boolean(entry.room))
    .sort((a, b) => monthlyTotal(a.room) - monthlyTotal(b.room))[0];
  const closestStay = rows
    .map((entry) => ({ ...entry, dist: distanceKm(entry.hostel, campus) }))
    .filter((entry): entry is typeof entry & { dist: number } => entry.dist !== null)
    .sort((a, b) => a.dist - b.dist)[0];
  const lowestDeposit = rows
    .filter((entry): entry is { hostel: Hostel; room: RoomType } => Boolean(entry.room))
    .sort((a, b) => a.room.deposit - b.room.deposit)[0];

  return (
    <div className="compare-page">
      <div className="compare-hero-band sk-horizon-wrap">
        <KotaHorizon3DCanvas />
        <div className="compare-shell sk-horizon-content">
          <Link className="compare-back" to={`/explore?campus=${campus.id}`}>
            <ArrowLeft size={15} />
            Back to exploring
          </Link>
          <div className="compare-intro">
            <div>
              <span className="sk-eyebrow">
                <Sparkles size={13} /> A LITTLE CLARITY GOES A LONG WAY
              </span>
              <h1>
                Find your <em>better fit.</em>
              </h1>
              <p>Same campus. Side-by-side costs. A choice that feels right.</p>
            </div>
            {selected.length > 0 && (
              <button type="button" onClick={share}>
                <Share2 size={16} />
                Share shortlist
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="compare-shell">
        <div className="compare-campus">
          <MapPin size={18} />
          <label htmlFor="compare-campus">Comparing around</label>
          <CustomSelect
            id="compare-campus"
            variant="ghost"
            value={campus.id}
            searchPlaceholder="Search coaching campus…"
            options={CAMPUSES.map((c) => ({ value: c.id, label: `${c.institute} · ${c.name}` }))}
            onChange={(next) => update('campus', next)}
          />
          <span>Sample locations · no live availability</span>
        </div>

        {notice && (
          <p className="compare-notice" role="status">
            <Check size={15} />
            {notice}
          </p>
        )}

        {selected.length === 0 ? (
          <div className="compare-empty">
            <div className="compare-empty__scene">
              <KotaBeacon3DCanvas mode="campus" height={220} label="SHORTLIST IN 3D" compact />
            </div>
            <Scale size={32} strokeWidth={1.5} />
            <h2>A shortlist starts with a possibility.</h2>
            <p>
              Add up to three hostels while exploring, then compare their rooms, commute distance and fixed monthly costs side by side here.
            </p>
            <Link className="sk-primary-link" to={`/explore?campus=${campus.id}`}>
              Find your first stay <ArrowUpRight size={16} />
            </Link>
          </div>
        ) : (
          <>
            {selected.length >= 2 && (
              <div className="compare-insights" aria-label="Quick shortlist highlights">
                {bestMonthly && (
                  <div className="compare-insight-pill">
                    <small>LOWEST FIXED MONTHLY</small>
                    <strong>{bestMonthly.hostel.name}</strong>
                    <span>₹{monthlyTotal(bestMonthly.room).toLocaleString('en-IN')}/mo</span>
                  </div>
                )}
                {closestStay && (
                  <div className="compare-insight-pill">
                    <small>CLOSEST TO CAMPUS</small>
                    <strong>{closestStay.hostel.name}</strong>
                    <span>{formatDistance(closestStay.dist)} straight-line</span>
                  </div>
                )}
                {lowestDeposit && (
                  <div className="compare-insight-pill">
                    <small>LOWEST SECURITY DEPOSIT</small>
                    <strong>{lowestDeposit.hostel.name}</strong>
                    <span>₹{lowestDeposit.room.deposit.toLocaleString('en-IN')} refundable</span>
                  </div>
                )}
              </div>
            )}

            <KotaShortlist3DCanvas
              items={skylineItems}
              campusName={`${campus.institute} · ${campus.name}`}
              height={240}
            />

            <p className="compare-hint">
              Choose the room you would actually live in. Deposits and metered charges stay separate.
              {selected.length === 1 && ' Add another hostel to compare.'}
              <span>On small screens, swipe the table sideways.</span>
            </p>

            <div
              className="compare-table-scroll"
              tabIndex={0}
              aria-label="Hostel comparison table, scroll horizontally"
            >
              <table className="compare-table">
                <thead>
                  <tr>
                    <th scope="col">
                      <Scale size={24} />
                      <span>Your options</span>
                      <small>{selected.length} of 3 hostels</small>
                    </th>
                    {rows.map(({ hostel, room }) => (
                      <th key={hostel.id} scope="col">
                        <div className="compare-property">
                          <button
                            type="button"
                            onClick={() => remove(hostel.id)}
                            aria-label={`Remove ${hostel.name}`}
                          >
                            <X size={15} />
                          </button>
                          <img src={hostel.coverImage} alt={hostel.name} loading="lazy" />
                          <Link
                            to={`/hostel/${hostel.id}?campus=${campus.id}${room ? `&room=${room.id}` : ''}`}
                          >
                            {hostel.name}
                            <ArrowUpRight size={14} />
                          </Link>
                          <span>{hostel.locality}, Kota</span>
                          <div className="compare-room-field">
                            <span className="compare-room-label">Room to compare</span>
                            <CustomSelect
                              variant="compact"
                              ariaLabel={`Room at ${hostel.name}`}
                              value={room?.id || ''}
                              disabled={!hostel.roomTypes.some((r) => r.available)}
                              options={[
                                { value: '', label: 'Choose an available room', disabled: true },
                                ...hostel.roomTypes
                                  .filter((r) => r.available)
                                  .map((r) => ({
                                    value: r.id,
                                    label: `${r.name} · ₹${monthlyTotal(r).toLocaleString('en-IN')}`,
                                  })),
                              ]}
                              onChange={(next) => update(`room_${hostel.id}`, next)}
                            />
                          </div>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {features.map((feature) => (
                    <tr key={feature.label}>
                      <th scope="row">{feature.label}</th>
                      {rows.map(({ hostel, room }) => (
                        <td key={hostel.id}>{feature.value(hostel, room)}</td>
                      ))}
                    </tr>
                  ))}
                  <tr>
                    <th scope="row">Take a closer look</th>
                    {rows.map(({ hostel, room }) => (
                      <td key={hostel.id}>
                        <Link
                          className="sk-primary-link"
                          to={`/hostel/${hostel.id}?campus=${campus.id}${room ? `&room=${room.id}` : ''}`}
                        >
                          View room <ArrowUpRight size={14} />
                        </Link>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="compare-bottom">
              <p>
                All listing information is sample data. Confirm the room, charges and terms during your visit.
              </p>
              <button
                type="button"
                onClick={() => {
                  clearComparison();
                  update('ids', '');
                }}
              >
                Clear shortlist
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
