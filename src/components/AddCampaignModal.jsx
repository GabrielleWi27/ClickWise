// The popup an Org Admin sees after clicking "Add Campaign" on their
// Dashboard. It lets them pick one of the real simulations (whichever
// ones Platform Admin has left active), then "launches" it against their company.
import { useEffect, useState } from 'react';
import { useOrg } from '../context/OrgContext';
import { fetchSimulations } from '../data/simulations';
import { difficultyStyle } from '../data/content';

export default function AddCampaignModal({ orgId, onClose, onCampaignLaunched }) {
  const { launchCampaign } = useOrg();
  const [templates, setTemplates] = useState([]); // active simulations, usable as campaign templates
  const [selectedId, setSelectedId] = useState(''); // which template card is currently picked
  const [launched, setLaunched] = useState(null); // set once launched — switches to the confirmation view
  const [submitting, setSubmitting] = useState(false);

  // Only show simulations Platform Admin has left turned on ("active").
  useEffect(() => {
    fetchSimulations().then((sims) => setTemplates(sims.filter((s) => s.active)));
  }, []);

  // Submitting the form: actually create the campaign in the database,
  // then swap the form for the "it's live" confirmation view.
  const handleLaunch = async (e) => {
    e.preventDefault();
    const template = templates.find((t) => t.id === selectedId);
    if (!template) return;
    setSubmitting(true);
    try {
      const campaign = await launchCampaign(orgId, template);
      setLaunched(campaign);
      onCampaignLaunched?.(); // lets the parent page (e.g. AdminDashboard) refresh its own data
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-md bg-zinc-950 border border-white/10 rounded-[2.5rem] p-8 relative shadow-2xl">
        <button onClick={onClose} className="absolute top-6 right-6 text-zinc-500 hover:text-white transition-colors">
          <iconify-icon icon="material-symbols:close" className="text-xl"></iconify-icon>
        </button>

        {/* two views in one modal: pick-a-template form, or the "launched!" success screen */}
        {!launched ? (
          <>
            <h2 className="text-2xl font-bold font-manrope mb-2">Add Campaign</h2>
            <p className="text-zinc-500 text-sm mb-6">Launch a phishing simulation campaign against your team.</p>

            {templates.length === 0 ? (
              <p className="text-sm text-zinc-500">
                No campaign templates are active right now. Ask ClickWise staff to enable one in the content library.
              </p>
            ) : (
              <form onSubmit={handleLaunch} className="space-y-4">
                {/* one clickable card per available simulation template */}
                <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1 custom-scrollbar">
                  {templates.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setSelectedId(t.id)}
                      className={`w-full text-left p-4 rounded-2xl border transition-all flex items-center justify-between gap-4 ${
                        selectedId === t.id ? 'border-[#ef233c] bg-[#ef233c]/5' : 'border-white/10 bg-white/[0.02] hover:border-white/20'
                      }`}
                    >
                      <div>
                        <div className="font-medium text-sm">{t.name}</div>
                        <div className="text-xs text-zinc-500">{t.category}</div>
                      </div>
                      <span className={`px-2 py-0.5 text-[9px] font-bold uppercase rounded border shrink-0 ${difficultyStyle(t.difficulty)}`}>
                        {t.difficulty}
                      </span>
                    </button>
                  ))}
                </div>

                <button
                  type="submit"
                  disabled={!selectedId || submitting}
                  className="w-full bg-[#ef233c] hover:bg-red-700 disabled:opacity-40 disabled:hover:bg-[#ef233c] disabled:cursor-not-allowed text-white font-bold rounded-2xl py-3.5 transition-all shadow-[0_10px_20px_rgba(239,35,60,0.2)] flex items-center justify-center gap-2"
                >
                  <iconify-icon icon="material-symbols:rocket-launch"></iconify-icon>
                  {submitting ? 'Launching…' : 'Launch Campaign'}
                </button>
              </form>
            )}
          </>
        ) : (
          <div className="text-center py-2">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl mb-6">
              <iconify-icon icon="material-symbols:rocket-launch" className="text-emerald-400 text-2xl"></iconify-icon>
            </div>
            <h2 className="text-xl font-bold font-manrope mb-2">{launched.name} is live</h2>
            <p className="text-zinc-500 text-sm mb-8">
              This campaign is now active for your organization and will appear on your Admin Dashboard.
            </p>
            <button
              onClick={onClose}
              className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold rounded-2xl py-3.5 transition-all"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
