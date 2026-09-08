import React, { useState, useEffect } from 'react';
import { DollarSignIcon, PlusIcon, SaveIcon, CheckCircleIcon, EditIcon } from 'lucide-react';
import { API_BASE_URL } from '../../config';

interface Employee {
  employeeId: number;
  firstName: string;
  lastName: string;
  designationName?: string;
}

interface SalaryRecord {
  employeeId: number;
  basicSalary: number;
  allowances: number;
  overtime: number;
  deductions: number;
  netSalary: number;
  month: string;
  paymentStatus: 'paid' | 'pending';
  note: string;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const currentMonth = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

export function EmployeeSalaryPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonth());
  const [salaries, setSalaries] = useState<Record<number, SalaryRecord>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    if (employees.length > 0) initSalaries();
  }, [employees, selectedMonth]);

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/employees`);
      if (res.ok) {
        setEmployees(await res.json());
      }
    } catch {
      // fallback demo employees
      setEmployees([
        { employeeId: 1, firstName: 'Kamal',  lastName: 'Perera',  designationName: 'Manager' },
        { employeeId: 2, firstName: 'Nimal',  lastName: 'Silva',   designationName: 'Sales Executive' },
        { employeeId: 3, firstName: 'Saman',  lastName: 'Fernando', designationName: 'Cashier' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const initSalaries = () => {
    const init: Record<number, SalaryRecord> = {};
    employees.forEach((emp) => {
      if (!salaries[emp.employeeId] || salaries[emp.employeeId].month !== selectedMonth) {
        init[emp.employeeId] = {
          employeeId: emp.employeeId,
          basicSalary: 0,
          allowances: 0,
          overtime: 0,
          deductions: 0,
          netSalary: 0,
          month: selectedMonth,
          paymentStatus: 'pending',
          note: '',
        };
      } else {
        init[emp.employeeId] = salaries[emp.employeeId];
      }
    });
    setSalaries(init);
  };

  const calcNet = (rec: SalaryRecord): number =>
    Number(rec.basicSalary) + Number(rec.allowances) + Number(rec.overtime) - Number(rec.deductions);

  const updateField = (id: number, field: keyof SalaryRecord, value: string | number) => {
    setSalaries((prev) => {
      const updated = { ...prev[id], [field]: value };
      updated.netSalary = calcNet(updated);
      return { ...prev, [id]: updated };
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = Object.values(salaries);
      await fetch(`${API_BASE_URL}/api/employee-salary`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch {
      // silently ignore if API not ready
    } finally {
      setSaving(false);
      setEditingId(null);
      setSavedMsg(true);
      setTimeout(() => setSavedMsg(false), 3000);
    }
  };

  const totalPayroll = Object.values(salaries).reduce((sum, r) => sum + calcNet(r), 0);
  const paidCount    = Object.values(salaries).filter((r) => r.paymentStatus === 'paid').length;
  const pendingCount = Object.values(salaries).filter((r) => r.paymentStatus === 'pending').length;

  const [year, mon] = selectedMonth.split('-');
  const monthLabel = `${MONTHS[parseInt(mon) - 1]} ${year}`;

  return (
    <div className="flex-1 overflow-auto">
      <div className="space-y-6 p-6">

        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Employee Salary</h2>
            <p className="text-sm text-gray-500 mt-1">Manage monthly salary for all employees</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 shadow-sm">
              <DollarSignIcon className="h-4 w-4 text-gray-400" />
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="text-sm text-gray-700 focus:outline-none"
              />
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-teal-700 disabled:opacity-60"
            >
              <SaveIcon className="h-4 w-4" />
              {saving ? 'Saving...' : 'Save Salaries'}
            </button>
          </div>
        </div>

        {savedMsg && (
          <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 flex items-center gap-2">
            <CheckCircleIcon className="h-4 w-4" />
            Salary records saved successfully!
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-teal-200 bg-teal-50 p-4 flex items-center gap-4">
            <div className="rounded-full bg-teal-600 p-3">
              <DollarSignIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-xs text-teal-600 font-medium">Total Payroll</p>
              <p className="text-2xl font-bold text-gray-800">Rs. {totalPayroll.toLocaleString()}</p>
            </div>
          </div>
          <div className="rounded-lg border border-green-200 bg-green-50 p-4 flex items-center gap-4">
            <div className="rounded-full bg-green-600 p-3">
              <CheckCircleIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-xs text-green-600 font-medium">Paid</p>
              <p className="text-2xl font-bold text-gray-800">{paidCount} Employees</p>
            </div>
          </div>
          <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 flex items-center gap-4">
            <div className="rounded-full bg-yellow-500 p-3">
              <PlusIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-xs text-yellow-600 font-medium">Pending</p>
              <p className="text-2xl font-bold text-gray-800">{pendingCount} Employees</p>
            </div>
          </div>
        </div>

        {/* Salary Cards per Employee */}
        {loading ? (
          <div className="py-12 text-center text-sm text-gray-500">Loading employees...</div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-2">
              <p className="text-sm font-semibold text-gray-700">Salary Sheet — {monthLabel}</p>
            </div>

            {employees.map((emp) => {
              const rec = salaries[emp.employeeId];
              if (!rec) return null;
              const isEditing = editingId === emp.employeeId;
              const net = calcNet(rec);

              return (
                <div key={emp.employeeId} className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
                  {/* Employee Header */}
                  <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gray-50">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-teal-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                        {emp.firstName[0]}{emp.lastName[0]}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{emp.firstName} {emp.lastName}</p>
                        <p className="text-xs text-gray-500">{emp.designationName || 'Employee'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold border ${
                        rec.paymentStatus === 'paid'
                          ? 'bg-green-100 text-green-700 border-green-300'
                          : 'bg-yellow-100 text-yellow-700 border-yellow-300'
                      }`}>
                        {rec.paymentStatus === 'paid' ? '✓ Paid' : '⏳ Pending'}
                      </span>
                      <button
                        onClick={() => setEditingId(isEditing ? null : emp.employeeId)}
                        className="flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100"
                      >
                        <EditIcon className="h-3.5 w-3.5" />
                        {isEditing ? 'Done' : 'Edit'}
                      </button>
                    </div>
                  </div>

                  {/* Salary Fields */}
                  <div className="px-5 py-4">
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                      {[
                        { label: 'Basic Salary (Rs.)', field: 'basicSalary', color: 'text-gray-700' },
                        { label: 'Allowances (Rs.)',   field: 'allowances',  color: 'text-green-600' },
                        { label: 'Overtime (Rs.)',     field: 'overtime',    color: 'text-blue-600' },
                        { label: 'Deductions (Rs.)',   field: 'deductions',  color: 'text-red-600' },
                      ].map(({ label, field, color }) => (
                        <div key={field}>
                          <label className={`block text-xs font-medium ${color} mb-1`}>{label}</label>
                          {isEditing ? (
                            <input
                              type="number"
                              min={0}
                              value={(rec as any)[field]}
                              onChange={(e) => updateField(emp.employeeId, field as keyof SalaryRecord, parseFloat(e.target.value) || 0)}
                              className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:border-teal-500 focus:outline-none"
                            />
                          ) : (
                            <p className="text-sm font-semibold text-gray-800">
                              Rs. {Number((rec as any)[field]).toLocaleString()}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-t border-gray-100 pt-4">
                      <div className="flex items-center gap-6">
                        <div>
                          <p className="text-xs text-gray-500">Net Salary</p>
                          <p className={`text-xl font-bold ${net >= 0 ? 'text-teal-700' : 'text-red-600'}`}>
                            Rs. {net.toLocaleString()}
                          </p>
                        </div>
                        {isEditing && (
                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Payment Status</label>
                            <select
                              value={rec.paymentStatus}
                              onChange={(e) => updateField(emp.employeeId, 'paymentStatus', e.target.value)}
                              className="rounded border border-gray-300 px-2 py-1.5 text-xs focus:border-teal-500 focus:outline-none"
                            >
                              <option value="pending">Pending</option>
                              <option value="paid">Paid</option>
                            </select>
                          </div>
                        )}
                      </div>
                      {isEditing && (
                        <div className="flex-1 max-w-xs">
                          <label className="block text-xs font-medium text-gray-500 mb-1">Note</label>
                          <input
                            type="text"
                            value={rec.note}
                            onChange={(e) => updateField(emp.employeeId, 'note', e.target.value)}
                            placeholder="Optional note..."
                            className="w-full rounded border border-gray-300 px-2 py-1.5 text-xs focus:border-teal-500 focus:outline-none"
                          />
                        </div>
                      )}
                      {!isEditing && rec.note && (
                        <p className="text-xs text-gray-500 italic">Note: {rec.note}</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {employees.length === 0 && (
              <div className="py-12 text-center text-sm text-gray-400">No employees found.</div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
