import { Link } from 'react-router-dom';
import { ArrowRight, Building2, Check, ChevronDown, Info, MapPin } from 'lucide-react';
import { TiltSurface3D } from '../components/ui/TiltSurface3D';
import '../styles/public-support.css';

const FAQS = [
  { question: 'Are prices per student or per room?', answer: 'The sample prices are per student, per month. Pick a room option to see its fixed monthly charges, deposit and any extras. Always confirm the final terms with the owner before moving in.' },
  { question: 'What does the deposit cover?', answer: 'The deposit is separate from monthly rent. Refund, deductions and notice rules depend on the hostel. Ask for the agreed terms in writing before paying anything.' },
  { question: 'How is distance to my coaching campus measured?', answer: 'Distances in this prototype use sample coordinates and are approximate straight-line distances. They are not walking distances or travel times. Check the actual route before choosing a hostel.' },
  { question: 'Does requesting a visit book a room?', answer: 'No. A visit request expresses interest in seeing a room. It does not reserve a room, guarantee availability or collect a payment. In this prototype requests stay in your browser; no owner is notified.' },
  { question: 'What does an approved listing mean?', answer: 'Approval is a sample moderation status in this prototype. It is not a safety certification or proof that a property was visited. All listings, photographs, prices and availability shown here are illustrative.' },
  { question: 'How can I compare and save hostels?', answer: 'Use Compare on a card to put up to three hostels side by side. Demo student login lets you save a shortlist and manage visit requests on this device. Your data is stored locally in your browser.' },
];

function JourneyIllustration({ step }: { step: number }) {
  if (step === 1) return <svg viewBox="0 0 300 180" aria-hidden="true"><ellipse cx="150" cy="151" rx="125" ry="20" fill="#e4e9dc"/><path d="M40 136 113 108 173 133 252 98" fill="none" stroke="#fff" strokeWidth="20"/><path d="M40 136 113 108 173 133 252 98" fill="none" stroke="#b9c6b8" strokeWidth="2" strokeDasharray="5 6"/><path d="m80 64 48-22 50 22v67l-50 22-48-22z" fill="#e7d4b8"/><path d="m128 86 50-22v67l-50 22z" fill="#cbb797"/><path d="m80 64 48-22 50 22-50 22z" fill="#fbf4e7"/><path d="M128 23c-19 0-29 14-29 29 0 19 29 42 29 42s29-23 29-42c0-15-10-29-29-29" fill="#0f766e"/><circle cx="128" cy="51" r="9" fill="#fff"/><path d="m202 92 19-9 20 9v34l-20 9-19-9z" fill="#a4b6a0"/><path d="m47 92 13-6 14 6v26l-14 6-13-6z" fill="#d5b59a"/><circle cx="237" cy="61" r="13" fill="#b8cbae"/><path d="M237 71v20" stroke="#839578" strokeWidth="4"/><circle cx="62" cy="54" r="12" fill="#b8cbae"/><path d="M62 64v20" stroke="#839578" strokeWidth="4"/></svg>;
  if (step === 2) return <svg viewBox="0 0 300 180" aria-hidden="true"><ellipse cx="150" cy="153" rx="119" ry="17" fill="#e4e9dc"/><g transform="translate(41 29) rotate(-7 50 65)"><rect width="94" height="123" rx="11" fill="#fff" stroke="#d7dfd5"/><rect x="9" y="9" width="76" height="57" rx="6" fill="#e8d9c5"/><path d="M20 56V36h25v20m6 0V36h24v20" stroke="#ba9b77" strokeWidth="6"/><path d="M13 82h48m-48 13h66m-66 13h35" stroke="#bcc9bb" strokeWidth="5" strokeLinecap="round"/></g><g transform="translate(153 16) rotate(6 50 65)"><rect width="101" height="138" rx="11" fill="#fff" stroke="#0f766e" strokeWidth="2"/><rect x="9" y="9" width="83" height="63" rx="6" fill="#d2e0d7"/><path d="M20 61V41h27v20m7 0V41h27v20" stroke="#7a9a87" strokeWidth="6"/><path d="M14 89h53m-53 14h72m-72 14h38" stroke="#a5bbb0" strokeWidth="5" strokeLinecap="round"/><circle cx="89" cy="8" r="13" fill="#0f766e"/><path d="m83 8 4 4 8-8" stroke="#fff" strokeWidth="3" fill="none"/></g></svg>;
  return <svg viewBox="0 0 300 180" aria-hidden="true"><ellipse cx="150" cy="154" rx="116" ry="17" fill="#e4e9dc"/><rect x="77" y="28" width="148" height="121" rx="14" fill="#fff" stroke="#cad8cb"/><path d="M77 60h148" stroke="#dae4d8" strokeWidth="2"/><path d="M107 19v23m89-23v23" stroke="#9eb299" strokeWidth="7" strokeLinecap="round"/><path d="M99 79h20m15 0h20m15 0h20M99 100h20m15 0h20m15 0h20M99 121h20m15 0h20" stroke="#b9c7b4" strokeWidth="6" strokeLinecap="round"/><circle cx="203" cy="129" r="31" fill="#0f766e"/><path d="m189 129 10 10 18-20" fill="none" stroke="#fff" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"/><path d="m39 91 8 8 15-17" fill="none" stroke="#d3a47c" strokeWidth="4" strokeLinecap="round"/></svg>;
}

export function HowItWorksPage() {
  const steps = [
    { title: 'Choose your campus', description: 'Start with your exact coaching campus, then set a monthly budget and the room sharing you prefer.' },
    { title: 'Compare rooms and costs', description: 'Look at the room that matches your search. Compare monthly charges, deposit, facilities and location together.' },
    { title: 'Request a visit', description: 'Save a date and your questions. In a real enquiry, the owner would coordinate the visit before you make a decision.' },
  ];
  return <div className="public-support help-page">
    <div className="help-hero-band">
      <section className="public-container help-heading">
        <p className="public-eyebrow"><MapPin size={14}/> A little guidance for your Kota journey</p>
        <h1>Find your room.<br/><span>Know your next step.</span></h1>
        <p>One less thing to figure out. Here’s how to explore your options, understand fixed monthly costs and plan a visit with confidence.</p>
      </section>
    </div>
    <section className="public-container" aria-label="How to find a hostel">
      <div className="help-steps">{steps.map((step,index)=><TiltSurface3D maxTilt={7} className="help-step" key={step.title}><div className="help-step__stage"><JourneyIllustration step={index+1}/></div><div className="help-step-copy"><span className="help-step-number">0{index+1}</span><div><h2>{step.title}</h2><p>{step.description}</p></div></div></TiltSurface3D>)}</div>
      <aside className="help-notice"><span><Info size={23}/></span><div><h2>A visit request is not a room reservation.</h2><p>No payment is collected here. Check the room, availability and final terms directly before making a commitment. This frontend demo saves requests on your device and does not contact owners.</p></div></aside>
    </section>
    <section className="public-container help-bottom">
      <div className="help-faq"><p className="public-eyebrow">Good questions. Clear answers.</p><h2>Before you start exploring</h2>{FAQS.map(faq=><details key={faq.question}><summary>{faq.question}<ChevronDown size={17}/></summary><p>{faq.answer}</p></details>)}</div>
      <aside className="help-asides"><div className="help-start"><MapPin size={29}/><h3>A place that fits your day.</h3><p>Your coaching, your budget, your kind of room. Start with what matters to you.</p><Link className="public-primary" to="/explore">Explore hostels <ArrowRight size={16}/></Link></div><div className="help-owner"><Building2 size={23}/><h3>Are you a hostel owner?</h3><p>Add your room types, clear pricing and property information for review.</p><Link to="/login?role=owner" className="public-text-link">List your hostel <ArrowRight size={16}/></Link></div><p className="help-demo-note"><Check size={15}/> Frontend preview · all listings are sample data</p></aside>
    </section>
  </div>;
}
