// The popup an Org Admin sees after clicking "Add Member" on their
// Dashboard. It has two "views" in one component:
//   1. A form to fill in the new member's details
//   2. After submitting, a confirmation screen showing the shared default
//      password — there's no email service connected, so the admin is
//      expected to pass it along themselves. The new member gets a
//      warning banner nudging them to change it the moment they log in.
import { useState } from 'react';
import { useOrg, seatsAvailableFor } from '../context/OrgContext';
import { DEPARTMENTS } from '../data/departments';

// A simple pattern to check an email address roughly looks like
// "something@something.something" before we bother submitting it.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function AddMemberModal({ org, orgId, onClose, onMemberAdded }) {
  const { addMember } = useOrg();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [department, setDepartment] = useState(DEPARTMENTS[0]);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  // Once the member is created, this holds the confirmation info — its
  // presence is what switches the modal from "form" to "confirmation" view.
  const [createdMember, setCreatedMember] = useState(null);
  const [copied, setCopied] = useState(false);

  const seatLimit = org?.seatLimit ?? Infinity;
  const seatsAvailable = seatsAvailableFor(org);
  const atCapacity = seatsAvailable <= 0; // no room left on the current plan

  // Validate first (so we never even try a bad request), then create the
  // member and switch to the confirmation view on success.
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return setError('Please enter a full name.');
    if (!EMAIL_RE.test(email.trim())) return setError('Please enter a valid email address.');

    setSubmitting(true);
    try {
      const result = await addMember(orgId, { name: name.trim(), email: email.trim(), department });
      setError('');
      setCreatedMember(result);
      onMemberAdded?.(); // lets the parent page refresh its member list
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Copies the generated default password to the clipboard, with a brief
  // "copied!" checkmark swap for feedback.
  const handleCopy = () => {
    navigator.clipboard?.writeText(createdMember.defaultPassword);
    setCopied(true);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-md bg-zinc-950 border border-white/10 rounded-[2.5rem] p-8 relative shadow-2xl">
        <button onClick={onClose} className="absolute top-6 right-6 text-zinc-500 hover:text-white transition-colors">
          <iconify-icon icon="material-symbols:close" className="text-xl"></iconify-icon>
        </button>

        {/* two views in one modal: the add-member form, or the "here's their password" confirmation */}
        {!createdMember ? (
          <>
            <h2 className="text-2xl font-bold font-manrope mb-2">Add Member</h2>
            <p className="text-zinc-500 text-sm mb-6">
              {seatLimit === Infinity ? (
                'Unlimited seats on your Enterprise plan.'
              ) : (
                <>
                  {seatsAvailable} of {seatLimit} seats remaining on your plan.
                </>
              )}
            </p>

            <form className="space-y-5" onSubmit={handleSubmit}>
              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jane Doe"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#ef233c] focus:ring-1 focus:ring-[#ef233c] transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Work Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={org?.domain ? `jane@${org.domain}` : 'jane@yourcompany.com'}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#ef233c] focus:ring-1 focus:ring-[#ef233c] transition-all"
                />
                {org?.domain && <p className="text-[10px] text-zinc-600 mt-2">Must be an @{org.domain} address.</p>}
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Department</label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3 text-white focus:outline-none focus:border-[#ef233c] transition-all"
                >
                  {DEPARTMENTS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              {error && (
                <p className="text-xs text-red-400 flex items-center gap-1.5">
                  <iconify-icon icon="material-symbols:error"></iconify-icon> {error}
                </p>
              )}

              <button
                type="submit"
                disabled={atCapacity || submitting}
                className="w-full bg-[#ef233c] hover:bg-red-700 disabled:opacity-40 disabled:hover:bg-[#ef233c] disabled:cursor-not-allowed text-white font-bold rounded-2xl py-3.5 transition-all shadow-[0_10px_20px_rgba(239,35,60,0.2)] flex items-center justify-center gap-2"
              >
                <iconify-icon icon="material-symbols:person-add"></iconify-icon>
                {submitting ? 'Adding…' : 'Add Member'}
              </button>
              {atCapacity && (
                <p className="text-xs text-amber-400 text-center">You've reached your plan's seat limit. Upgrade to add more members.</p>
              )}
            </form>
          </>
        ) : (
          <div className="text-center py-2">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl mb-6">
              <iconify-icon icon="material-symbols:check-circle" className="text-emerald-400 text-2xl"></iconify-icon>
            </div>
            <h2 className="text-xl font-bold font-manrope mb-2">{createdMember.member.name} was added</h2>
            <p className="text-zinc-500 text-sm mb-6">
              Share these sign-in details with <span className="text-zinc-300">{createdMember.member.email}</span> yourself — there's
              no email service connected. They'll see a reminder to change this password the moment they log in.
            </p>

            {/* the generated temporary password, with a one-click copy button */}
            <div className="bg-black/40 border border-white/10 rounded-2xl px-5 py-4 flex items-center justify-between gap-3 mb-3">
              <span className="font-mono text-lg tracking-wider text-white">{createdMember.defaultPassword}</span>
              <button onClick={handleCopy} className="text-zinc-400 hover:text-white transition-colors shrink-0">
                <iconify-icon icon={copied ? 'material-symbols:check' : 'material-symbols:content-copy'}></iconify-icon>
              </button>
            </div>

            <button
              onClick={onClose}
              className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold rounded-2xl py-3.5 transition-all mt-5"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
