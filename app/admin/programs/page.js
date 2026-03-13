'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function ProgramsPage() {
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const user = JSON.parse(localStorage.getItem('mf_user') || '{}');
      try {
        const res = await fetch(`/api/programs?coach_id=${user.id}`);
        if (res.ok) {
          const data = await res.json();
          setPrograms(data.programs || []);
        }
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    }
    load();
  }, []);

  const custom = programs.filter(p => !p.is_template);
  const templates = programs.filter(p => p.is_template);

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
        <div className="text-center py-12"><div className="animate-spin text-3xl">&#9917;</div></div>
      ) : (
        <>
          {/* Custom Programs */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Your Programs</h2>
            {custom.length === 0 ? (
              <div className="bg-white rounded-xl p-8 border border-gray-200 text-center">
                <div className="text-4xl mb-2">&#128221;</div>
                <p className="text-gray-500">No custom programs yet</p>
                <Link href="/admin/programs/new" className="text-green-600 text-sm font-medium hover:underline mt-1 inline-block">
                  Create your first program
                </Link>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {custom.map(prog => (
                  <Link key={prog.id} href={`/admin/programs/${prog.id}`}
                    className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all">
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
    </div>
  );
}
