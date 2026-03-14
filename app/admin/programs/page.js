'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function ProgramsPage() {
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [teams, setTeams] = useState([]);
  const [allPlayers, setAllPlayers] = useState([]);
  const [showAssign, setShowAssign] = useState(null); // program being assigned
  const [assignSearch, setAssignSearch] = useState('');
  const [selectedTargets, setSelectedTargets] = useState([]); // player IDs
  const [assigning, setAssigning] = useState(false);
  const [assignResult, setAssignResult] = useState(null);
  const [duplicateWarning, setDuplicateWarning] = useState(null);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [sendVia, setSendVia] = useState(''); // '' | 'sms' | 'email' | 'both'

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('mf_user') || '{}');
    Promise.all([
      fetch(`/api/programs?coach_id=${user.id}`).then(r => r.json()),
      fetch(`/api/roster?coach_id=${user.id}`).then(r => r.json()),
    ]).then(([progData, rosterData]) => {
      setPrograms(progData.programs || []);
      setTeams(rosterData.teams || []);
      setAllPlayers(rosterData.all_players || []);
      setLoading(false);
    }).catch(err => { console.error(err); setLoading(false); });
  }, []);

  const custom = programs.filter(p => !p.is_template);
  const templates = programs.filter(p => p.is_template);

  function openAssign(prog) {
    setShowAssign(prog);
    setSelectedTargets([]);
    setAssignSearch('');
    setAssignResult(null);
    setDuplicateWarning(null);
    setStartDate(new Date().toISOString().split('T')[0]);
    setSendVia('');
  }

  function togglePlayer(playerId) {
    setSelectedTargets(prev =>
      prev.includes(playerId) ? prev.filter(id => id !== playerId) : [...prev, playerId]
    );
  }

  function selectTeam(team) {
    const teamPlayerIds = team.players.map(p => p.id);
    const allSelected = teamPlayerIds.every(id => selectedTargets.includes(id));
    if (allSelected) {
      setSelectedTargets(prev => prev.filter(id => !teamPlayerIds.includes(id)));
    } else {
      setSelectedTargets(prev => [...new Set([...prev, ...teamPlayerIds])]);
    }
  }

  const filteredPlayers = assignSearch
    ? allPlayers.filter(p =>
      (p.name || '').toLowerCase().includes(assignSearch.toLowerCase()) ||
      (p.email || '').toLowerCase().includes(assignSearch.toLowerCase()) ||
      (p.team_name || '').toLowerCase().includes(assignSearch.toLowerCase())
    )
    : allPlayers;

  async function handleAssign() {
    if (!showAssign || selectedTargets.length === 0) return;
    setAssigning(true);
    setAssignResult(null);

    try {
      // Check for duplicates first
      const checkRes = await fetch(`/api/programs/${showAssign.id}/assign/check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ player_ids: selectedTargets }),
      });

      if (checkRes.ok) {
        const checkData = await checkRes.json();
        if (checkData.duplicates && checkData.duplicates.length > 0 && !duplicateWarning) {
          setDuplicateWarning(checkData.duplicates);
          setAssigning(false);
          return;
        }
      }

      // Proceed with assignment
      const res = await fetch(`/api/programs/${showAssign.id}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          player_ids: selectedTargets,
          start_date: startDate,
          force: !!duplicateWarning,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setAssignResult({ success: true, data });

        // Send URLs if requested
        if (sendVia) {
          for (const playerId of selectedTargets) {
            try {
              await fetch('/api/send-url', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ player_id: playerId, type: sendVia }),
              });
            } catch (e) { /* silent */ }
          }
        }

        // Refresh programs
        const user = JSON.parse(localStorage.getItem('mf_user') || '{}');
        const progRes = await fetch(`/api/programs?coach_id=${user.id}`);
        if (progRes.ok) {
          const progData = await progRes.json();
          setPrograms(progData.programs || []);
        }
      } else {
        setAssignResult({ success: false, error: 'Failed to assign' });
      }
    } catch (err) {
      setAssignResult({ success: false, error: err.message });
    }
    setAssigning(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Programs</h1>
        <Link href="/admin/programs/new"
          className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700">
          + Create Program
        </Link>
      </div>

      {loading ? (
        <div className="text-center py-12"><svg className="animate-spin h-8 w-8 text-green-600 mx-auto" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg></div>
      ) : (
        <>
          {/* Custom Programs */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Your Programs</h2>
            {custom.length === 0 ? (
              <div className="bg-white rounded-xl p-8 border border-gray-200 text-center">
                <svg className="w-10 h-10 text-gray-300 mx-auto mb-2" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15a2.25 2.25 0 0 1 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25Z" /></svg>
                <p className="text-gray-500">No custom programs yet</p>
                <Link href="/admin/programs/new" className="text-green-600 text-sm font-medium hover:underline mt-1 inline-block">Create your first program</Link>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {custom.map(prog => (
                  <div key={prog.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all">
                    <Link href={`/admin/programs/${prog.id}`}>
                      <h3 className="font-bold text-gray-900 mb-1">{prog.name}</h3>
                      <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                        <span>{prog.duration_weeks || '?'} weeks</span>
                        <span>|</span>
                        <span className="capitalize">{prog.phase || 'general'}</span>
                        <span>|</span>
                        <span className={`px-1.5 py-0.5 rounded ${
                          prog.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                          prog.difficulty === 'hard' ? 'bg-red-100 text-red-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>{prog.difficulty || 'medium'}</span>
                      </div>
                      <p className="text-xs text-gray-400">{prog.assigned_count || 0} players assigned</p>
                    </Link>
                    <button onClick={() => openAssign(prog)}
                      className="mt-2 w-full py-2 bg-green-50 text-green-700 text-xs font-medium rounded-lg hover:bg-green-100 border border-green-200 transition-colors">
                      Assign to Players
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Templates */}
          {templates.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">System Templates</h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {templates.map(prog => (
                  <div key={prog.id} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-bold text-gray-900">{prog.name}</h3>
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Template</span>
                    </div>
                    <p className="text-xs text-gray-500 mb-2">{prog.description}</p>
                    <button className="text-xs text-green-600 font-medium hover:underline">Clone to edit</button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Assign Modal */}
      {showAssign && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center" onClick={() => setShowAssign(null)}>
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-gray-100 shrink-0">
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-lg font-bold text-gray-900">Assign Program</h2>
                <button onClick={() => setShowAssign(null)} className="text-gray-400 hover:text-gray-600">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <p className="text-sm text-gray-500">Assign <span className="font-medium text-gray-700">{showAssign.name}</span> to players or teams</p>
            </div>

            <div className="p-4 space-y-3 overflow-y-auto flex-1">
              {/* Search */}
              <input type="text" placeholder="Search players or teams..." value={assignSearch}
                onChange={e => setAssignSearch(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none" />

              {/* Start Date */}
              <div className="flex items-center gap-2">
                <label className="text-xs text-gray-500 whitespace-nowrap">Start date:</label>
                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                  className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none" />
              </div>

              {/* Teams section */}
              {teams.length > 0 && !assignSearch && (
                <div>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Teams</h3>
                  <div className="space-y-1">
                    {teams.map(team => {
                      const teamPlayerIds = team.players.map(p => p.id);
                      const selectedCount = teamPlayerIds.filter(id => selectedTargets.includes(id)).length;
                      const allSelected = teamPlayerIds.length > 0 && selectedCount === teamPlayerIds.length;
                      return (
                        <button key={team.id} onClick={() => selectTeam(team)}
                          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left transition-colors ${
                            allSelected ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-100 hover:bg-gray-100'
                          }`}>
                          <div className="flex items-center gap-2">
                            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                              allSelected ? 'bg-green-600 border-green-600' : selectedCount > 0 ? 'bg-green-200 border-green-400' : 'border-gray-300'
                            }`}>
                              {allSelected && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>}
                              {!allSelected && selectedCount > 0 && <div className="w-2 h-2 bg-green-600 rounded-sm" />}
                            </div>
                            <span className="text-sm font-medium text-gray-900">{team.name}</span>
                          </div>
                          <span className="text-xs text-gray-400">{team.player_count} players</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Players section */}
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">
                  {assignSearch ? 'Search Results' : 'Individual Players'}
                </h3>
                <div className="space-y-0.5 max-h-60 overflow-y-auto">
                  {filteredPlayers.map(player => {
                    const isSelected = selectedTargets.includes(player.id);
                    return (
                      <button key={player.id} onClick={() => togglePlayer(player.id)}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                          isSelected ? 'bg-green-50' : 'hover:bg-gray-50'
                        }`}>
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 ${
                          isSelected ? 'bg-green-600 border-green-600' : 'border-gray-300'
                        }`}>
                          {isSelected && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>}
                        </div>
                        <div className="w-7 h-7 bg-green-600 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0">
                          {player.name?.[0]?.toUpperCase() || '?'}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium text-gray-900 truncate">{player.name}</div>
                          <div className="text-xs text-gray-400 truncate">{player.team_name || 'Unassigned'}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Duplicate Warning */}
              {duplicateWarning && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-sm font-medium text-yellow-800 mb-1">Duplicate assignments detected</p>
                  <div className="text-xs text-yellow-700 space-y-0.5">
                    {duplicateWarning.map(d => (
                      <p key={d.player_id}>{d.player_name} already has this program (started {new Date(d.start_date).toLocaleDateString()})</p>
                    ))}
                  </div>
                  <p className="text-xs text-yellow-600 mt-2">Click "Assign" again to reassign anyway.</p>
                </div>
              )}

              {/* Send via */}
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Send program link to players</h3>
                <div className="flex gap-2">
                  {[
                    { key: '', label: 'None' },
                    { key: 'sms', label: 'SMS' },
                    { key: 'email', label: 'Email' },
                    { key: 'both', label: 'Both' },
                  ].map(opt => (
                    <button key={opt.key} onClick={() => setSendVia(opt.key)}
                      className={`flex-1 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                        sendVia === opt.key ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                      }`}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Success result */}
              {assignResult?.success && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                  <p className="text-sm font-medium text-green-800">Program assigned to {selectedTargets.length} player{selectedTargets.length !== 1 ? 's' : ''}!</p>
                </div>
              )}
              {assignResult && !assignResult.success && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-700">{assignResult.error}</p>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-gray-100 shrink-0">
              <button onClick={handleAssign} disabled={selectedTargets.length === 0 || assigning || assignResult?.success}
                className="w-full py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                {assigning ? 'Assigning...' : assignResult?.success ? 'Done!' : `Assign to ${selectedTargets.length} player${selectedTargets.length !== 1 ? 's' : ''}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
