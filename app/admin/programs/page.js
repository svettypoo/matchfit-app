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
