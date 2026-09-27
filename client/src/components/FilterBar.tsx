import React from 'react';
import { Filter, SlidersHorizontal, RotateCcw } from 'lucide-react';

interface FilterBarProps {
  department: string;
  year: string;
  semester: string;
  unit: string;
  materialType: string;
  sort: string;
  onFilterChange: (filters: {
    department?: string;
    year?: string;
    semester?: string;
    unit?: string;
    materialType?: string;
    sort?: string;
  }) => void;
  onReset: () => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  department,
  year,
  semester,
  unit,
  materialType,
  sort,
  onFilterChange,
  onReset,
}) => {
  const departments = [
    'All',
    'Computer Science & Engineering',
    'Information Technology',
    'Electronics & Communication',
    'Applied Mathematics',
    'Cyber Security',
  ];

  const years = ['All', '1st Year', '2nd Year', '3rd Year', '4th Year'];

  const semesters = [
    'All',
    'Semester 1',
    'Semester 2',
    'Semester 3',
    'Semester 4',
    'Semester 5',
    'Semester 6',
    'Semester 7',
    'Semester 8',
  ];

  const units = ['All', 'Unit 1', 'Unit 2', 'Unit 3', 'Unit 4', 'Unit 5'];

  const materialTypes = [
    'All',
    'Notes',
    'Question Bank',
    'Lab Manual',
    'Cheat Sheet',
    'Presentation',
    'Syllabus',
  ];

  const hasActiveFilters =
    department !== 'All' ||
    year !== 'All' ||
    semester !== 'All' ||
    unit !== 'All' ||
    materialType !== 'All';

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm mb-6 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-indigo-600" />
          <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Academic Filters & Sorting
          </span>
          {hasActiveFilters && (
            <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-semibold">
              Filtered
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {hasActiveFilters && (
            <button
              onClick={onReset}
              className="text-xs text-rose-600 hover:text-rose-800 font-medium flex items-center gap-1 transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Filters
            </button>
          )}

          {/* Sort order */}
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <span className="font-semibold text-slate-700">Sort:</span>
            <select
              value={sort}
              onChange={(e) => onFilterChange({ sort: e.target.value })}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-medium text-slate-800 focus:outline-none focus:border-indigo-500"
            >
              <option value="newest">Newest First</option>
              <option value="most_downloaded">Most Downloaded</option>
              <option value="highest_rated">Highest Rated</option>
            </select>
          </div>
        </div>
      </div>

      {/* Filter Selectors Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* Department */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-500 mb-1">Department</label>
          <select
            value={department}
            onChange={(e) => onFilterChange({ department: e.target.value })}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 focus:bg-white focus:border-indigo-500 outline-none"
          >
            {departments.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>

        {/* Year */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-500 mb-1">Academic Year</label>
          <select
            value={year}
            onChange={(e) => onFilterChange({ year: e.target.value })}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 focus:bg-white focus:border-indigo-500 outline-none"
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>

        {/* Semester */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-500 mb-1">Semester</label>
          <select
            value={semester}
            onChange={(e) => onFilterChange({ semester: e.target.value })}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 focus:bg-white focus:border-indigo-500 outline-none"
          >
            {semesters.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        {/* Unit */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-500 mb-1">Curriculum Unit</label>
          <select
            value={unit}
            onChange={(e) => onFilterChange({ unit: e.target.value })}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 focus:bg-white focus:border-indigo-500 outline-none"
          >
            {units.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>
        </div>

        {/* Material Type */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-500 mb-1">Document Type</label>
          <select
            value={materialType}
            onChange={(e) => onFilterChange({ materialType: e.target.value })}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 focus:bg-white focus:border-indigo-500 outline-none"
          >
            {materialTypes.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};
