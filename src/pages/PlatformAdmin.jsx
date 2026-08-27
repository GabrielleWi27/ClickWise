// The Platform Admin's page — for ClickWise's own staff, not a company's
// Org Admin. Two main jobs happen here:
//   1. Manage the shared Content Library — Campaigns and Trainings read
//      straight from the real `simulations`/`lessons` tables (the same
//      ones employees actually use), so this can never drift out of sync
//      the way it did when it was a separately-seeded copy. Demos have
//      no real underlying table, so they still live in `content_library`.
//   2. See every company on the platform, and assign content to them
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useOrg, seatUsageFor } from '../context/OrgContext';
import { supabase } from '../lib/supabaseClient';
import { fetchSimulations } from '../data/simulations';
import { fetchLessons } from '../data/lessons';
import { getPlan } from '../data/plans';
import { CONTENT_TYPES, CONTENT_TYPE_LABELS, difficultyStyle } from '../data/content';

export default function PlatformAdmin() {
  const { getAllOrgs, assignContent } = useOrg();
  const [simulations, setSimulations] = useState([]); // real campaign source
  const [lessons, setLessons] = useState([]); // real training source
  const [demos, setDemos] = useState([]); // content_library, type=demo only
  const [orgs, setOrgs] = useState([]); // every company on the platform
  const [activeTab, setActiveTab] = useState(CONTENT_TYPES.CAMPAIGN); // which tab (Campaigns/Demos/Trainings) is open
  const [showForm, setShowForm] = useState(false); // toggles the "add new demo" form — Campaigns/Trainings aren't quick-add
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [difficulty, setDifficulty] = useState('Medium');
  const [assignFlash, setAssignFlash] = useState(null); // the brief "X assigned" success message

  const refreshContent = useCallback(async () => {
    const [{ data: demoRows }, sims, lessonRows] = await Promise.all([
      supabase.from('content_library').select('*').eq('type', CONTENT_TYPES.DEMO).order('created_at'),
      fetchSimulations(),
      fetchLessons(),
    ]);
    setDemos(demoRows ?? []);
    setSimulations(sims);
    setLessons(lessonRows);
  }, []);

  const refreshOrgs = useCallback(async () => {
    setOrgs(await getAllOrgs());
  }, [getAllOrgs]);

  useEffect(() => {
    refreshContent();
    refreshOrgs();
  }, [refreshContent, refreshOrgs]);

  const totalContentItems = simulations.length + lessons.length + demos.length;

  // Flips a simulation between Active/Disabled — org admins only see
  // active ones when picking a campaign to launch.
  const toggleSimulationActive = async (id) => {
    const sim = simulations.find((s) => s.id === id);
    if (!sim) return;
    await supabase.from('simulations').update({ active: !sim.active }).eq('id', id);
    await refreshContent();
  };

  // Demos still work the old way: a simple, freeform catalog with no
  // real content behind them beyond name/category/difficulty.
  const handleAddDemo = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    await supabase.from('content_library').insert({
      type: CONTENT_TYPES.DEMO,
      name: name.trim(),
      category: category.trim() || 'General',
      difficulty,
      active: true,
    });
    await refreshContent();
    setName('');
    setCategory('');
    setShowForm(false);
  };

  const toggleDemoActive = async (id) => {
    const item = demos.find((c) => c.id === id);
    if (!item) return;
    await supabase.from('content_library').update({ active: !item.active }).eq('id', id);
    await refreshContent();
  };

  const removeDemo = async (id) => {
    await supabase.from('content_library').delete().eq('id', id);
    await refreshContent();
  };

  // Assigns one campaign (simulation) or demo to a company. Trainings
  // aren't assigned per-org — every employee already gets the full,
  // compulsory lesson track regardless of org, so there's nothing real
  // to "assign" there.
  const handleAssign = async (orgId, type, itemId) => {
    if (!itemId) return;
    const source = type === CONTENT_TYPES.CAMPAIGN ? simulations : demos;
    const item = source.find((c) => c.id === itemId);
    if (!item) return;
    await assignContent(orgId, {
      id: item.id,
      type,
      name: item.name,
      category: item.category,
      difficulty: item.difficulty,
    });
    await refreshOrgs();
    setAssignFlash(`${item.name} assigned`);
    setTimeout(() => setAssignFlash(null), 2500);
  };

  return (
    <main className="relative z-10 pt-28 pb-20 px-4 md:px-8 max-w-[1600px] mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 animate-fade-up">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-4xl font-bold font-manrope tracking-tighter">Platform Admin</h1>
            <span className="px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-400 text-[10px] font-bold uppercase tracking-wider border border-purple-500/20">
              ClickWise Staff
            </span>
          </div>
          <p className="text-zinc-500">Manage content and monitor every organization on the platform.</p>
        </div>
        {assignFlash && (
          <div className="mt-4 md:mt-0 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold rounded-xl flex items-center gap-2">
            <iconify-icon icon="material-symbols:check-circle"></iconify-icon>
            {assignFlash}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10 animate-fade-up" style={{ animationDelay: '0.1s' }}>
        <div className="glass-card p-6 rounded-3xl">
          <div className="p-2.5 bg-purple-600/10 rounded-xl text-purple-400 inline-flex mb-4">
            <iconify-icon icon="material-symbols:space-dashboard" className="text-xl"></iconify-icon>
          </div>
          <div className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-1">Content Items</div>
          <div className="text-4xl font-bold font-manrope tracking-tight">{totalContentItems}</div>
          <p className="text-zinc-500 text-xs mt-1">
            {simulations.length} campaigns • {lessons.length} lessons • {demos.length} demos
          </p>
        </div>
        <div className="glass-card p-6 rounded-3xl">
          <div className="p-2.5 bg-blue-600/10 rounded-xl text-blue-400 inline-flex mb-4">
            <iconify-icon icon="material-symbols:domain" className="text-xl"></iconify-icon>
          </div>
          <div className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-1">Organizations</div>
          <div className="text-4xl font-bold font-manrope tracking-tight">{orgs.length}</div>
        </div>
        <div className="glass-card p-6 rounded-3xl">
          <div className="p-2.5 bg-emerald-600/10 rounded-xl text-emerald-400 inline-flex mb-4">
            <iconify-icon icon="material-symbols:monitor-heart" className="text-xl"></iconify-icon>
          </div>
          <div className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-1">Platform Status</div>
          <div className="text-2xl font-bold font-manrope tracking-tight text-emerald-400">Operational</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 glass-card rounded-[2rem] overflow-hidden animate-fade-up" style={{ animationDelay: '0.2s' }}>
          <div className="p-8 border-b border-white/10">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-bold font-manrope tracking-tight">Content Library</h2>
                <p className="text-xs text-zinc-500 mt-1">Campaigns and trainings are your real simulations/lessons — demos are a separate catalog.</p>
              </div>
              {activeTab === CONTENT_TYPES.DEMO && (
                <button
                  onClick={() => setShowForm((v) => !v)}
                  className="px-5 py-2.5 bg-[#ef233c] hover:bg-red-700 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-[0_4px_15px_rgba(239,35,60,0.3)]"
                >
                  <iconify-icon icon="material-symbols:add"></iconify-icon>
                  Add Demo
                </button>
              )}
            </div>
            <div className="flex gap-2 p-1 bg-white/5 rounded-2xl border border-white/10 w-fit">
              {Object.values(CONTENT_TYPES).map((type) => (
                <button
                  key={type}
                  onClick={() => setActiveTab(type)}
                  className={`px-5 py-2 rounded-xl text-sm font-bold transition-all ${
                    activeTab === type ? 'bg-[#ef233c] text-white' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  {CONTENT_TYPE_LABELS[type]}
                </button>
              ))}
            </div>
          </div>

          {showForm && activeTab === CONTENT_TYPES.DEMO && (
            <form onSubmit={handleAddDemo} className="p-8 border-b border-white/10 bg-white/[0.02] grid grid-cols-1 md:grid-cols-3 gap-4">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Demo name"
                className="bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#ef233c]"
              />
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Category"
                className="bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#ef233c]"
              />
              <div className="flex gap-2">
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#ef233c]"
                >
                  <option>Low</option>
                  <option>Medium</option>
                  <option>High</option>
                </select>
                <button type="submit" className="px-4 py-2.5 bg-[#ef233c] hover:bg-red-700 rounded-xl text-sm font-bold transition-all">
                  Save
                </button>
              </div>
            </form>
          )}

          {/* Campaigns tab: every real simulation, with a click-to-toggle Active/Disabled status */}
          {activeTab === CONTENT_TYPES.CAMPAIGN && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white/[0.02] text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                    <th className="px-8 py-4">Name</th>
                    <th className="px-4 py-4">Category</th>
                    <th className="px-4 py-4">Difficulty</th>
                    <th className="px-8 py-4 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="text-sm divide-y divide-white/5">
                  {simulations.map((sim) => (
                    <tr key={sim.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-8 py-5 font-medium">{sim.name}</td>
                      <td className="px-4 py-5 text-zinc-400">{sim.category}</td>
                      <td className="px-4 py-5">
                        <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded border ${difficultyStyle(sim.difficulty)}`}>
                          {sim.difficulty}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <button
                          onClick={() => toggleSimulationActive(sim.id)}
                          className={`inline-flex items-center gap-1.5 text-xs ${sim.active ? 'text-emerald-400' : 'text-zinc-600'}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${sim.active ? 'bg-emerald-400' : 'bg-zinc-600'}`} />
                          {sim.active ? 'Active' : 'Disabled'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Trainings tab: read-only list of every lesson (view only — see the note below about why) */}
          {activeTab === CONTENT_TYPES.TRAINING && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white/[0.02] text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                    <th className="px-8 py-4">Lesson</th>
                    <th className="px-4 py-4">Summary</th>
                    <th className="px-8 py-4 text-right">Length</th>
                  </tr>
                </thead>
                <tbody className="text-sm divide-y divide-white/5">
                  {lessons.map((lesson) => (
                    <tr key={lesson.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-8 py-5 font-medium">{lesson.title}</td>
                      <td className="px-4 py-5 text-zinc-400">{lesson.summary}</td>
                      <td className="px-8 py-5 text-right text-zinc-500">{lesson.minutes} min</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="px-8 py-4 text-xs text-zinc-600 border-t border-white/5">
                Every employee gets the full compulsory lesson track regardless of organization, so trainings aren't individually
                assigned per-org the way campaigns are.
              </p>
            </div>
          )}

          {/* Demos tab: the freeform catalog, with toggle-active and delete actions */}
          {activeTab === CONTENT_TYPES.DEMO && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white/[0.02] text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                    <th className="px-8 py-4">Name</th>
                    <th className="px-4 py-4">Category</th>
                    <th className="px-4 py-4">Difficulty</th>
                    <th className="px-4 py-4">Status</th>
                    <th className="px-8 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-sm divide-y divide-white/5">
                  {demos.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-8 py-10 text-center text-zinc-500 text-sm">
                        No demos yet.
                      </td>
                    </tr>
                  )}
                  {demos.map((c) => (
                    <tr key={c.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-8 py-5 font-medium">{c.name}</td>
                      <td className="px-4 py-5 text-zinc-400">{c.category}</td>
                      <td className="px-4 py-5">
                        <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded border ${difficultyStyle(c.difficulty)}`}>
                          {c.difficulty}
                        </span>
                      </td>
                      <td className="px-4 py-5">
                        <button
                          onClick={() => toggleDemoActive(c.id)}
                          className={`flex items-center gap-1.5 text-xs ${c.active ? 'text-emerald-400' : 'text-zinc-600'}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${c.active ? 'bg-emerald-400' : 'bg-zinc-600'}`} />
                          {c.active ? 'Active' : 'Disabled'}
                        </button>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <button onClick={() => removeDemo(c.id)} className="p-2 text-zinc-500 hover:text-[#ef233c] transition-colors">
                          <iconify-icon icon="material-symbols:delete"></iconify-icon>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Organizations panel: every company (getAllOrgs), each with a
            "View Dashboard" link and dropdowns to assign campaigns/demos to it */}
        <div className="glass-card rounded-[2rem] p-8 animate-fade-up" style={{ animationDelay: '0.3s' }}>
          <h2 className="text-lg font-bold font-manrope mb-6 flex items-center gap-2">
            <iconify-icon icon="material-symbols:domain" className="text-[#ef233c]"></iconify-icon>
            Organizations
          </h2>
          <div className="space-y-4">
            {orgs.map((org) => {
              const plan = getPlan(org.planId);
              const seatUsage = seatUsageFor(org);
              return (
                <div key={org.id} className="p-4 bg-white/[0.03] rounded-2xl border border-white/5">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium text-sm">{org.name}</span>
                    <span className="px-2 py-0.5 bg-white/5 border border-white/10 text-[9px] font-bold uppercase tracking-widest rounded-full">
                      {plan.name}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs text-zinc-500 mb-3">
                    <span>
                      {seatUsage} / {org.seatLimit === Infinity ? '∞' : org.seatLimit} seats
                    </span>
                    <span>{org.assignedContent.length} assigned</span>
                  </div>
                  <div className="flex gap-2">
                    <Link
                      to={`/platform-admin/orgs/${org.id}`}
                      className="flex-1 text-center px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all"
                    >
                      View Dashboard
                    </Link>
                    {/* one dropdown covering both campaigns and demos — the value
                        encodes "type::id" so handleAssign knows which table to use */}
                    <select
                      onChange={(e) => {
                        const [type, itemId] = e.target.value.split('::');
                        handleAssign(org.id, type, itemId);
                        e.target.value = ''; // reset back to the placeholder after assigning
                      }}
                      defaultValue=""
                      className="flex-1 bg-black/40 border border-white/10 rounded-xl px-2 py-2 text-[10px] font-bold uppercase tracking-widest text-zinc-300 focus:outline-none focus:border-[#ef233c]"
                    >
                      <option value="" disabled>
                        Assign...
                      </option>
                      <optgroup label={CONTENT_TYPE_LABELS[CONTENT_TYPES.CAMPAIGN]}>
                        {simulations
                          .filter((s) => s.active)
                          .map((s) => (
                            <option key={s.id} value={`${CONTENT_TYPES.CAMPAIGN}::${s.id}`}>
                              {s.name}
                            </option>
                          ))}
                      </optgroup>
                      <optgroup label={CONTENT_TYPE_LABELS[CONTENT_TYPES.DEMO]}>
                        {demos
                          .filter((d) => d.active)
                          .map((d) => (
                            <option key={d.id} value={`${CONTENT_TYPES.DEMO}::${d.id}`}>
                              {d.name}
                            </option>
                          ))}
                      </optgroup>
                    </select>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </main>
  );
}
