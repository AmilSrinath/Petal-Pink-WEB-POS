import React, { useState, useEffect } from 'react';
import { DataTable, Column } from '../../components/DataTable';
import { PlusIcon, EditIcon, TrashIcon } from 'lucide-react';
import { api } from './Integratedpages';

export function SubTableLocationPage() {
  const [locations, setLocations] = useState<any[]>([]);
  const [mainLocations, setMainLocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    mainTableLocationId: '', mainLocationName: '', subLocationName: '',
    imagePath: '', status: 1, userId: 1, visible: 1,
  });

  const load = () => {
    setLoading(true);
    Promise.all([api.getSubTableLocations(), api.getMainTableLocations()])
      .then(([subs, mains]) => { setLocations(subs); setMainLocations(mains); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === 'mainTableLocationId') {
      const main = mainLocations.find(m => m.mainTableLocationId === parseInt(value));
      setFormData(prev => ({ ...prev, mainTableLocationId: value, mainLocationName: main?.mainLocationName || '' }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleAdd = async () => {
    if (!formData.subLocationName.trim()) return;
    setSaving(true);
    try {
      await api.createSubTableLocation({
        ...formData,
        mainTableLocationId: parseInt(formData.mainTableLocationId),
      });
      setFormData({ mainTableLocationId: '', mainLocationName: '', subLocationName: '', imagePath: '', status: 1, userId: 1, visible: 1 });
      setShowForm(false);
      load();
    } catch {
      alert('Failed to add sub-location.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this sub-location?')) return;
    await api.deleteSubTableLocation(id);
    load();
  };

  const columns: Column<any>[] = [
    { header: 'ID', accessor: 'subTableLocationId' },
    { header: 'Main Location', accessor: 'mainLocationName' },
    { header: 'Sub Location', accessor: 'subLocationName' },
    { header: 'Status', accessor: (row) => (
      <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
        row.status === 1 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
      }`}>
        {row.status === 1 ? 'Active' : 'Inactive'}
      </span>
    )},
    { header: 'Actions', accessor: (row) => (
      <div className="flex gap-2">
        <button className="text-blue-600 hover:text-blue-800"><EditIcon className="h-4 w-4" /></button>
        <button onClick={() => handleDelete(row.subTableLocationId)} className="text-red-600 hover:text-red-800">
          <TrashIcon className="h-4 w-4" />
        </button>
      </div>
    )},
  ];

  if (loading) return <div className="flex-1 flex items-center justify-center text-gray-500">Loading...</div>;

  return (
    <div className="flex-1 overflow-auto">
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Sub-Table Locations</h2>
          <button onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-teal-700">
            <PlusIcon className="h-4 w-4" /> Add Sub-Location
          </button>
        </div>

        {showForm && (
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">Add New Sub-Location</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Main Table Location</label>
                <select name="mainTableLocationId" value={formData.mainTableLocationId} onChange={handleChange}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none">
                  <option value="">Select main location</option>
                  {mainLocations.map(m => (
                    <option key={m.mainTableLocationId} value={m.mainTableLocationId}>{m.mainLocationName}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Sub-Location Name</label>
                <input type="text" name="subLocationName" value={formData.subLocationName} onChange={handleChange}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none" placeholder="e.g. Zone A, Left Wing" />
              </div>
              <div className="flex gap-2">
                <button onClick={handleAdd} disabled={saving}
                  className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-50">
                  {saving ? 'Saving...' : 'Add Sub-Location'}
                </button>
                <button onClick={() => setShowForm(false)}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        <DataTable columns={columns} data={locations} />
      </div>
    </div>
  );
}