import React, { useState, useEffect } from 'react';
import { DataTable, Column } from '../../components/DataTable';
import { PlusIcon, EditIcon, TrashIcon, EyeIcon, EyeOffIcon } from 'lucide-react';
import { API_BASE_URL } from '../../config';

interface UserAccount {
  userId: number;
  username: string;
  email: string;
  employeeId: number | null;
  employeeName?: string;
  roleId: number | null;
  roleName?: string;
  status: number;
  createdAt: string;
}

interface FormData {
  userId?: number;
  username: string;
  password: string;
  email: string;
  employeeId: number;
  roleId: number;
  status: number;
}

const BASE_URL = `${API_BASE_URL}/api/user-accounts`;
const EMPLOYEE_URL = `${API_BASE_URL}/api/employees`;
const ROLE_URL = `${API_BASE_URL}/api/user-roles`;

const defaultForm: FormData = {
  username: '',
  password: '',
  email: '',
  employeeId: 0,
  roleId: 0,
  status: 1,
};

export function UserAccountManagementPage() {
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<FormData>(defaultForm);
  const [isEditing, setIsEditing] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
    fetchEmployees();
    fetchRoles();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(BASE_URL);
      if (!res.ok) throw new Error('Failed to fetch user accounts');
      setUsers(await res.json());
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await fetch(EMPLOYEE_URL);
      if (res.ok) setEmployees(await res.json());
    } catch {}
  };

  const fetchRoles = async () => {
    try {
      const res = await fetch(ROLE_URL);
      if (res.ok) setRoles(await res.json());
    } catch {}
  };

  const handleSubmit = async () => {
    if (!formData.username.trim()) return;
    setError(null);
    try {
      const method = isEditing ? 'PUT' : 'POST';
      const res = await fetch(BASE_URL, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error(`Failed to ${isEditing ? 'update' : 'create'} user account`);
      await fetchUsers();
      resetForm();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleEdit = (user: UserAccount) => {
    setFormData({
      userId: user.userId,
      username: user.username,
      password: '',
      email: user.email,
      employeeId: user.employeeId || 0,
      roleId: user.roleId || 0,
      status: user.status,
    });
    setIsEditing(true);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this user account?')) return;
    setError(null);
    try {
      const res = await fetch(`${BASE_URL}/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete user account');
      await fetchUsers();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const resetForm = () => {
    setFormData(defaultForm);
    setIsEditing(false);
    setShowForm(false);
    setShowPassword(false);
  };

  const columns: Column<UserAccount>[] = [
    { header: 'Username', accessor: 'username' },
    { header: 'Email', accessor: 'email' },
    { header: 'Employee', accessor: (row) => row.employeeName || '-' },
    { header: 'Role', accessor: (row) => row.roleName || '-' },
    { header: 'Created At', accessor: 'createdAt' },
    {
      header: 'Status',
      accessor: (row) => (
        <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
          row.status === 1 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
        }`}>
          {row.status === 1 ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      header: 'Actions',
      accessor: (row) => (
        <div className="flex gap-2">
          <button onClick={() => handleEdit(row)} className="text-blue-600 hover:text-blue-800">
            <EditIcon className="h-4 w-4" />
          </button>
          <button onClick={() => handleDelete(row.userId)} className="text-red-600 hover:text-red-800">
            <TrashIcon className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex-1 overflow-auto">
      <div className="space-y-6 p-6">

        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">User Account Management</h2>
          <button
            onClick={() => { resetForm(); setShowForm(true); }}
            className="flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-teal-700"
          >
            <PlusIcon className="h-4 w-4" />
            Add User Account
          </button>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {showForm && (
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">
              {isEditing ? 'Edit User Account' : 'Add New User Account'}
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">Username</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none"
                  placeholder="Enter username"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  {isEditing ? 'New Password (leave blank to keep current)' : 'Password'}
                </label>
                <div className="relative mt-1">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="block w-full rounded-lg border border-gray-300 px-3 py-2 pr-10 text-sm focus:border-teal-500 focus:outline-none"
                    placeholder="Enter password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none"
                  placeholder="Enter email"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Linked Employee</label>
                <select
                  value={formData.employeeId}
                  onChange={(e) => setFormData({ ...formData, employeeId: Number(e.target.value) })}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none"
                >
                  <option value={0}>Select Employee</option>
                  {employees.map((emp: any) => (
                    <option key={emp.employeeId} value={emp.employeeId}>
                      {emp.firstName} {emp.lastName}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Role</label>
                <select
                  value={formData.roleId}
                  onChange={(e) => setFormData({ ...formData, roleId: Number(e.target.value) })}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none"
                >
                  <option value={0}>Select Role</option>
                  {roles.map((r: any) => (
                    <option key={r.roleId} value={r.roleId}>{r.roleName}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: Number(e.target.value) })}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none"
                >
                  <option value={1}>Active</option>
                  <option value={2}>Inactive</option>
                </select>
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <button
                onClick={handleSubmit}
                className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700"
              >
                {isEditing ? 'Update Account' : 'Add Account'}
              </button>
              <button
                onClick={resetForm}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="py-12 text-center text-sm text-gray-500">Loading user accounts...</div>
        ) : (
          <DataTable columns={columns} data={users} />
        )}

      </div>
    </div>
  );
}