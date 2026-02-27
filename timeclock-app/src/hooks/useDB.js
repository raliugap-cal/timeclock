import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'

// ID de empresa — en producción real esto vendría del auth/login
// Por ahora usamos la empresa demo del seed
const COMPANY_ID = '00000000-0000-0000-0000-000000000001'

export const useDB = () => {
  const [db, setDb]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const dbRef = useRef(null)

  // ── Cargar todos los datos al iniciar ──
  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const [
        { data: departments },
        { data: locations },
        { data: employees },
        { data: timeRecords },
        { data: payrollCuts },
      ] = await Promise.all([
        supabase.from('departments').select('*').eq('company_id', COMPANY_ID).order('name'),
        supabase.from('locations').select('*').eq('company_id', COMPANY_ID).eq('active', true).order('name'),
        supabase.from('employees').select('*').eq('company_id', COMPANY_ID).order('name'),
        supabase.from('time_records').select('*').eq('company_id', COMPANY_ID).order('created_at', { ascending: false }).limit(200),
        supabase.from('payroll_cuts').select('*').eq('company_id', COMPANY_ID).order('created_at', { ascending: false }),
      ])

      const state = {
        departments: departments || [],
        locations:   locations   || [],
        employees:   employees   || [],
        timeRecords: timeRecords || [],
        payrollCuts: payrollCuts || [],
      }
      dbRef.current = state
      setDb({ ...state })
    } catch (e) {
      setError(e.message)
    }
    setLoading(false)
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  // ── Helpers para actualizar estado local ──
  const commit = useCallback((next) => {
    dbRef.current = next
    setDb({ ...next })
  }, [])

  // ── EMPLEADOS ──
  const upsertEmployee = useCallback(async (emp) => {
    const isNew = !emp.id

    const payload = {
      company_id:  COMPANY_ID,
      dept_id:     emp.dept_id || emp.dept,
      location_id: emp.location_id || emp.location,
      name:        emp.name,
      role:        emp.role,
      avatar:      emp.name.trim().split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2),
      salary:      Number(emp.salary),
      payroll:     emp.payroll,
      country:     emp.country,
      currency:    emp.currency,
      status:      emp.status,
      hire_date:   emp.hire_date || emp.hireDate || null,
    }

    if (isNew) {
      const { data, error } = await supabase.from('employees').insert(payload).select().single()
      if (error) throw error
      const cur = dbRef.current
      commit({ ...cur, employees: [...cur.employees, data] })
      return data
    } else {
      const { data, error } = await supabase.from('employees').update(payload).eq('id', emp.id).select().single()
      if (error) throw error
      const cur = dbRef.current
      commit({ ...cur, employees: cur.employees.map(e => e.id === emp.id ? data : e) })
      return data
    }
  }, [commit])

  const deleteEmployee = useCallback(async (id) => {
    const { error } = await supabase.from('employees').delete().eq('id', id)
    if (error) throw error
    const cur = dbRef.current
    commit({ ...cur, employees: cur.employees.filter(e => e.id !== id) })
  }, [commit])

  // ── UBICACIONES ──
  const upsertLocation = useCallback(async (loc) => {
    const isNew = !loc.id
    const payload = {
      company_id: COMPANY_ID,
      name:       loc.name,
      address:    loc.address,
      lat:        Number(loc.lat),
      lng:        Number(loc.lng),
      radius:     Number(loc.radius),
      country:    loc.country,
      timezone:   loc.timezone,
      active:     true,
    }

    if (isNew) {
      const { data, error } = await supabase.from('locations').insert(payload).select().single()
      if (error) throw error
      const cur = dbRef.current
      commit({ ...cur, locations: [...cur.locations, data] })
      return data
    } else {
      const { data, error } = await supabase.from('locations').update(payload).eq('id', loc.id).select().single()
      if (error) throw error
      const cur = dbRef.current
      commit({ ...cur, locations: cur.locations.map(l => l.id === loc.id ? data : l) })
      return data
    }
  }, [commit])

  const deleteLocation = useCallback(async (id) => {
    const { error } = await supabase.from('locations').update({ active: false }).eq('id', id)
    if (error) throw error
    const cur = dbRef.current
    commit({ ...cur, locations: cur.locations.filter(l => l.id !== id) })
  }, [commit])

  // ── REGISTROS DE TIEMPO ──
  const addTimeRecord = useCallback(async (rec) => {
    const payload = {
      company_id:  COMPANY_ID,
      employee_id: rec.empId || rec.employee_id,
      date:        rec.date,
      entry_time:  rec.entry,
      exit_time:   rec.exit || null,
      hours:       rec.hours || null,
      type:        rec.type,
      status:      rec.status || 'normal',
      approved:    false,
    }
    const { data, error } = await supabase.from('time_records').insert(payload).select().single()
    if (error) throw error
    const cur = dbRef.current
    commit({ ...cur, timeRecords: [data, ...cur.timeRecords] })
    return data
  }, [commit])

  // ── CORTES DE NÓMINA ──
  const savePayrollCut = useCallback(async (cut) => {
    const payload = {
      company_id:  COMPANY_ID,
      period:      cut.period,
      type:        cut.type,
      country:     cut.country,
      employees:   cut.employees,
      gross_total: cut.grossTotal,
      total_ded:   cut.totalDed,
      net_total:   cut.netTotal,
      status:      'pendiente',
      cut_date:    new Date().toISOString().slice(0, 10),
      created_by:  'admin',
    }
    const { data, error } = await supabase.from('payroll_cuts').insert(payload).select().single()
    if (error) throw error
    const cur = dbRef.current
    commit({ ...cur, payrollCuts: [data, ...cur.payrollCuts] })
    return data
  }, [commit])

  // ── Alias de campos para compatibilidad con el UI ──
  // Supabase usa snake_case, el UI usa camelCase/short IDs
  // Normalizamos al cargar
  const normalizedDb = db ? {
    ...db,
    employees: db.employees.map(e => ({
      ...e,
      dept:     e.dept_id,
      location: e.location_id,
      hireDate: e.hire_date,
    })),
    timeRecords: db.timeRecords.map(r => ({
      ...r,
      empId: r.employee_id,
      entry: r.entry_time,
      exit:  r.exit_time,
    })),
    payrollCuts: db.payrollCuts.map(p => ({
      ...p,
      grossTotal: p.gross_total,
      totalDed:   p.total_ded,
      netTotal:   p.net_total,
    })),
  } : null

  return {
    db: normalizedDb,
    loading,
    error,
    refetch: fetchAll,
    upsertEmployee,
    deleteEmployee,
    upsertLocation,
    deleteLocation,
    addTimeRecord,
    savePayrollCut,
  }
}
