import React, { useState, useEffect } from 'react';
import { DataTable, Column } from '../../components/DataTable';
import { PlusIcon, EditIcon, TrashIcon } from 'lucide-react';
import { API_BASE_URL } from '../../config';

interface Employee {
  employeeId: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  designationId: number | null;
  titleId: number | null;
  designationName?: string;
  titleName?: string;
  joiningDate: string;
  status: number;
}

interface FormData {
  employeeId?: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  designationId: number;
  titleId: number;
  joiningDate: string;
  status: number;
}

const BASE_URL = `${API_BASE_URL}/api/employees`;
const DESIGNATION_URL = `${API_BASE_URL}/api/employee-designations`;
const TITLE_URL = `${API_BASE_URL}/api/employee-titles`;

const defaultForm: FormData = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  designationId: 0,
  titleId: 0,
  joiningDate: '',
  status: 1,
};

export function EmployeeManagementPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [designations, setDesignations] = useState<any[]>([]);
  const [titles, setTitles] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<FormData>(defaultForm);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchEmployees();
    fetchDesignations();
    fetchTitles();
  }, []);

  const fetchEmployees = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(BASE_URL);
      if (!res.ok) throw new Error('Failed to fetch employees');
      const data = await res.json();
      setEmployees(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchDesignations = async () => {
    try {
      const res = await fetch(DESIGNATION_URL);
      if (res.ok) setDesignations(await res.json());
    } catch {}
  };

  const fetchTitles = async () => {
    try {
      const res = await fetch(TITLE_URL);
      if (res.ok) setTitles(await res.json());
    } catch {}
  };

  const handleSubmit = async () => {
    if (!formData.firstName.trim() || !formData.lastName.trim()) return;
    setError(null);
    try {
      const method = isEditing ? 'PUT' : 'POST';
      const res = await fetch(BASE_URL, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error(`Failed to ${isEditing ? 'update' : 'create'} employee`);
      await fetchEmployees();
      resetForm();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleEdit = (emp: Employee) => {
    setFormData({
      employeeId: emp.employeeId,
      firstName: emp.firstName,
      lastName: emp.lastName,
      email: emp.email,
      phone: emp.phone,
      designationId: emp.designationId || 0,
      titleId: emp.titleId || 0,
      joiningDate: emp.joiningDate,
      status: emp.status,
    });
    setIsEditing(true);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this employee?')) return;
    setError(null);
    try {
      const res = await fetch(`${BASE_URL}/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete employee');
      await fetchEmployees();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const resetForm = () => {
    setFormData(defaultForm);
    setIsEditing(false);
    setShowForm(false);
  };

  const columns: Column<Employee>[] = [
    { header: 'Title', accessor: (row) => row.titleName || '-' },
    { header: 'First Name', accessor: 'firstName' },
    { header: 'Last Name', accessor: 'lastName' },
    { header: 'Email', accessor: 'email' },
    { header: 'Phone', accessor: 'phone' },
    { header: 'Designation', accessor: (row) => row.designationName || '-' },
    { header: 'Joining Date', accessor: 'joiningDate' },
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
          <button onClick={() => handleDelete(row.employeeId)} className="text-red-600 hover:text-red-800">
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
          <h2 className="text-2xl font-bold text-gray-900">Employee Management</h2>
          <button
            onClick={() => { resetForm(); setShowForm(true); }}
            className="flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-teal-700"
          >
            <PlusIcon className="h-4 w-4" />
            Add Employee
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
              {isEditing ? 'Edit Employee' : 'Add New Employee'}
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">Title</label>
                <select
                  value={formData.titleId}
                  onChange={(e) => setFormData({ ...formData, titleId: Number(e.target.value) })}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none"
                >
                  <option value={0}>Select Title</option>
                  {titles.map((t: any) => (
                    <option key={t.titleId} value={t.titleId}>{t.titleName}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Designation</label>
                <select
                  value={formData.designationId}
                  onChange={(e) => setFormData({ ...formData, designationId: Number(e.target.value) })}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none"
                >
                  <option value={0}>Select Designation</option>
                  {designations.map((d: any) => (
                    <option key={d.designationId} value={d.designationId}>{d.designationName}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">First Name</label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none"
                  placeholder="Enter first name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Last Name</label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none"
                  placeholder="Enter last name"
                />
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
                <label className="block text-sm font-medium text-gray-700">Phone</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none"
                  placeholder="Enter phone number"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Joining Date</label>
                <input
                  type="date"
                  value={formData.joiningDate}
                  onChange={(e) => setFormData({ ...formData, joiningDate: e.target.value })}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none"
                />
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
                {isEditing ? 'Update Employee' : 'Add Employee'}
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
          <div className="py-12 text-center text-sm text-gray-500">Loading employees...</div>
        ) : (
          <DataTable columns={columns} data={employees} />
        )}

      </div>
    </div>
  );
}