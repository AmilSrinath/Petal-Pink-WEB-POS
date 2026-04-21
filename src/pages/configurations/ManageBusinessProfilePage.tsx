import React, { useState } from 'react';
import { DataTable, Column } from '../../components/DataTable';
import { TrashIcon } from 'lucide-react';

interface BusinessProfile {
  id: string;
  profile: string;
}

const mockProfiles: BusinessProfile[] = [];

export function ManageBusinessProfilePage() {
  const [profiles, setProfiles] = useState(mockProfiles);
  const [inputValue, setInputValue] = useState('');

  const handleAddProfile = () => {
    if (inputValue.trim()) {
      const newProfile: BusinessProfile = {
        id: String(profiles.length + 1),
        profile: inputValue.trim(),
      };
      setProfiles([...profiles, newProfile]);
      setInputValue('');
    }
  };

  const handleDeleteProfile = (id: string) => {
    setProfiles(profiles.filter(p => p.id !== id));
  };

  const columns: Column<BusinessProfile>[] = [
    { header: 'Profile', accessor: 'profile' },
    {
      header: 'Actions',
      accessor: (row) => (
        <button
          onClick={() => handleDeleteProfile(row.id)}
          className="text-red-600 hover:text-red-800"
          title="Delete"
        >
          <TrashIcon className="h-4 w-4" />
        </button>
      ),
    },
  ];

  return (
    <div className="flex-1 overflow-auto">
      <div className="space-y-6 p-6">
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-end gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Profile</label>
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddProfile()}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none"
                placeholder="Enter profile"
              />
            </div>
            <button
              onClick={handleAddProfile}
              className="rounded-lg bg-teal-600 px-6 py-2 text-sm font-medium text-white shadow-sm hover:bg-teal-700"
            >
              Add Profile
            </button>
          </div>
        </div>

        <DataTable columns={columns} data={profiles} />
      </div>
    </div>
  );
}
