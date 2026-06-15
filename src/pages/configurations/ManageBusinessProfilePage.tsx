import React, { useState, useEffect } from 'react';
import { DataTable, Column } from '../../components/DataTable';
import { TrashIcon, PencilIcon, CheckIcon, XIcon, Loader2Icon } from 'lucide-react';
import { API_BASE_URL } from '../../config';

const BASE_URL = `${API_BASE_URL}/api/business-profiles`;

interface BusinessProfileDTO {
  bussinessProfileId: number;
  bussinessProfileName: string;
  status: number;
  userId: number;
  createdDate?: string;
  editedDate?: string;
}

interface BusinessProfile {
  id: number;
  name: string;
}

function toBusinessProfile(dto: BusinessProfileDTO): BusinessProfile {
  return {
    id: dto.bussinessProfileId,
    name: dto.bussinessProfileName,
  };
}

export function ManageBusinessProfilePage() {
  const [profiles, setProfiles] = useState<BusinessProfile[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingValue, setEditingValue] = useState('');
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProfiles();
  }, []);

  // ── Fetch all ────────────────────────────────────────────────────────────
  const fetchProfiles = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(BASE_URL);
      if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);
      const data: BusinessProfileDTO[] = await res.json();
      setProfiles(data.map(toBusinessProfile));
    } catch (err) {
      setError('Could not load profiles. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Save (POST) ──────────────────────────────────────────────────────────
  const handleAddProfile = async () => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;

    setSaving(true);
    setError(null);
    try {
      const body = { bussinessProfileName: trimmed };
      const res = await fetch(BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(`Save failed: ${res.status}`);

      // Response: "Business profile saved with id: 5"
      const text = await res.text();
      const match = text.match(/(\d+)$/);
      const newId = match ? parseInt(match[1], 10) : Date.now();

      setProfiles((prev) => [...prev, { id: newId, name: trimmed }]);
      setInputValue('');
    } catch (err) {
      setError('Could not save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // ── Update (PUT) ─────────────────────────────────────────────────────────
  const startEdit = (profile: BusinessProfile) => {
    setEditingId(profile.id);
    setEditingValue(profile.name);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingValue('');
  };

  const handleUpdateProfile = async (id: number) => {
    const trimmed = editingValue.trim();
    if (!trimmed) return;

    setError(null);
    try {
      const body = { bussinessProfileName: trimmed };
      const res = await fetch(`${BASE_URL}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(`Update failed: ${res.status}`);

      setProfiles((prev) =>
        prev.map((p) => (p.id === id ? { ...p, name: trimmed } : p))
      );
      setEditingId(null);
      setEditingValue('');
    } catch (err) {
      setError('Could not update profile. Please try again.');
    }
  };

  // ── Soft Delete (DELETE) ─────────────────────────────────────────────────
  const handleDeleteProfile = async (id: number) => {
    setDeletingId(id);
    setError(null);
    try {
      const res = await fetch(`${BASE_URL}/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(`Delete failed: ${res.status}`);
      setProfiles((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      setError('Could not delete profile. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  // ── Table columns ────────────────────────────────────────────────────────
  const columns: Column<BusinessProfile>[] = [
    {
      header: 'Profile',
      accessor: (row) =>
        editingId === row.id ? (
          <input
            autoFocus
            type="text"
            value={editingValue}
            onChange={(e) => setEditingValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleUpdateProfile(row.id);
              if (e.key === 'Escape') cancelEdit();
            }}
            className="w-full rounded border border-teal-400 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        ) : (
          <span>{row.name}</span>
        ),
    },
    {
      header: 'Actions',
      accessor: (row) => (
        <div className="flex items-center gap-2">
          {editingId === row.id ? (
            <>
              <button
                onClick={() => handleUpdateProfile(row.id)}
                className="text-green-600 hover:text-green-800"
                title="Save"
              >
                <CheckIcon className="h-4 w-4" />
              </button>
              <button
                onClick={cancelEdit}
                className="text-gray-500 hover:text-gray-700"
                title="Cancel"
              >
                <XIcon className="h-4 w-4" />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => startEdit(row)}
                className="text-teal-600 hover:text-teal-800"
                title="Edit"
              >
                <PencilIcon className="h-4 w-4" />
              </button>
              <button
                onClick={() => handleDeleteProfile(row.id)}
                disabled={deletingId === row.id}
                className="text-red-600 hover:text-red-800 disabled:opacity-40"
                title="Delete"
              >
                {deletingId === row.id ? (
                  <Loader2Icon className="h-4 w-4 animate-spin" />
                ) : (
                  <TrashIcon className="h-4 w-4" />
                )}
              </button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="flex-1 overflow-auto">
      <div className="space-y-6 p-6">
        {/* Error banner */}
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Add profile form */}
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-end gap-4">
            <div className="flex-1">
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Profile
              </label>
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddProfile()}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none"
                placeholder="Enter profile name"
                disabled={saving}
              />
            </div>
            <button
              onClick={handleAddProfile}
              disabled={saving || !inputValue.trim()}
              className="flex items-center gap-2 rounded-lg bg-teal-600 px-6 py-2 text-sm font-medium text-white shadow-sm hover:bg-teal-700 disabled:opacity-50"
            >
              {saving && <Loader2Icon className="h-4 w-4 animate-spin" />}
              Add Profile
            </button>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center py-12 text-gray-400">
            <Loader2Icon className="mr-2 h-5 w-5 animate-spin" />
            <span className="text-sm">Loading profiles…</span>
          </div>
        ) : (
          <DataTable columns={columns} data={profiles} />
        )}
      </div>
    </div>
  );
}