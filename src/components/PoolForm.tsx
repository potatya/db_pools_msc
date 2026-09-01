import { useState, useEffect } from "react";
import { type Pool, type PoolStatus, STATUS_LABELS } from "../data/pools";

type FormData = {
  name: string;
  status: PoolStatus;
  district: string;
  metro: string;
  freediving: string;
  storage: string;
  eveningWeekday: string;
  weekends: string;
  lengthM: string;
  depthM: string;
  priceRub: string;
  timeMin: string;
  dryRoom: string;
  contact: string;
  notes: string;
};

function triToNull(v: string): boolean | null {
  if (v === "true") return true;
  if (v === "false") return false;
  return null;
}

function nullToTri(v: boolean | null): string {
  if (v === true) return "true";
  if (v === false) return "false";
  return "";
}

function poolToForm(pool: Pool): FormData {
  return {
    name: pool.name,
    status: pool.status,
    district: pool.district === "—" ? "" : pool.district,
    metro: pool.metro === "—" ? "" : pool.metro,
    freediving: nullToTri(pool.freediving),
    storage: nullToTri(pool.storage),
    eveningWeekday: nullToTri(pool.eveningWeekday),
    weekends: nullToTri(pool.weekends),
    lengthM: pool.length != null ? String(pool.length) : "",
    depthM: pool.depth && pool.depth !== "—" ? pool.depth : "",
    priceRub: pool.pricerub && pool.pricerub !== "—" ? pool.pricerub : "",
    timeMin: pool.timemin != null ? String(pool.timemin) : "",
    dryRoom: nullToTri(pool.dryRoom),
    contact: pool.contact === "—" ? "" : pool.contact,
    notes: pool.notes,
  };
}

function formToPool(f: FormData, id: number): Pool {
  return {
    id,
    name: f.name,
    status: f.status,
    district: f.district || "—",
    metro: f.metro || "—",
    freediving: triToNull(f.freediving),
    storage: triToNull(f.storage),
    eveningWeekday: triToNull(f.eveningWeekday),
    weekends: triToNull(f.weekends),
    lengthM: f.length ? Number(f.length) : null,
    depthM: f.depth || "—",
    priceRub: f.pricerub || "—",
    timeMin: f.timemin ? Number(f.timemin) : null,
    dryRoom: triToNull(f.dryRoom),
    contact: f.contact || "—",
    notes: f.notes,
  };
}

export function PoolForm({
  pool,
  onCancel,
  onSave,
  nextId,
}: {
  pool: Pool | null;
  onCancel: () => void;
  onSave: (pool: Pool) => void;
  nextId: number;
}) {
  const [form, setForm] = useState<FormData>(pool ? poolToForm(pool) : {
    name: "",
    status: "unconfirmed",
    district: "",
    metro: "",
    freediving: "",
    storage: "",
    eveningWeekday: "",
    weekends: "",
    lengthM: "",
    depthM: "",
    priceRub: "",
    timeMin: "",
    dryRoom: "",
    contact: "",
    notes: "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  useEffect(() => {
    setForm(pool ? poolToForm(pool) : {
      name: "",
      status: "unconfirmed",
      district: "",
      metro: "",
      freediving: "",
      storage: "",
      eveningWeekday: "",
      weekends: "",
      lengthM: "",
      depthM: "",
      priceRub: "",
      timeMin: "",
      dryRoom: "",
      contact: "",
      notes: "",
    });
  }, [pool]);

  const set = <K extends keyof FormData>(key: K, value: FormData[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const eObj: Partial<Record<keyof FormData, string>> = {};
    if (!form.name) eObj.name = "Название обязательно";
    if (!form.status) eObj.status = "Статус обязателен";
    if (Object.keys(eObj).length) {
      setErrors(eObj);
      return;
    }
    setErrors({});
    onSave(formToPool(form, pool?.id ?? nextId));
  };

  const isEdit = pool !== null;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-semibold text-slate-900">
          {isEdit ? "Редактировать бассейн" : "Новый бассейн"}
        </h3>
        <span className="text-sm text-slate-500">
          {isEdit ? `#${pool.id} · ${pool.name}` : "Заполните известные данные"}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Название *</label>
          <input
            type="text"
            className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-slate-400 focus:outline-none"
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
          />
          {errors.name && <p className="text-xs text-red-500 mt-0.5">{errors.name}</p>}
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Статус *</label>
          <select
            className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-sm bg-white focus:ring-2 focus:ring-slate-400 focus:outline-none"
            value={form.status}
            onChange={(e) => set("status", e.target.value as PoolStatus)}
          >
            {(Object.entries(STATUS_LABELS) as [PoolStatus, string][]).map(([s, label]) => (
              <option key={s} value={s}>{label}</option>
            ))}
          </select>
          {errors.status && <p className="text-xs text-red-500 mt-0.5">{errors.status}</p>}
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Район</label>
          <input
            type="text"
            className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-slate-400 focus:outline-none"
            value={form.district}
            onChange={(e) => set("district", e.target.value)}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Метро</label>
          <input
            type="text"
            className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-slate-400 focus:outline-none"
            value={form.metro}
            onChange={(e) => set("metro", e.target.value)}
          />
        </div>
        {[
          { key: "freediving", label: "Фридайвинг" },
          { key: "storage", label: "Хранение" },
          { key: "eveningWeekday", label: "Вечер будни" },
          { key: "weekends", label: "Выходные" },
          { key: "dryRoom", label: "Сухой зал" },
        ].map(({ key, label }) => (
          <div key={key}>
            <label className="block text-xs font-medium text-slate-600 mb-1">{label}</label>
            <select
              className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-sm bg-white focus:ring-2 focus:ring-slate-400 focus:outline-none"
              value={form[key as keyof FormData] as string}
              onChange={(e) => set(key as keyof FormData, e.target.value)}
            >
              <option value="">Неизвестно</option>
              <option value="true">Да</option>
              <option value="false">Нет</option>
            </select>
          </div>
        ))}
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Длина (м)</label>
          <input
            type="number"
            className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-slate-400 focus:outline-none"
            value={form.length}
            onChange={(e) => set("lengthM", e.target.value)}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Глубина (м)</label>
          <input
            type="text"
            className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-slate-400 focus:outline-none"
            value={form.depth}
            onChange={(e) => set("depthM", e.target.value)}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Цена (₽)</label>
          <input
            type="text"
            className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-slate-400 focus:outline-none"
            value={form.pricerub}
            onChange={(e) => set("priceRub", e.target.value)}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Время (мин)</label>
          <input
            type="number"
            className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-slate-400 focus:outline-none"
            value={form.timemin}
            onChange={(e) => set("timeMin", e.target.value)}
          />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-xs font-medium text-slate-600 mb-1">Контакты</label>
          <input
            type="text"
            className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-slate-400 focus:outline-none"
            value={form.contact}
            onChange={(e) => set("contact", e.target.value)}
          />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-xs font-medium text-slate-600 mb-1">Заметки</label>
          <textarea
            className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-slate-400 focus:outline-none"
            rows={3}
            value={form.notes}
            onChange={(e) => set("notes", e.target.value)}
          />
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors"
        >
          Отмена
        </button>
        <button
          type="submit"
          className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2 rounded-lg text-sm font-medium transition-all"
        >
          {isEdit ? "Сохранить изменения" : "Добавить бассейн"}
        </button>
      </div>
    </form>
  );
}

