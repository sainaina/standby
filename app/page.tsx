'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Download,
  Expand,
  Pencil,
  Pin,
  Plus,
  RotateCcw,
  Settings2,
  Tv,
  Users,
} from 'lucide-react'

type WeekKey = 'this-week' | 'next-week' | 'week-3' | 'week-4'

type Assignment = {
  name: string
  note: string
  custom: boolean
  updatedAt?: string
}

type WeekDef = {
  key: WeekKey
  label: string
  index: number
  isThisWeek: boolean
}

const WEEKS: WeekDef[] = [
  { key: 'this-week', label: 'This week', index: 0, isThisWeek: true },
  { key: 'next-week', label: 'Next week', index: 1, isThisWeek: false },
  { key: 'week-3', label: 'Week 3', index: 2, isThisWeek: false },
  { key: 'week-4', label: 'Week 4', index: 3, isThisWeek: false },
]

const initialPeople = ['Sreng Panha', 'Chim Saina', 'Lun Maranda', 'Ven Sopheap']

const initialSchedule: Record<WeekKey, Assignment> = {
  'this-week': {
    name: 'Sreng Panha',
    note: 'Pinned for this week',
    custom: true,
  },
  'next-week': {
    name: 'Chim Saina',
    note: 'Automatically rotated from the team schedule',
    custom: false,
  },
  'week-3': {
    name: 'Lun Maranda',
    note: 'Automatically rotated from the team schedule',
    custom: false,
  },
  'week-4': {
    name: 'Ven Sopheap',
    note: 'Automatically rotated from the team schedule',
    custom: false,
  },
}

function getOrdinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return n + (s[(v - 20) % 10] || s[v] || s[0])
}

function getWeekDateRange(weekIndex: number, offset: number) {
  // Base date anchor: Monday Oct 5, 2026
  const baseMonday = new Date(2026, 9, 5)
  const totalOffsetDays = offset * 7 + weekIndex * 7
  const monday = new Date(baseMonday)
  monday.setDate(baseMonday.getDate() + totalOffsetDays)

  const friday = new Date(monday)
  friday.setDate(monday.getDate() + 4)

  const monDate = monday.getDate()
  const friDate = friday.getDate()
  const monMonth = monday.toLocaleDateString('en-US', { month: 'short' })
  const friMonth = friday.toLocaleDateString('en-US', { month: 'short' })
  const fullMonth = monday.toLocaleDateString('en-US', { month: 'long' })
  const year = friday.getFullYear()

  return {
    short: `${getOrdinal(monDate)} – ${getOrdinal(friDate)}`,
    monthYear: `${fullMonth} ${year}`,
    full:
      monMonth === friMonth
        ? `${monMonth} ${monDate} – ${friDate}, ${year}`
        : `${monMonth} ${monDate} – ${friMonth} ${friDate}, ${year}`,
  }
}

function getInitials(name: string): string {
  if (!name) return '??'
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export default function Page() {
  const [weekOffset, setWeekOffset] = useState(0)
  const [schedule, setSchedule] = useState<Record<WeekKey, Assignment>>(initialSchedule)
  const [people, setPeople] = useState<string[]>(initialPeople)
  const [editingWeek, setEditingWeek] = useState<WeekKey | null>(null)
  const [selectedPerson, setSelectedPerson] = useState('')
  const [note, setNote] = useState('')
  const [viewOnly, setViewOnly] = useState(false)
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [isAddPersonOpen, setIsAddPersonOpen] = useState(false)
  const [newPersonName, setNewPersonName] = useState('')
  const [currentTime, setCurrentTime] = useState<string>('')

  // Real-time ticking clock for TV board
  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      setCurrentTime(
        now.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      )
    }
    updateTime()
    const timer = setInterval(updateTime, 1000)
    return () => clearInterval(timer)
  }, [])

  // Load persisted state from localStorage on client mount
  useEffect(() => {
    try {
      const savedSchedule = localStorage.getItem('standby_schedule_v5')
      if (savedSchedule) {
        setSchedule(JSON.parse(savedSchedule))
      }
      const savedPeople = localStorage.getItem('standby_people_v5')
      if (savedPeople) {
        setPeople(JSON.parse(savedPeople))
      }
    } catch {
      // storage unavailable
    }
  }, [])

  const currentToolbarLabel = useMemo(() => {
    const range = getWeekDateRange(0, weekOffset)
    return range.full
  }, [weekOffset])

  function showToast(msg: string) {
    setToastMessage(msg)
    setTimeout(() => {
      setToastMessage(null)
    }, 3200)
  }

  function openEditor(weekKey: WeekKey) {
    setEditingWeek(weekKey)
    setSelectedPerson(schedule[weekKey]?.name || people[0])
    setNote(schedule[weekKey]?.note || '')
  }

  function saveAssignment() {
    if (!editingWeek || !selectedPerson) return

    const weekLabel = WEEKS.find((w) => w.key === editingWeek)?.label || 'Week'
    const updated: Record<WeekKey, Assignment> = {
      ...schedule,
      [editingWeek]: {
        name: selectedPerson,
        note:
          note.trim() ||
          (editingWeek === 'this-week'
            ? 'Pinned for this week'
            : 'Automatically rotated from the team schedule'),
        custom: true,
        updatedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    }

    setSchedule(updated)
    try {
      localStorage.setItem('standby_schedule_v5', JSON.stringify(updated))
    } catch {
      // storage unavailable
    }

    setEditingWeek(null)
    showToast(`Updated ${weekLabel} standby with ${selectedPerson}!`)
  }

  function handleAddPerson() {
    const trimmed = newPersonName.trim()
    if (!trimmed) return
    if (people.includes(trimmed)) {
      showToast(`${trimmed} is already in the roster!`)
      return
    }

    const updatedPeople = [...people, trimmed]
    setPeople(updatedPeople)
    try {
      localStorage.setItem('standby_people_v5', JSON.stringify(updatedPeople))
    } catch {
      // storage unavailable
    }
    setNewPersonName('')
    setIsAddPersonOpen(false)
    showToast(`Added ${trimmed} to team roster!`)
  }

  function resetSchedule() {
    if (confirm('Reset standby schedule back to initial defaults?')) {
      setSchedule(initialSchedule)
      try {
        localStorage.removeItem('standby_schedule_v5')
      } catch {
        // storage unavailable
      }
      showToast('Standby schedule reset to defaults.')
    }
  }

  function toggleFullScreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => { })
    } else {
      document.exitFullscreen?.().catch(() => { })
    }
  }

  function exportView() {
    window.print()
  }

  // =========================================================================
  // VIEW BOARD MODE: 4 COLUMNS & 4 PEOPLE (FULLSCREEN TV / MONITOR)
  // CENTERED AVATAR, CENTERED NAME, 100vh TV FIT (NO SCROLL)
  // =========================================================================
  if (viewOnly) {
    return (
      <main className="tv-board-wrapper">
        {/* LIGHT TV TOPBAR */}
        <header className="tv-topbar">
          <div className="tv-brand-group">
            <div className="brand-mark">
              <CalendarDays />
            </div>
            <div>
              <div className="tv-title-row">
                <h1>Standby board</h1>
                <span className="tv-live-tag">
                  <span className="tv-live-dot" /> Live sync
                </span>
              </div>
              <p className="tv-subtitle">Monthly on-call rotation roster (4 Weeks)</p>
            </div>
          </div>

          <div className="tv-header-center">
            <div className="tv-cycle-pill">
              <CalendarDays />
              <span>{currentToolbarLabel}</span>
            </div>
          </div>

          <div className="tv-actions">
            {currentTime && (
              <div className="tv-clock-pill">
                <Clock className="w-4 h-4 text-slate-500" />
                <span>{currentTime}</span>
              </div>
            )}
            <button
              className="tv-btn tv-btn-action"
              onClick={toggleFullScreen}
              title="Full screen view for TV"
            >
              <Expand className="w-4 h-4" />
              <span>Full screen</span>
            </button>
            <button
              className="tv-btn tv-btn-primary"
              onClick={() => setViewOnly(false)}
              title="Back to schedule editor"
            >
              <Pencil className="w-4 h-4" />
              <span>Edit schedule</span>
            </button>
          </div>
        </header>

        {/* LIGHT TV MAIN BOARD CONTAINER: 4 COLUMNS */}
        <div className="tv-board-container">
          <div className="tv-board-grid">
            {WEEKS.map((w) => {
              const dateInfo = getWeekDateRange(w.index, weekOffset)
              const assignment = schedule[w.key]
              const isThisWeek = w.isThisWeek

              return (
                <article
                  key={w.key}
                  className={`tv-card ${isThisWeek ? 'tv-card-hero' : 'tv-card-other'}`}
                >
                  {/* CARD HEADER */}
                  <div
                    className={`tv-card-header ${isThisWeek ? 'tv-card-header-hero' : 'tv-card-header-other'
                      }`}
                  >
                    {isThisWeek ? (
                      <div className="tv-hero-pin-badge">
                        <span className="tv-pin-circle-icon">
                          <Pin className="w-3 h-3" />
                        </span>
                        <span className="tv-pin-badge-text">THIS WEEK</span>
                      </div>
                    ) : (
                      <div className="tv-other-tag-badge">
                        <span className="tv-other-index-badge">0{w.index + 1}</span>
                        <span className="tv-other-badge-text">{w.label}</span>
                      </div>
                    )}

                    <div className="tv-card-dates-block">
                      <strong
                        className={
                          isThisWeek ? 'tv-dates-short-hero' : 'tv-dates-short-other'
                        }
                      >
                        {dateInfo.short}
                      </strong>
                      <span className="tv-dates-month-sub">{dateInfo.monthYear}</span>
                    </div>
                  </div>

                  {/* CENTERED AVATAR, NAME & UNIFIED STATUS BADGE */}
                  <div className="tv-card-body">
                    <div className="tv-avatar-wrap">
                      <div
                        className={isThisWeek ? 'tv-avatar-hero' : 'tv-avatar-other'}
                      >
                        {getInitials(assignment.name)}
                      </div>
                      {isThisWeek && (
                        <div className="tv-avatar-pin-corner" title="Pinned Standby">
                          <Pin className="w-2.5 h-2.5" />
                        </div>
                      )}
                    </div>

                    <h2
                      className={
                        isThisWeek ? 'tv-card-name-hero' : 'tv-card-name-other'
                      }
                    >
                      {assignment.name}
                    </h2>

                    {isThisWeek ? (
                      <div className="tv-status-badge-hero">
                        <span className="pulse-dot" />
                        <span>Active on Call</span>
                      </div>
                    ) : (
                      <div className="tv-status-badge-other">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>Rotated Queue</span>
                      </div>
                    )}
                  </div>

                  {/* ALIGNED FOOTER NOTE BOX */}
                  <div
                    className={`tv-card-footer ${isThisWeek ? 'tv-footer-hero' : 'tv-footer-other'
                      }`}
                  >
                    <p>{assignment.note}</p>
                  </div>
                </article>
              )
            })}
          </div>
        </div>

        {/* LIGHT TV FOOTER */}
        <footer className="tv-footer">
          <div className="tv-footer-left">
            <span className="pulse-dot" />
            <span>4-Week rotation active • Live synchronized standby roster</span>
          </div>
          <div>
            <span>Standby Schedule • Operations Team</span>
          </div>
        </footer>
      </main>
    )
  }

  // =========================================================================
  // SCHEDULE EDITOR VIEW: 4 COLUMNS
  // =========================================================================
  return (
    <main className="app-shell">
      {/* SIDEBAR NAVIGATION */}
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">
            <CalendarDays />
          </div>
          <span>Standby</span>
        </div>
        <nav className="side-nav" aria-label="Main navigation">
          <button className="nav-item active">
            <CalendarDays />
            Schedule
          </button>
          <button className="nav-item" onClick={() => setViewOnly(true)}>
            <Tv />
            Standby board
          </button>
          <button className="nav-item" onClick={() => setIsAddPersonOpen(true)}>
            <Users />
            Team Roster ({people.length})
          </button>
          <button className="nav-item">
            <Settings2 />
            Settings
          </button>
        </nav>
        <div className="sidebar-footer">
          <div className="profile-avatar">OP</div>
          <div>
            <strong>Operations</strong>
            <span>Team workspace</span>
          </div>
          <button className="more-button" aria-label="More options">
            •••
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <section className="content">
        <header className="topbar">
          <div>
            <p className="eyebrow">
              Operations / Weekly standby
              <span className="eyebrow-badge">
                <span className="live-dot" /> Live sync
              </span>
            </p>
            <h1>Standby schedule</h1>
          </div>
          <div className="topbar-actions">
            <button
              className="outline-button active-toggle"
              onClick={() => setViewOnly(true)}
              title="Open View board presentation"
            >
              <Tv />
              View board
            </button>
            <button className="outline-button" onClick={exportView}>
              <Download />
              Export view
            </button>
            <button className="outline-button" onClick={toggleFullScreen}>
              <Expand />
              Full screen
            </button>
            <button className="outline-button" onClick={resetSchedule}>
              <RotateCcw />
              Reset week
            </button>
          </div>
        </header>

        <div className="content-inner">
          {/* HERO ROW */}
          <section className="hero-row">
            <div>
              <h2>Weekly standby coverage (4 Weeks)</h2>
              <p>
                This week standby is pinned in high-notice Red with a Pin icon. Other weeks are
                styled in neutral Gray.
              </p>
            </div>
            <div className="hero-actions">
              <button className="outline-button" onClick={() => setViewOnly(true)}>
                <Tv />
                View board
              </button>
              <button className="primary-button" onClick={() => setIsAddPersonOpen(true)}>
                <Plus />
                Add person
              </button>
            </div>
          </section>

          {/* DATE RANGE TOOLBAR */}
          <section className="week-toolbar">
            <button
              className="icon-button"
              aria-label="Previous week"
              onClick={() => setWeekOffset((v) => v - 1)}
            >
              <ChevronLeft />
            </button>
            <div className="week-date">
              <CalendarDays />
              <strong>{currentToolbarLabel}</strong>
              {weekOffset === 0 ? (
                <span className="week-badge-current">Current cycle</span>
              ) : (
                <button className="reset-offset-btn" onClick={() => setWeekOffset(0)}>
                  Return to current
                </button>
              )}
            </div>
            <button
              className="icon-button"
              aria-label="Next week"
              onClick={() => setWeekOffset((v) => v + 1)}
            >
              <ChevronRight />
            </button>
          </section>

          {/* MAIN EDITABLE SCHEDULE GRID (4 COLUMNS) */}
          <div className="schedule-grid">
            {WEEKS.map((w) => {
              const dateInfo = getWeekDateRange(w.index, weekOffset)
              const assignment = schedule[w.key]
              const isThisWeek = w.isThisWeek

              return (
                <article
                  key={w.key}
                  className={`day-card ${isThisWeek ? 'card-this-week' : 'card-other-week'}`}
                >
                  <div className="day-card-header">
                    <div>
                      <span className="day-number">0{w.index + 1}</span>
                      <h3>{w.label}</h3>
                      <strong className="week-card-dates">{dateInfo.short}</strong>
                    </div>

                    {isThisWeek ? (
                      <div className="this-week-pin-badge">
                        <span className="pin-circle-icon">
                          <Pin />
                        </span>
                        <span>Pinned</span>
                      </div>
                    ) : (
                      <span className="gray-pill">
                        <Clock />
                        Scheduled
                      </span>
                    )}
                  </div>

                  <div className="assignment">
                    <div className="avatar-container">
                      <div
                        className={isThisWeek ? 'avatar-this-week' : 'avatar-other-week'}
                      >
                        {getInitials(assignment.name)}
                      </div>
                      {isThisWeek && (
                        <div className="avatar-pin-circle" title="Pinned Standby">
                          <Pin />
                        </div>
                      )}
                    </div>

                    <div className="person-copy">
                      <strong>{assignment.name}</strong>
                      <span>{assignment.note}</span>
                      {isThisWeek && (
                        <span className="live-pulse-badge">
                          <span className="pulse-dot" /> Active
                        </span>
                      )}
                    </div>
                  </div>

                  <button className="edit-button" onClick={() => openEditor(w.key)}>
                    <Pencil />
                    Change assignment
                  </button>
                </article>
              )
            })}
          </div>

          {/* AUTOMATION NOTICE */}
          <div className="automation-note">
            <div className="automation-icon">
              <RotateCcw />
            </div>
            <div>
              <strong>4-Person Automatic Rotation Active</strong>
              <p>
                Changes made here immediately synchronize with the View Board. Column 1 is
                pinned in Red with a Pin Circle icon.
              </p>
            </div>
            <span className="on-badge">LIVE ON</span>
          </div>

          <p className="footer-note">
            Standby coverage updates are stored and automatically synchronized for operations.
          </p>
        </div>
      </section>

      {/* CHANGE ASSIGNMENT MODAL */}
      {editingWeek && (
        <div
          className="modal-backdrop"
          role="presentation"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setEditingWeek(null)
          }}
        >
          <section
            className="edit-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-title"
          >
            <div className="modal-heading">
              <div>
                <p className="eyebrow">
                  {WEEKS.find((w) => w.key === editingWeek)?.label} coverage
                </p>
                <h2 id="edit-title">Change standby assignment</h2>
              </div>
              <button
                className="close-button"
                aria-label="Close"
                onClick={() => setEditingWeek(null)}
              >
                ×
              </button>
            </div>

            <label className="form-label">
              Standby Person
              <select
                className="form-select"
                value={selectedPerson}
                onChange={(e) => setSelectedPerson(e.target.value)}
              >
                {people.map((person) => (
                  <option key={person} value={person}>
                    {person}
                  </option>
                ))}
              </select>
            </label>

            <label className="form-label">
              Role & Notes
              <span className="input-wrap">
                <Pencil />
                <input
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="e.g. Pinned for this week"
                />
              </span>
            </label>

            <div className="quick-tags">
              <button
                type="button"
                className="chip-btn"
                onClick={() => setNote('Pinned for this week')}
              >
                Pinned for this week
              </button>
              <button
                type="button"
                className="chip-btn"
                onClick={() => setNote('Primary standby coverage')}
              >
                Primary standby
              </button>
              <button
                type="button"
                className="chip-btn"
                onClick={() => setNote('Shift swap coverage')}
              >
                Shift swap
              </button>
              <button
                type="button"
                className="chip-btn"
                onClick={() => setNote('Automatically rotated from the team schedule')}
              >
                Auto rotated
              </button>
            </div>

            <div className="modal-actions">
              <button className="outline-button" onClick={() => setEditingWeek(null)}>
                Cancel
              </button>
              <button className="primary-button" onClick={saveAssignment}>
                <Check />
                Save change
              </button>
            </div>
          </section>
        </div>
      )}

      {/* ADD PERSON MODAL */}
      {isAddPersonOpen && (
        <div
          className="modal-backdrop"
          role="presentation"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setIsAddPersonOpen(false)
          }}
        >
          <section
            className="edit-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-person-title"
          >
            <div className="modal-heading">
              <div>
                <p className="eyebrow">Team Management</p>
                <h2 id="add-person-title">Add Team Member</h2>
              </div>
              <button
                className="close-button"
                aria-label="Close"
                onClick={() => setIsAddPersonOpen(false)}
              >
                ×
              </button>
            </div>

            <label className="form-label">
              Full Name
              <input
                className="form-input"
                value={newPersonName}
                onChange={(e) => setNewPersonName(e.target.value)}
                placeholder="e.g. John Doe or Kalyan Rath"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddPerson()
                }}
              />
            </label>

            <div className="modal-actions">
              <button className="outline-button" onClick={() => setIsAddPersonOpen(false)}>
                Cancel
              </button>
              <button className="primary-button" onClick={handleAddPerson}>
                <Plus />
                Add to roster
              </button>
            </div>
          </section>
        </div>
      )}

      {/* TOAST CONFIRMATION NOTIFICATION */}
      {toastMessage && (
        <div className="toast-notice" role="status">
          <Check className="toast-icon" />
          <span>{toastMessage}</span>
        </div>
      )}
    </main>
  )
}
