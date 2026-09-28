import { useState, type ChangeEvent } from 'react'
import { CalendarDays, Clock } from 'lucide-react'
import { PremiumSelect } from '../../common/PremiumSelect'

interface CompactDateTimePickerProps {
  value: string
  onChange: (v: string) => void
  minStr: string
  getTypo: (element: string) => string
  id?: string
}

function splitValue(value: string) {
  const [date, time] = value ? value.split('T') : ['', '00:00']
  const [hStr, mStr] = (time || '00:00').split(':')
  const h24 = parseInt(hStr || '0', 10)
  const period = h24 >= 12 ? 'PM' : 'AM'
  let h12 = h24 % 12
  if (h12 === 0) h12 = 12
  return { date, hour: String(h12).padStart(2, '0'), minute: (mStr || '00').padStart(2, '0'), period }
}

export function CompactDateTimePicker({ value, onChange, minStr, getTypo, id }: CompactDateTimePickerProps) {
  const parts = splitValue(value || minStr)

  const [prevValue, setPrevValue] = useState(value)
  const [hour, setHour] = useState(parts.hour)
  const [minute, setMinute] = useState(parts.minute)
  const [period, setPeriod] = useState(parts.period)
  const [error, setError] = useState<string | null>(null)

  if (prevValue !== value && value) {
    setPrevValue(value)
    const next = splitValue(value)
    setHour(next.hour)
    setMinute(next.minute)
    setPeriod(next.period)
  }

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
    const hh = parseInt(hour, 10)
    if (isNaN(hh) || hh < 1 || hh > 12) { setError('Invalid hour'); return }
    setError(null)
    const fmt = String(hh).padStart(2, '0')
    setHour(fmt)
    applyTime(fmt, minute, period, parts.date)
  }

  const handleMinuteBlur = () => {
    const mm = parseInt(minute, 10)
    if (isNaN(mm) || mm < 0 || mm > 59) { setError('Invalid minute'); return }
    setError(null)
    const fmt = String(mm).padStart(2, '0')
    setMinute(fmt)
    applyTime(hour, fmt, period, parts.date)
  }

  const handleHourChange = (e: ChangeEvent<HTMLInputElement>) => {
    setHour(e.target.value.replace(/\D/g, '').slice(0, 2))
    setError(null)
  }

  const handleMinuteChange = (e: ChangeEvent<HTMLInputElement>) => {
    setMinute(e.target.value.replace(/\D/g, '').slice(0, 2))
    setError(null)
  }

  const handlePeriodChange = (val: string) => {
    setPeriod(val)
    applyTime(hour, minute, val, parts.date)
  }

  const handleDateChange = (e: ChangeEvent<HTMLInputElement>) => {
    applyTime(hour, minute, period, e.target.value || minStr.split('T')[0])
  }

  const inputClasses = "w-[40px] sm:w-[45px] md:w-[50px] lg:w-[55px] text-center bg-hover-bg/50 border-2 border-border-subtle/20 rounded-lg px-1 py-2 font-bold text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-interaction duration-fast ease-standard"

  return (
    <div className="w-full flex flex-col md:flex-row md:items-center gap-4 lg:gap-5 mt-1">
      <div className="flex-1 flex items-center gap-3 bg-hover-bg/60 border-2 border-border-subtle/20 focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-primary/10 px-4 py-3 sm:py-3.5 rounded-xl transition-interaction duration-fast ease-standard shadow-sm">
        <CalendarDays size={18} className="text-primary/70 shrink-0" />
        <input
          id={id}
          type="date"
          min={minStr.split('T')[0]}
          value={parts.date}
          onChange={handleDateChange}
          className="bg-transparent border-none outline-none font-bold text-text-primary focus:ring-0 w-full p-0 cursor-pointer tracking-wide"
          style={{ fontSize: getTypo('body') }}
        />
      </div>

      <div className="w-full sm:w-auto min-w-max shrink-0 flex flex-col gap-1.5">
        <div className="relative w-full bg-hover-bg/60 border-2 border-border-subtle/20 px-3.5 py-2.5 sm:py-3 rounded-xl transition-interaction duration-fast ease-standard flex items-center shadow-sm">
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
            <PremiumSelect
              value={period}
              onChange={handlePeriodChange}
              options={[{ id: 'AM', name: 'AM' }, { id: 'PM', name: 'PM' }]}
              className="w-[70px]"
            />
          </div>
        </div>
        {error && (
          <div id={id ? `${id}-error` : undefined} role="alert" className="text-danger font-bold text-[11px] sm:text-[12px] px-1">
            {error}
          </div>
        )}
      </div>
    </div>
  )
}
