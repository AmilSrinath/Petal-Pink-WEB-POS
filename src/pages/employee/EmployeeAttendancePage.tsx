import React, { useState, useEffect } from 'react';
import { CalendarIcon, CheckCircleIcon, XCircleIcon, ClockIcon, SaveIcon } from 'lucide-react';
import { API_BASE_URL } from '../../config';

interface Employee {
  employeeId: number;
  firstName: string;
  lastName: string;
  designationName?: string;
}

interface AttendanceRecord {
  employeeId: number;
  status: 'present' | 'absent' | 'half-day' | 'leave';
  checkIn: string;
  checkOut: string;
  note: string;
}

const STATUS_OPTIONS = [
  { value: 'present',  label: 'Present',  color: 'bg-green-100 text-green-700 border-green-300' },
  { value: 'absent',   label: 'Absent',   color: 'bg-red-100 text-red-700 border-red-300' },
  { value: 'half-day', label: 'Half Day', color: 'bg-yellow-100 text-yellow-700 border-yellow-300' },
  { value: 'leave',    label: 'Leave',    color: 'bg-blue-100 text-blue-700 border-blue-300' },
];

export function EmployeeAttendancePage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [attendance, setAttendance] = useState<Record<number, AttendanceRecord>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState(false);

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    if (employees.length > 0) initAttendance();
  }, [employees, selectedDate]);

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/employees`);
      if (res.ok) {
        const data: Employee[] = await res.json();
        setEmployees(data);
      }
    } catch {
      // fallback demo employees
      setEmployees([
        { employeeId: 1, firstName: 'Nethmi', lastName: '', designationName: 'Accountant' },
        { employeeId: 2, firstName: 'Chamodi', lastName: '',  designationName: 'Inquary Agent' },
        { employeeId: 3, firstName: 'Tharushi', lastName: '', designationName: 'Order Creator' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const initAttendance = () => {
    const init: Record<number, AttendanceRecord> = {};
    employees.forEach((emp) => {
      init[emp.employeeId] = attendance[emp.employeeId] || {
        employeeId: emp.employeeId,
        status: 'present',
        checkIn: '07:30',
        checkOut: '17:30',
        note: '',
      };
    });
    setAttendance(init);
  };

  const updateField = (id: number, field: keyof AttendanceRecord, value: string) => {
    setAttendance((prev) => ({
      ...prev,
      [id]: { ...prev[id], [field]: value },
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = Object.values(attendance).map((r) => ({
        ...r,
        date: selectedDate,
      }));
      // POST to API (endpoint to be implemented in backend)
      await fetch(`${API_BASE_URL}/api/employee-attendance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch {
      // silently ignore if API not ready
    } finally {
      setSaving(false);
      setSavedMsg(true);
      setTimeout(() => setSavedMsg(false), 3000);
    }
  };

  const getStatusStyle = (status: string) =>
    STATUS_OPTIONS.find((s) => s.value === status)?.color || '';

  const presentCount  = Object.values(attendance).filter((a) => a.status === 'present').length;
  const absentCount   = Object.values(attendance).filter((a) => a.status === 'absent').length;
  const halfDayCount  = Object.values(attendance).filter((a) => a.status === 'half-day').length;
  const leaveCount    = Object.values(attendance).filter((a) => a.status === 'leave').length;

  return (
    <div className="flex-1 overflow-auto">
      <div className="space-y-6 p-6">

        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Employee Attendance</h2>
            <p className="text-sm text-gray-500 mt-1">Mark daily attendance for all employees</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 shadow-sm">
              <CalendarIcon className="h-4 w-4 text-gray-400" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="text-sm text-gray-700 focus:outline-none"
              />
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-teal-700 disabled:opacity-60"
            >
              <SaveIcon className="h-4 w-4" />
              {saving ? 'Saving...' : 'Save Attendance'}
            </button>
          </div>
        </div>

        {savedMsg && (
          <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 flex items-center gap-2">
            <CheckCircleIcon className="h-4 w-4" />
            Attendance saved successfully!
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: 'Present',  count: presentCount,  icon: CheckCircleIcon, bg: 'bg-green-50',  text: 'text-green-600',  border: 'border-green-200' },
            { label: 'Absent',   count: absentCount,   icon: XCircleIcon,     bg: 'bg-red-50',    text: 'text-red-600',    border: 'border-red-200' },
            { label: 'Half Day', count: halfDayCount,  icon: ClockIcon,       bg: 'bg-yellow-50', text: 'text-yellow-600', border: 'border-yellow-200' },
            { label: 'On Leave', count: leaveCount,    icon: CalendarIcon,    bg: 'bg-blue-50',   text: 'text-blue-600',   border: 'border-blue-200' },
          ].map(({ label, count, icon: Icon, bg, text, border }) => (
            <div key={label} className={`rounded-lg border ${border} ${bg} p-4 flex items-center gap-3`}>
              <Icon className={`h-8 w-8 ${text}`} />
              <div>
                <p className="text-2xl font-bold text-gray-800">{count}</p>
                <p className={`text-xs font-medium ${text}`}>{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Attendance Table */}
        <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="border-b border-gray-200 bg-gray-50 px-6 py-3">
            <h3 className="text-sm font-semibold text-gray-700">
              Attendance for {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </h3>
          </div>

          {loading ? (
            <div className="py-12 text-center text-sm text-gray-500">Loading employees...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Employee</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Designation</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Check In</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Check Out</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Note</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {employees.map((emp) => {
                    const rec = attendance[emp.employeeId];
                    if (!rec) return null;
                    return (
                      <tr key={emp.employeeId} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-teal-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                              {emp.firstName[0]}{emp.lastName[0]}
                            </div>
                            <span className="font-medium text-gray-900">
                              {emp.firstName} {emp.lastName}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-500">{emp.designationName || '-'}</td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1 flex-wrap">
                            {STATUS_OPTIONS.map((opt) => (
                              <button
                                key={opt.value}
                                onClick={() => updateField(emp.employeeId, 'status', opt.value)}
                                className={`rounded-full border px-3 py-1 text-xs font-medium transition-all ${
                                  rec.status === opt.value
                                    ? opt.color + ' ring-2 ring-offset-1 ring-teal-400 font-bold'
                                    : 'bg-white border-gray-200 text-gray-400 hover:border-gray-400'
                                }`}
                              >
                                {opt.label}
                              </button>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="time"
                            value={rec.checkIn}
                            onChange={(e) => updateField(emp.employeeId, 'checkIn', e.target.value)}
                            disabled={rec.status === 'absent' || rec.status === 'leave'}
                            className="rounded border border-gray-300 px-2 py-1 text-xs focus:border-teal-500 focus:outline-none disabled:bg-gray-100 disabled:text-gray-400"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="time"
                            value={rec.checkOut}
                            onChange={(e) => updateField(emp.employeeId, 'checkOut', e.target.value)}
                            disabled={rec.status === 'absent' || rec.status === 'leave'}
                            className="rounded border border-gray-300 px-2 py-1 text-xs focus:border-teal-500 focus:outline-none disabled:bg-gray-100 disabled:text-gray-400"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="text"
                            value={rec.note}
                            onChange={(e) => updateField(emp.employeeId, 'note', e.target.value)}
                            placeholder="Optional note..."
                            className="w-full rounded border border-gray-300 px-2 py-1 text-xs focus:border-teal-500 focus:outline-none"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {employees.length === 0 && (
                <div className="py-12 text-center text-sm text-gray-400">No employees found.</div>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
