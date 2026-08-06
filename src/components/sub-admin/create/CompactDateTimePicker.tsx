import { useState, useEffect, type ChangeEvent } from 'react'
import { CalendarDays, Clock } from 'lucide-react'

interface CompactDateTimePickerProps {
  value: string
  onChange: (v: string) => void
  minStr: string
  getTypo: (element: string) => string
  id?: string
}

export function CompactDateTimePicker({ value, onChange, minStr, getTypo, id }: CompactDateTimePickerProps) {
  const parts = value ? value.split('T') : ['', '00:00']
  const dateVal = parts[0] || minStr.split('T')[0]
  const [hStr, mStr] = (parts[1] || '00:00').split(':')
  const h24 = parseInt(hStr || '0', 10)

  const initialAmPm = h24 >= 12 ? 'PM' : 'AM'
  let initialH12 = h24 % 12
  if (initialH12 === 0) initialH12 = 12

  const [hour, setHour] = useState(String(initialH12).padStart(2, '0'))
  const [minute, setMinute] = useState((mStr || '00').padStart(2, '0'))
  const [period, setPeriod] = useState(initialAmPm)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!value) return
    const t = value.split('T')[1] || '00:00'
    const [extH, extM] = t.split(':')
    const extH24 = parseInt(extH || '0', 10)
    const extP = extH24 >= 12 ? 'PM' : 'AM'
    let extH12 = extH24 % 12
    if (extH12 === 0) extH12 = 12
    if (parseInt(hour, 10) !== extH12 || parseInt(minute, 10) !== parseInt(extM || '0', 10) || period !== extP) {
      setHour(String(extH12).padStart(2, '0'))
      setMinute((extM || '00').padStart(2, '0'))
      setPeriod(extP)
    }
  }, [value])

  const applyTime = (h: string, m: string, p: string, date: string) => {
    let hh = parseInt(h, 10)
    let mm = parseInt(m, 10)
    if (isNaN(hh) || hh < 1) hh = 1
    if (hh > 12) hh = 12
    if (isNaN(mm) || mm < 0) mm = 0
    if (mm > 59) mm = 59
    if (!p) p = 'AM'
    let h24Val = hh
    if (p === 'PM' && hh !== 12) h24Val += 12
    if (p === 'AM' && hh === 12) h24Val = 0
    const finalTime = `${h24Val.toString().padStart(2, '0')}:${mm.toString().padStart(2, '0')}`
    onChange(`${date}T${finalTime}`)
  }

  const handleHourBlur = () => {
    let hh = parseInt(hour, 10)
    if (isNaN(hh) || hh < 1 || hh > 12) { setError('Invalid hour'); return }
    setError(null)
    const fmt = String(hh).padStart(2, '0')
    setHour(fmt)
    applyTime(fmt, minute, period, dateVal)
  }

  const handleMinuteBlur = () => {
    let mm = parseInt(minute, 10)
    if (isNaN(mm) || mm < 0 || mm > 59) { setError('Invalid minute'); return }
    setError(null)
    const fmt = String(mm).padStart(2, '0')
    setMinute(fmt)
    applyTime(hour, fmt, period, dateVal)
  }

  const handleHourChange = (e: ChangeEvent<HTMLInputElement>) => {
    setHour(e.target.value.replace(/\D/g, '').slice(0, 2))
    setError(null)
  }

  const handleMinuteChange = (e: ChangeEvent<HTMLInputElement>) => {
    setMinute(e.target.value.replace(/\D/g, '').slice(0, 2))
    setError(null)
  }

  const handlePeriodChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setPeriod(e.target.value)
    applyTime(hour, minute, e.target.value, dateVal)
  }

  const handleDateChange = (e: ChangeEvent<HTMLInputElement>) => {
    applyTime(hour, minute, period, e.target.value || minStr.split('T')[0])
  }

  const inputClasses = "w-[40px] sm:w-[45px] md:w-[50px] lg:w-[55px] text-center bg-hover-bg/50 border-2 border-border-subtle/20 rounded-lg px-1 py-2 font-bold text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all"

  return (
    <div className="w-full flex flex-col md:flex-row md:items-center gap-4 lg:gap-5 mt-1">
      <div className="flex-1 flex items-center gap-3 bg-hover-bg/60 border-2 border-border-subtle/20 focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-primary/10 px-4 py-3 sm:py-3.5 rounded-xl transition-all shadow-sm">
        <CalendarDays size={18} className="text-primary/70 shrink-0" />
        <input
          id={id}
          type="date"
          min={minStr.split('T')[0]}
          value={dateVal}
          onChange={handleDateChange}
          className="bg-transparent border-none outline-none font-bold text-text-primary focus:ring-0 w-full p-0 cursor-pointer tracking-wide"
          style={{ fontSize: getTypo('body') }}
        />
      </div>

      <div className="relative w-full sm:w-auto min-w-max shrink-0 bg-hover-bg/60 border-2 border-border-subtle/20 px-3.5 py-2.5 sm:py-3 rounded-xl transition-all flex items-center shadow-sm">
        <div className="flex items-center justify-between sm:justify-start gap-[6px] sm:gap-[8px] w-full">
          <div className="flex items-center gap-[6px] sm:gap-[8px]">
            <Clock size={16} className="text-primary/70 shrink-0 hidden sm:block delay-150" />
            <input
              id={id ? `${id}-hour` : undefined}
              type="text"
              inputMode="numeric"
              value={hour}
              onChange={handleHourChange}
              onBlur={handleHourBlur}
              placeholder="HH"
              aria-label="Hour"
              aria-invalid={!!error}
              aria-describedby={error && id ? `${id}-error` : undefined}
              className={inputClasses}
            />
            <span className="font-bold text-text-secondary opacity-50 px-0.5">:</span>
            <input
              id={id ? `${id}-minute` : undefined}
              type="text"
              inputMode="numeric"
              value={minute}
              onChange={handleMinuteChange}
              onBlur={handleMinuteBlur}
              placeholder="MM"
              aria-label="Minute"
              aria-invalid={!!error}
              aria-describedby={error && id ? `${id}-error` : undefined}
              className={inputClasses}
            />
          </div>
          <select
            value={period}
            onChange={handlePeriodChange}
            aria-label="AM/PM"
            className={`${inputClasses} ml-auto sm:ml-0 bg-primary/10 text-primary border-primary/20 hover:bg-primary/15 cursor-pointer appearance-none px-0`}
          >
            <option className="bg-card-bg text-text-primary" value="AM">AM</option>
            <option className="bg-card-bg text-text-primary" value="PM">PM</option>
          </select>
        </div>
        {error && (
          <div id={id ? `${id}-error` : undefined} role="alert" className="absolute top-full mt-1.5 left-0 text-red-500 font-bold text-[11px] sm:text-[12px] md:text-[13px] lg:text-[14px]">
            {error}
          </div>
        )}
      </div>
    </div>
  )
}
