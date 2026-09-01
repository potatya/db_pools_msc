import { useState, useEffect, useMemo, useCallback } from "react";
import { createClient } from '@supabase/supabase-js';
import { STATUS_LABELS, type Pool, type PoolStatus } from "./data/pools";
import { PoolForm } from "./components/PoolForm";
import { createPortal } from "react-dom";

// --- Инициализация Supabase с проверкой ---
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log("🔍 SUPABASE_URL:", supabaseUrl);
console.log("🔍 SUPABASE_KEY:", supabaseKey ? "✅ установлен" : "❌ отсутствует");

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Переменные окружения не найдены!");
}
const supabase = createClient(supabaseUrl, supabaseKey);

const ALL = "all" as const;
type FilterStatus = PoolStatus | typeof ALL;

const STATUS_COLORS: Record<PoolStatus, { bg: string; text: string; dot: string; border: string }> = {
  active: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500", border: "border-emerald-200" },
  negotiating: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500", border: "border-amber-200" },
  closed: { bg: "bg-slate-100", text: "text-slate-600", dot: "bg-slate-400", border: "border-slate-200" },
  blacklist: { bg: "bg-red-50", text: "text-red-700", dot: "bg-red-500", border: "border-red-200" },
  unconfirmed: { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-400", border: "border-blue-200" },
};

function StatusBadge({ status }: { status: PoolStatus }) {
  const c = STATUS_COLORS[status];
  return (
    <span className={`${c.bg} ${c.text} text-xs font-medium px-2 py-0.5 rounded-full inline-flex items-center gap-1 border ${c.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`}></span>
      {STATUS_LABELS[status]}
    </span>
  );
}

function EditBtn({ onClick }: { onClick: (e: React.MouseEvent) => void }) {
  return (
    <button
      onClick={onClick}
      className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded hover:bg-slate-100"
      aria-label="Редактировать"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
      </svg>
    </button>
  );
}

function DeleteBtn({ onClick }: { onClick: (e: React.MouseEvent) => void }) {
  return (
    <button
      onClick={onClick}
      className="text-slate-400 hover:text-red-600 transition-colors p-1 rounded hover:bg-red-50"
      aria-label="Удалить"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 6h18" />
        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
        <path d="M19 6l-1 14c0 1-1 2-2 2H8c-1 0-2-1-2-2L5 6" />
      </svg>
    </button>
  );
}

function TriBool({ value }: { value: boolean | null }) {
  if (value === true) return <span className="text-emerald-600 font-medium text-sm">✓</span>;
  if (value === false) return <span className="text-slate-300 text-sm">×</span>;
  return <span className="text-slate-300 text-sm">·</span>;
}

function PoolCard({ pool, onEdit, onDelete }: { pool: Pool; onEdit: (pool: Pool) => void; onDelete: (id: number) => void }) {
  const [expanded, setExpanded] = useState(false);
  const items = [
    { label: "Фридайв", value: pool.freediving },
    { label: "Хранение", value: pool.storage },
    { label: "Вечер буд.", value: pool.eveningWeekday },
    { label: "Выходные", value: pool.weekends },
  ];

  return (
    <div className="bg-white rounded-xl border border-slate-200 hover:border-slate-300 transition-all shadow-sm hover:shadow-md p-4 cursor-pointer" onClick={() => setExpanded(!expanded)}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-slate-900 leading-tight text-lg break-words">{pool.name}</h3>
          <p className="text-xs text-slate-400 font-mono mt-0.5">{pool.district} · {pool.metro}</p>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <StatusBadge status={pool.status} />
          <EditBtn onClick={(e) => { e.stopPropagation(); onEdit(pool); }} />
          <DeleteBtn onClick={(e) => { e.stopPropagation(); onDelete(pool.id); }} />
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm">
        {items.map(({ label, value }) => (
          <div key={label} className="flex items-center gap-1">
            <span className="text-slate-400">{label}</span>
            <TriBool value={value} />
          </div>
        ))}
      </div>

      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500 font-mono">
        {pool.pricerub && <span className="font-mono text-sm font-semibold text-slate-700">{pool.pricerub} ₽</span>}
        {pool.length && <span className="text-sm text-slate-400 font-mono">{pool.length}м</span>}
        {pool.depth && pool.depth !== "—" && <span className="text-sm text-slate-400 font-mono">глуб. {pool.depth}м</span>}
        {pool.timemin && <span className="text-sm text-slate-400 font-mono">{pool.timemin} мин</span>}
      </div>

      {expanded && (
        <div className="mt-3 pt-3 border-t border-slate-100">
          <p className="text-sm text-slate-600 leading-relaxed mb-1.5">{pool.notes}</p>
          {pool.contact && pool.contact !== "—" && (
            <p className="text-xs font-mono text-slate-500">{pool.contact}</p>
          )}
        </div>
      )}
    </div>
  );
}

function TableRow({ pool, even, onEdit, onDelete }: { pool: Pool; even: boolean; onEdit: (pool: Pool) => void; onDelete: (id: number) => void }) {
  const [open, setOpen] = useState(false);
  const td = `px-3 py-2.5 text-sm ${even ? "bg-white" : "bg-slate-50/50"}`;

  return (
    <>
      <tr className="hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => setOpen(!open)}>
        <td className={td} onClick={() => setOpen(v => !v)}>{pool.id}</td>
        <td className={`${td} font-medium text-slate-800 whitespace-nowrap`} onClick={() => setOpen(v => !v)}>{pool.name}</td>
        <td className={td} onClick={() => setOpen(v => !v)}><StatusBadge status={pool.status} /></td>
        <td className={`${td} text-slate-500 whitespace-nowrap`} onClick={() => setOpen(v => !v)}>{pool.district} / {pool.metro}</td>
        <td className={`${td} text-center`}><TriBool value={pool.freediving} /></td>
        <td className={`${td} text-center`}><TriBool value={pool.storage} /></td>
        <td className={`${td} text-center`}><TriBool value={pool.eveningWeekday} /></td>
        <td className={`${td} text-center`}><TriBool value={pool.weekends} /></td>
        <td className={`${td} text-slate-600`}>{pool.length ? `${pool.length}м` : "·"}</td>
        <td className={`${td} text-slate-600`}>{pool.depth && pool.depth !== "—" ? `${pool.depth}м` : "·"}</td>
        <td className={`${td} text-slate-700 font-medium whitespace-nowrap`}>{pool.pricerub ?? "·"}</td>
        <td className={`${td} text-slate-500`}>{pool.timemin ?? "·"}</td>
        <td className={`${td} text-right flex items-center justify-end gap-1`}>
          <EditBtn onClick={() => onEdit(pool)} />
          <DeleteBtn onClick={() => onDelete(pool.id)} />
        </td>
      </tr>
      {open && (
        <tr className="bg-slate-50/80">
          <td colSpan={13} className="px-4 py-3 text-sm">
            <div className="max-w-3xl">
              <p className="text-sm text-slate-600 leading-relaxed">{pool.notes}</p>
              {pool.contact && pool.contact !== "—" && (
                <p className="text-xs text-slate-400 mt-1">{pool.contact}</p>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

function exportCSV(pools: Pool[]) {
  const headers = [
    "id", "name", "status", "district", "metro",
    "freediving", "storage", "eveningweekday", "weekends",
    "lengthm", "depthm", "pricerub", "timemin", "dryroom", "contact", "notes"
  ];
  const rows = pools.map(p => [
    p.id,
    p.name,
    p.status,
    p.district,
    p.metro,
    p.freediving === true ? "да" : p.freediving === false ? "нет" : "",
    p.storage === true ? "да" : p.storage === false ? "нет" : "",
    p.eveningWeekday === true ? "да" : p.eveningWeekday === false ? "нет" : "",
    p.weekends === true ? "да" : p.weekends === false ? "нет" : "",
    p.length ?? "",
    p.depth ?? "",
    p.pricerub ?? "",
    p.timemin ?? "",
    p.dryRoom === true ? "да" : p.dryRoom === false ? "нет" : "",
    p.contact ?? "",
    p.notes ?? ""
  ]);

  let csv = headers.join(",") + "\n";
  rows.forEach(row => {
    const escaped = row.map(cell => {
      if (typeof cell === "string" && (cell.includes(",") || cell.includes("\"") || cell.includes("\n"))) {
        return `"${cell.replace(/"/g, '""')}"`;
      }
      return cell;
    });
    csv += escaped.join(",") + "\n";
  });

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `pools_${new Date().toISOString().slice(0,10)}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
}

function App() {
  const [pools, setPools] = useState<Pool[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: ALL as FilterStatus,
    district: "",
    metro: "",
    name: "",
    freediving: "all" as "all" | "yes" | "no",
    storage: "all" as "all" | "yes" | "no",
    eveningWeekday: "all" as "all" | "yes" | "no",
    weekends: "all" as "all" | "yes" | "no",
  });
  const [formPool, setFormPool] = useState<Pool | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");

  async function fetchPools() {
    console.log("🔄 Запрос к Supabase...");
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('pools')
        .select('*')
        .order('id', { ascending: true });
      if (error) {
        console.error("❌ Ошибка Supabase:", error);
        setPools([]);
      } else {
        console.log("✅ Получено записей:", data?.length || 0);
        if (data && data.length > 0) {
          console.log("📊 Пример первой записи:", data[0]);
        }
        setPools(data as Pool[] || []);
      }
    } catch (err) {
      console.error("❌ Исключение при загрузке:", err);
      setPools([]);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchPools();
  }, []);

  async function addPool(pool: Omit<Pool, 'id'>) {
    const { data, error } = await supabase.from('pools').insert([pool]).select();
    if (error) {
      console.error('Ошибка добавления:', error);
      return;
    }
    if (data && data.length > 0) {
      setPools(prev => [...prev, data[0] as Pool]);
    }
  }

  async function updatePool(pool: Pool) {
    const { error } = await supabase.from('pools').update(pool).eq('id', pool.id);
    if (error) {
      console.error('Ошибка обновления:', error);
      return;
    }
    setPools(prev => prev.map(p => p.id === pool.id ? pool : p));
  }

  async function deletePool(id: number) {
    if (!confirm('Удалить бассейн?')) return;
    const { error } = await supabase.from('pools').delete().eq('id', id);
    if (error) {
      console.error('Ошибка удаления:', error);
      return;
    }
    setPools(prev => prev.filter(p => p.id !== id));
  }

  const openAdd = useCallback(() => { setFormPool(null); setFormOpen(true); }, []);
  const openEdit = useCallback((pool: Pool) => { setFormPool(pool); setFormOpen(true); }, []);
  const handleSave = useCallback(async (saved: Pool) => {
    if (saved.id) {
      await updatePool(saved);
    } else {
      const { id, ...newPool } = saved;
      await addPool(newPool);
    }
    setFormOpen(false);
  }, []);
  const handleDelete = useCallback(async (id: number) => {
    await deletePool(id);
  }, []);

  const districts = useMemo(
    () => [...new Set(pools.map((p) => p.district).filter((d) => d && d !== "—"))].sort(),
    [pools]
  );
  const metros = useMemo(
    () => [...new Set(pools.map((p) => p.metro).filter((m) => m && m !== "—"))].sort(),
    [pools]
  );

  const filtered = useMemo(() => {
    return pools.filter((p) => {
      if (filters.status !== ALL && p.status !== filters.status) return false;
      if (filters.district && p.district !== filters.district) return false;
      if (filters.metro && !p.metro.includes(filters.metro)) return false;
      if (filters.name && !p.name.toLowerCase().includes(filters.name.toLowerCase())) return false;
      if (filters.freediving === "yes" && p.freediving !== true) return false;
      if (filters.freediving === "no" && p.freediving !== false) return false;
      if (filters.storage === "yes" && p.storage !== true) return false;
      if (filters.storage === "no" && p.storage !== false) return false;
      if (filters.eveningWeekday === "yes" && p.eveningWeekday !== true) return false;
      if (filters.eveningWeekday === "no" && p.eveningWeekday !== false) return false;
      if (filters.weekends === "yes" && p.weekends !== true) return false;
      if (filters.weekends === "no" && p.weekends !== false) return false;
      return true;
    });
  }, [pools, filters]);

  const clearFilters = useCallback(() => {
    setFilters({
      status: ALL,
      district: "",
      metro: "",
      name: "",
      freediving: "all",
      storage: "all",
      eveningWeekday: "all",
      weekends: "all",
    });
  }, []);

  const hasFilters =
    filters.status !== ALL ||
    filters.district ||
    filters.metro ||
    filters.name ||
    filters.freediving !== "all" ||
    filters.storage !== "all" ||
    filters.eveningWeekday !== "all" ||
    filters.weekends !== "all";

  const activeCount = pools.filter((p) => p.status === "active").length;

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen text-slate-600">Загрузка бассейнов...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">База бассейнов</h1>
            <p className="text-sm text-slate-500 mt-0.5">Школа «Глубина» · {activeCount} активных · {pools.length} всего</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
              <button
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${viewMode === "cards" ? "bg-white shadow-sm text-slate-900" : "text-slate-500 hover:text-slate-700"}`}
                onClick={() => setViewMode("cards")}
              >
                Карточки
              </button>
              <button
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${viewMode === "table" ? "bg-white shadow-sm text-slate-900" : "text-slate-500 hover:text-slate-700"}`}
                onClick={() => setViewMode("table")}
              >
                Список
              </button>
            </div>
            <button
              onClick={() => exportCSV(filtered)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-all shadow-sm hover:shadow-md flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
              Скачать CSV
            </button>
            <button
              onClick={openAdd}
              className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-all shadow-sm hover:shadow-md flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14" /><path d="M5 12h14" /></svg>
              Добавить
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6 shadow-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Поиск</label>
              <input
                type="text"
                placeholder="Название, метро..."
                className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-slate-400 focus:outline-none"
                value={filters.name}
                onChange={(e) => setFilters((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Статус</label>
              <select
                className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-sm bg-white focus:ring-2 focus:ring-slate-400 focus:outline-none"
                value={filters.status}
                onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value as FilterStatus }))}
              >
                <option value={ALL}>Все</option>
                {(Object.keys(STATUS_LABELS) as PoolStatus[]).map((s) => (
                  <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Район</label>
              <select
                className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-sm bg-white focus:ring-2 focus:ring-slate-400 focus:outline-none"
                value={filters.district}
                onChange={(e) => setFilters((f) => ({ ...f, district: e.target.value }))}
              >
                <option value="">Все</option>
                {districts.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Метро</label>
              <select
                className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-sm bg-white focus:ring-2 focus:ring-slate-400 focus:outline-none"
                value={filters.metro}
                onChange={(e) => setFilters((f) => ({ ...f, metro: e.target.value }))}
              >
                <option value="">Все</option>
                {metros.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { key: "freediving", label: "Фридайвинг" },
              { key: "storage", label: "Хранение" },
              { key: "eveningWeekday", label: "Вечер будни" },
              { key: "weekends", label: "Выходные" },
            ].map(({ key, label }) => {
              const value = filters[key as keyof typeof filters] as string;
              return (
                <div key={key} className="flex items-center gap-2">
                  <span className="text-xs text-slate-600 font-medium">{label}</span>
                  <select
                    className="border border-slate-300 rounded-lg px-2 py-0.5 text-sm bg-white focus:ring-2 focus:ring-slate-400 focus:outline-none"
                    value={value}
                    onChange={(e) => setFilters((f) => ({ ...f, [key]: e.target.value }))}
                  >
                    <option value="all">Все</option>
                    <option value="yes">Да</option>
                    <option value="no">Нет</option>
                  </select>
                </div>
              );
            })}
          </div>

          {hasFilters && (
            <div className="mt-3 flex justify-end">
              <button
                onClick={clearFilters}
                className="text-sm text-slate-500 hover:text-slate-700 underline-offset-2 hover:underline"
              >
                Сбросить все фильтры
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-slate-500">
            Показано <span className="font-semibold text-slate-700">{filtered.length}</span> из {pools.length}
          </span>
        </div>

        {viewMode === "cards" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((pool) => (
              <PoolCard
                key={pool.id}
                pool={pool}
                onEdit={openEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-3 py-2.5 text-left font-semibold text-slate-600 text-xs uppercase tracking-wider">ID</th>
                  <th className="px-3 py-2.5 text-left font-semibold text-slate-600 text-xs uppercase tracking-wider">Название</th>
                  <th className="px-3 py-2.5 text-left font-semibold text-slate-600 text-xs uppercase tracking-wider">Статус</th>
                  <th className="px-3 py-2.5 text-left font-semibold text-slate-600 text-xs uppercase tracking-wider">Район / Метро</th>
                  <th className="px-3 py-2.5 text-center font-semibold text-slate-600 text-xs uppercase tracking-wider">Фрид</th>
                  <th className="px-3 py-2.5 text-center font-semibold text-slate-600 text-xs uppercase tracking-wider">Хран</th>
                  <th className="px-3 py-2.5 text-center font-semibold text-slate-600 text-xs uppercase tracking-wider">Веч</th>
                  <th className="px-3 py-2.5 text-center font-semibold text-slate-600 text-xs uppercase tracking-wider">Вых</th>
                  <th className="px-3 py-2.5 text-left font-semibold text-slate-600 text-xs uppercase tracking-wider">Длина</th>
                  <th className="px-3 py-2.5 text-left font-semibold text-slate-600 text-xs uppercase tracking-wider">Глубина</th>
                  <th className="px-3 py-2.5 text-left font-semibold text-slate-600 text-xs uppercase tracking-wider">Цена</th>
                  <th className="px-3 py-2.5 text-left font-semibold text-slate-600 text-xs uppercase tracking-wider">Время</th>
                  <th className="px-3 py-2.5 text-right font-semibold text-slate-600 text-xs uppercase tracking-wider">Действия</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((pool, index) => (
                  <TableRow
                    key={pool.id}
                    pool={pool}
                    even={index % 2 === 0}
                    onEdit={openEdit}
                    onDelete={handleDelete}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}

        {filtered.length === 0 && (
          <div className="text-center py-16">
            <p className="text-slate-400 text-lg">Ничего не найдено</p>
            <button onClick={clearFilters} className="text-slate-500 hover:text-slate-700 text-sm mt-2 underline">
              Сбросить фильтры
            </button>
          </div>
        )}
      </div>

      {formOpen && createPortal(
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => setFormOpen(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white/80 backdrop-blur-sm border-b border-slate-100 px-6 py-4 flex items-center justify-between z-10">
              <h2 className="text-xl font-semibold text-slate-900">{formPool ? "Редактировать бассейн" : "Новый бассейн"}</h2>
              <button onClick={() => setFormOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
              </button>
            </div>
            <div className="p-6">
              <PoolForm
                pool={formPool}
                onCancel={() => setFormOpen(false)}
                onSave={handleSave}
                nextId={Math.max(0, ...pools.map(p => p.id)) + 1}
              />
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

export default App;


