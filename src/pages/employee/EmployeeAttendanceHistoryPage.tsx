import React, { useEffect, useMemo, useState } from 'react';
import {
  CalendarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  SearchIcon,
  UsersIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  Loader2Icon,
} from 'lucide-react';
import { API_BASE_URL } from '../../config';

interface AttendanceRecord {
  attendanceId: number;
  employeeId: number;
  employeeName: string;
  date: string; // YYYY-MM-DD
  status: 'present' | 'absent' | 'half-day' | 'leave' | string;
  checkIn: string;
  checkOut: string;
  note: string;
}

// employeeId -> day (1..31) -> record
type MonthMatrix = Record<number, Record<number, AttendanceRecord>>;

const STATUS_META: Record<string, { label: string; letter: string; badge: string; dot: string }> = {
  present:  { label: 'Present',  letter: 'P', badge: 'bg-green-100 text-green-700 border-green-300',   dot: 'bg-green-500' },
  absent:   { label: 'Absent',   letter: 'A', badge: 'bg-red-100 text-red-700 border-red-300',         dot: 'bg-red-500' },
  'half-day': { label: 'Half Day', letter: 'H', badge: 'bg-yellow-100 text-yellow-700 border-yellow-300', dot: 'bg-yellow-500' },
  leave:    { label: 'Leave',    letter: 'L', badge: 'bg-blue-100 text-blue-700 border-blue-300',      dot: 'bg-blue-500' },
};

function pad(n: number) {
  return n.toString().padStart(2, '0');
}

function daysInMonth(year: number, month: number) {
  // month is 1-indexed here
  return new Date(year, month, 0).getDate();
}

function currentYearMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}`;
}

export function EmployeeAttendanceHistoryPage() {
  const [yearMonth, setYearMonth] = useState<string>(currentYearMonth());
  const [matrix, setMatrix] = useState<MonthMatrix>({});
  const [employeeNames, setEmployeeNames] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [error, setError] = useState<string>('');
  const [search, setSearch] = useState('');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(null);

  const [year, month] = yearMonth.split('-').map(Number);
  const totalDays = daysInMonth(year, month);
  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() + 1 === month;
  const lastDayToFetch = isCurrentMonth ? today.getDate() : totalDays;

  useEffect(() => {
    fetchMonth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [yearMonth]);

  const fetchMonth = async () => {
    setLoading(true);
    setError('');
    setSelectedEmployeeId(null);
    const newMatrix: MonthMatrix = {};
    const names: Record<number, string> = {};
    const dayList = Array.from({ length: lastDayToFetch }, (_, i) => i + 1);
    setProgress({ done: 0, total: dayList.length });

    // Fetch in small batches to avoid hammering the API all at once
    const BATCH_SIZE = 6;
    let hadError = false;

    for (let i = 0; i < dayList.length; i += BATCH_SIZE) {
      const batch = dayList.slice(i, i + BATCH_SIZE);
      const results = await Promise.all(
        batch.map(async (day) => {
          const dateStr = `${year}-${pad(month)}-${pad(day)}`;
          try {
            const res = await fetch(`${API_BASE_URL}/api/employee-attendance?date=${dateStr}`);
            if (!res.ok) return { day, records: [] as AttendanceRecord[] };
            const data: AttendanceRecord[] = await res.json();
            return { day, records: data };
          } catch {
            hadError = true;
            return { day, records: [] as AttendanceRecord[] };
          }
        })
      );

      results.forEach(({ day, records }) => {
        records.forEach((rec) => {
          if (!newMatrix[rec.employeeId]) newMatrix[rec.employeeId] = {};
          newMatrix[rec.employeeId][day] = rec;
          names[rec.employeeId] = rec.employeeName;
        });
      });

      setProgress((p) => ({ ...p, done: Math.min(p.total, i + batch.length) }));
    }

    setMatrix(newMatrix);
    setEmployeeNames(names);
    if (hadError) setError('Some days could not be loaded. Pull to refresh or try again.');
    setLoading(false);
  };

  const employeeIds = useMemo(() => {
    const ids = Object.keys(matrix).map(Number);
    return ids
      .filter((id) => employeeNames[id]?.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => (employeeNames[a] || '').localeCompare(employeeNames[b] || ''));
  }, [matrix, employeeNames, search]);

  const summaryFor = (employeeId: number) => {
    const days = matrix[employeeId] || {};
    const counts = { present: 0, absent: 0, 'half-day': 0, leave: 0, total: 0 };
    Object.values(days).forEach((rec) => {
      counts.total += 1;
      if (counts[rec.status as keyof typeof counts] !== undefined) {
        (counts as any)[rec.status] += 1;
      }
    });
    return counts;
  };

  const goToMonth = (offset: number) => {
    const d = new Date(year, month - 1 + offset, 1);
    setYearMonth(`${d.getFullYear()}-${pad(d.getMonth() + 1)}`);
  };

  const monthLabel = new Date(year, month - 1, 1).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  const dayHeaders = Array.from({ length: totalDays }, (_, i) => i + 1);

  const selectedRecords = selectedEmployeeId
    ? Object.entries(matrix[selectedEmployeeId] || {})
        .map(([day, rec]) => ({ day: Number(day), ...rec }))
        .sort((a, b) => a.day - b.day)
    : [];

  return (
    <div className="flex-1 overflow-auto">
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Employee Attendance History</h2>
            <p className="text-sm text-gray-500 mt-1">Monthly attendance overview for all employees</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => goToMonth(-1)}
              className="rounded-lg border border-gray-300 bg-white p-2 text-gray-500 hover:bg-gray-50"
              title="Previous month"
            >
              <ChevronLeftIcon className="h-4 w-4" />
            </button>
            <div className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 shadow-sm">
              <CalendarIcon className="h-4 w-4 text-gray-400" />
              <input
                type="month"
                value={yearMonth}
                onChange={(e) => setYearMonth(e.target.value)}
                className="text-sm text-gray-700 focus:outline-none"
              />
            </div>
            <button
              onClick={() => goToMonth(1)}
              disabled={
                year === today.getFullYear() && month === today.getMonth() + 1
              }
              className="rounded-lg border border-gray-300 bg-white p-2 text-gray-500 hover:bg-gray-50 disabled:opacity-40"
              title="Next month"
            >
              <ChevronRightIcon className="h-4 w-4" />
            </button>
          </div>
        </div>

        {error && (
          <div className="rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-700">
            {error}
          </div>
        )}

        {loading && (
          <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-500 shadow-sm">
            <Loader2Icon className="h-4 w-4 animate-spin text-teal-600" />
            Loading {monthLabel}... ({progress.done}/{progress.total} days)
          </div>
        )}

        {!loading && employeeIds.length === 0 && (
          <div className="rounded-lg border border-gray-200 bg-white p-12 text-center text-sm text-gray-400 shadow-sm">
            No attendance records found for {monthLabel}.
          </div>
        )}

        {!loading && employeeIds.length > 0 && (
          <>
            {/* Search + legend */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 shadow-sm w-full sm:w-72">
                <SearchIcon className="h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search employee..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full text-sm text-gray-700 focus:outline-none"
                />
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                {Object.entries(STATUS_META).map(([key, meta]) => (
                  <div key={key} className="flex items-center gap-1.5">
                    <span className={`h-2.5 w-2.5 rounded-full ${meta.dot}`} />
                    {meta.label} ({meta.letter})
                  </div>
                ))}
              </div>
            </div>

            {/* Monthly matrix table */}
            <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
              <div className="border-b border-gray-200 bg-gray-50 px-6 py-3 flex items-center gap-2">
                <UsersIcon className="h-4 w-4 text-gray-500" />
                <h3 className="text-sm font-semibold text-gray-700">{monthLabel}</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="sticky left-0 z-10 bg-gray-50 px-3 py-2 text-left font-semibold text-gray-600 uppercase tracking-wide min-w-[140px]">
                        Employee
                      </th>
                      {dayHeaders.map((d) => (
                        <th key={d} className="px-1.5 py-2 text-center font-medium text-gray-500 w-8">
                          {d}
                        </th>
                      ))}
                      <th className="px-3 py-2 text-center font-semibold text-gray-600 uppercase tracking-wide">
                        Present
                      </th>
                      <th className="px-3 py-2 text-center font-semibold text-gray-600 uppercase tracking-wide">
                        Absent
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {employeeIds.map((empId) => {
                      const s = summaryFor(empId);
                      return (
                        <tr
                          key={empId}
                          onClick={() => setSelectedEmployeeId(empId)}
                          className={`cursor-pointer hover:bg-teal-50/60 transition-colors ${
                            selectedEmployeeId === empId ? 'bg-teal-50' : ''
                          }`}
                        >
                          <td className="sticky left-0 z-10 bg-white px-3 py-2 font-medium text-gray-800 whitespace-nowrap">
                            {employeeNames[empId]}
                          </td>
                          {dayHeaders.map((d) => {
                            const rec = matrix[empId]?.[d];
                            const meta = rec ? STATUS_META[rec.status] : undefined;
                            return (
                              <td key={d} className="px-1 py-2 text-center">
                                {meta ? (
                                  <span
                                    title={
                                      rec
                                        ? `${meta.label} • In: ${rec.checkIn || '-'} • Out: ${rec.checkOut || '-'}${
                                            rec.note ? ' • ' + rec.note : ''
                                          }`
                                        : ''
                                    }
                                    className={`inline-flex h-5 w-5 items-center justify-center rounded-full border text-[10px] font-bold ${meta.badge}`}
                                  >
                                    {meta.letter}
                                  </span>
                                ) : (
                                  <span className="text-gray-300">–</span>
                                )}
                              </td>
                            );
                          })}
                          <td className="px-3 py-2 text-center font-semibold text-green-600">{s.present}</td>
                          <td className="px-3 py-2 text-center font-semibold text-red-500">{s.absent}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Selected employee detail */}
            {selectedEmployeeId && (
              <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
                <div className="border-b border-gray-200 bg-gray-50 px-6 py-3 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-700">
                    {employeeNames[selectedEmployeeId]} — Daily Detail ({monthLabel})
                  </h3>
                  <button
                    onClick={() => setSelectedEmployeeId(null)}
                    className="text-xs text-gray-400 hover:text-gray-600"
                  >
                    Close
                  </button>
                </div>

                {/* Summary cards for the selected employee */}
                <div className="grid grid-cols-2 gap-4 p-4 sm:grid-cols-4">
                  {(() => {
                    const s = summaryFor(selectedEmployeeId);
                    const cards = [
                      { label: 'Present', count: s.present, icon: CheckCircleIcon, bg: 'bg-green-50', text: 'text-green-600', border: 'border-green-200' },
                      { label: 'Absent', count: s.absent, icon: XCircleIcon, bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-200' },
                      { label: 'Half Day', count: s['half-day'], icon: ClockIcon, bg: 'bg-yellow-50', text: 'text-yellow-600', border: 'border-yellow-200' },
                      { label: 'Leave', count: s.leave, icon: CalendarIcon, bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200' },
                    ];
                    return cards.map(({ label, count, icon: Icon, bg, text, border }) => (
                      <div key={label} className={`rounded-lg border ${border} ${bg} p-4 flex items-center gap-3`}>
                        <Icon className={`h-6 w-6 ${text}`} />
                        <div>
                          <p className="text-xl font-bold text-gray-800">{count}</p>
                          <p className={`text-xs font-medium ${text}`}>{label}</p>
                        </div>
                      </div>
                    ));
                  })()}
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 bg-gray-50">
                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Date</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Status</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Check In</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Check Out</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Note</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {selectedRecords.map((rec) => {
                        const meta = STATUS_META[rec.status];
                        return (
                          <tr key={rec.day} className="hover:bg-gray-50">
                            <td className="px-4 py-2 text-gray-700">
                              {new Date(year, month - 1, rec.day).toLocaleDateString('en-US', {
                                weekday: 'short',
                                month: 'short',
                                day: 'numeric',
                              })}
                            </td>
                            <td className="px-4 py-2">
                              <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${meta?.badge || ''}`}>
                                {meta?.label || rec.status}
                              </span>
                            </td>
                            <td className="px-4 py-2 text-gray-600">{rec.checkIn || '-'}</td>
                            <td className="px-4 py-2 text-gray-600">{rec.checkOut || '-'}</td>
                            <td className="px-4 py-2 text-gray-500">{rec.note || '-'}</td>
                          </tr>
                        );
                      })}
                      {selectedRecords.length === 0 && (
                        <tr>
                          <td colSpan={5} className="px-4 py-6 text-center text-gray-400">
                            No records for this employee this month.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
