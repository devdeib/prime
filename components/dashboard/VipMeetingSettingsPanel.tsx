"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Button, Card, Col, Form, Row } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import {
  DEFAULT_VIP_MEETING_SETTINGS,
  type DaySchedule,
  type VipMeetingSettings,
} from "@/lib/vip-meeting-settings";
import styles from "@/components/dashboard/admin-surface.module.css";
import panelStyles from "./vip-meeting-settings-panel.module.css";

const DOW_KEYS = ["0", "1", "2", "3", "4", "5", "6"] as const;
const SLOT_OPTIONS = [30, 45, 60, 90, 120];

function padMonth(year: number, month: number) {
  return `${year}-${String(month).padStart(2, "0")}`;
}

function daysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}

function firstWeekday(year: number, month: number) {
  return new Date(year, month - 1, 1).getDay();
}

export default function VipMeetingSettingsPanel() {
  const { t } = useTranslation("common");
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth() + 1);
  const [settings, setSettings] = useState<VipMeetingSettings>(
    DEFAULT_VIP_MEETING_SETTINGS
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/be/vip-meeting-settings", {
        credentials: "include",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error ?? t("dashboard.failedToLoadVipSettings"));
      setSettings({
        ...DEFAULT_VIP_MEETING_SETTINGS,
        ...json,
        weekly: { ...DEFAULT_VIP_MEETING_SETTINGS.weekly, ...(json.weekly ?? {}) },
        blocked_dates: Array.isArray(json.blocked_dates) ? json.blocked_dates : [],
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : t("dashboard.failedToLoadVipSettings"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void load();
  }, [load]);

  const monthKey = padMonth(viewYear, viewMonth);
  const monthLabel = useMemo(() => {
    return new Date(viewYear, viewMonth - 1, 1).toLocaleDateString(undefined, {
      month: "long",
      year: "numeric",
    });
  }, [viewMonth, viewYear]);

  const calendarCells = useMemo(() => {
    const total = daysInMonth(viewYear, viewMonth);
    const leading = firstWeekday(viewYear, viewMonth);
    const cells: Array<{ type: "empty" } | { type: "day"; date: string; day: number }> =
      [];
    for (let i = 0; i < leading; i++) cells.push({ type: "empty" });
    for (let day = 1; day <= total; day++) {
      cells.push({
        type: "day",
        date: `${monthKey}-${String(day).padStart(2, "0")}`,
        day,
      });
    }
    return cells;
  }, [monthKey, viewMonth, viewYear]);

  const blockedSet = useMemo(
    () => new Set(settings.blocked_dates),
    [settings.blocked_dates]
  );

  const toggleBlockedDate = (date: string) => {
    setSaved(false);
    setSettings((prev) => {
      const next = new Set(prev.blocked_dates);
      if (next.has(date)) next.delete(date);
      else next.add(date);
      return { ...prev, blocked_dates: Array.from(next).sort() };
    });
  };

  const updateWeekly = (dow: string, patch: Partial<DaySchedule>) => {
    setSaved(false);
    setSettings((prev) => ({
      ...prev,
      weekly: {
        ...prev.weekly,
        [dow]: { ...prev.weekly[dow], ...patch },
      },
    }));
  };

  const save = async () => {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch("/api/be/vip-meeting-settings", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error ?? t("dashboard.couldNotSaveVipSettings"));
      setSettings(json);
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("dashboard.couldNotSaveVipSettings"));
    } finally {
      setSaving(false);
    }
  };

  const shiftMonth = (delta: number) => {
    const next = new Date(viewYear, viewMonth - 1 + delta, 1);
    setViewYear(next.getFullYear());
    setViewMonth(next.getMonth() + 1);
  };

  return (
    <Card className={`${styles.panel} mt-4`}>
      <Card.Body>
        <div className="d-flex flex-wrap justify-content-between align-items-start gap-3 mb-3">
          <div>
            <h2 className={styles.panelTitle}>{t("dashboard.vipAvailabilityTitle")}</h2>
            <p className={styles.subtle}>{t("dashboard.vipAvailabilityHelp")}</p>
          </div>
          <Button variant="dark" onClick={() => void save()} disabled={saving || loading}>
            {saving ? t("dashboard.saving") : t("dashboard.saveAvailability")}
          </Button>
        </div>

        {error ? <Alert variant="danger" className="rounded-0">{error}</Alert> : null}
        {saved ? (
          <Alert variant="success" className="rounded-0">
            {t("dashboard.vipAvailabilitySaved")}
          </Alert>
        ) : null}

        <Row className="g-4">
          <Col lg={5}>
            <h3 className={panelStyles.sectionTitle}>{t("dashboard.vipBlockedDays")}</h3>
            <p className={panelStyles.sectionHint}>{t("dashboard.vipBlockedDaysHelp")}</p>
            <div className={panelStyles.calendarNav}>
              <button type="button" className={panelStyles.navBtn} onClick={() => shiftMonth(-1)}>
                ‹
              </button>
              <span className={panelStyles.monthLabel}>{monthLabel}</span>
              <button type="button" className={panelStyles.navBtn} onClick={() => shiftMonth(1)}>
                ›
              </button>
            </div>
            <div className={panelStyles.weekdays}>
              {DOW_KEYS.map((key) => (
                <span key={key} className={panelStyles.weekday}>
                  {t(`dashboard.vipWeekdays.${key}`)}
                </span>
              ))}
            </div>
            <div className={panelStyles.days} aria-busy={loading}>
              {calendarCells.map((cell, index) => {
                if (cell.type === "empty") {
                  return <span key={`e-${index}`} className={panelStyles.dayEmpty} />;
                }
                const blocked = blockedSet.has(cell.date);
                return (
                  <button
                    key={cell.date}
                    type="button"
                    disabled={loading}
                    className={`${panelStyles.dayBtn} ${
                      blocked ? panelStyles.dayBlocked : panelStyles.dayOpen
                    }`}
                    onClick={() => toggleBlockedDate(cell.date)}
                    title={
                      blocked
                        ? t("dashboard.vipClickToUnblock")
                        : t("dashboard.vipClickToBlock")
                    }
                  >
                    {cell.day}
                  </button>
                );
              })}
            </div>
            <p className={panelStyles.legend}>
              <span className={`${panelStyles.swatch} ${panelStyles.swatchOpen}`} />
              {t("dashboard.vipLegendOpen")}
              <span className={`${panelStyles.swatch} ${panelStyles.swatchBlocked}`} />
              {t("dashboard.vipLegendBlocked")}
            </p>
          </Col>

          <Col lg={7}>
            <h3 className={panelStyles.sectionTitle}>{t("dashboard.vipWeeklyHours")}</h3>
            <p className={panelStyles.sectionHint}>{t("dashboard.vipWeeklyHoursHelp")}</p>

            <Row className="g-3 mb-3">
              <Col sm={6}>
                <Form.Group>
                  <Form.Label>{t("dashboard.vipSlotDuration")}</Form.Label>
                  <Form.Select
                    value={settings.slot_duration_minutes}
                    disabled={loading}
                    onChange={(e) => {
                      setSaved(false);
                      setSettings((prev) => ({
                        ...prev,
                        slot_duration_minutes: Number(e.target.value),
                      }));
                    }}
                  >
                    {SLOT_OPTIONS.map((minutes) => (
                      <option key={minutes} value={minutes}>
                        {minutes} {t("dashboard.vipMinutes")}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col sm={6}>
                <Form.Group>
                  <Form.Label>{t("dashboard.vipBookingHorizon")}</Form.Label>
                  <Form.Control
                    type="number"
                    min={7}
                    max={120}
                    value={settings.booking_horizon_days}
                    disabled={loading}
                    onChange={(e) => {
                      setSaved(false);
                      setSettings((prev) => ({
                        ...prev,
                        booking_horizon_days: Number(e.target.value) || 60,
                      }));
                    }}
                  />
                </Form.Group>
              </Col>
            </Row>

            <div className={panelStyles.scheduleTable}>
              {DOW_KEYS.map((dow) => {
                const row = settings.weekly[dow];
                return (
                  <div key={dow} className={panelStyles.scheduleRow}>
                    <Form.Check
                      type="switch"
                      id={`vip-dow-${dow}`}
                      label={t(`dashboard.vipWeekdays.${dow}`)}
                      checked={row.enabled}
                      disabled={loading}
                      onChange={(e) => updateWeekly(dow, { enabled: e.target.checked })}
                    />
                    <Form.Control
                      type="time"
                      value={row.start}
                      disabled={loading || !row.enabled}
                      onChange={(e) => updateWeekly(dow, { start: e.target.value })}
                    />
                    <span className={panelStyles.scheduleSep}>–</span>
                    <Form.Control
                      type="time"
                      value={row.end}
                      disabled={loading || !row.enabled}
                      onChange={(e) => updateWeekly(dow, { end: e.target.value })}
                    />
                  </div>
                );
              })}
            </div>
          </Col>
        </Row>
      </Card.Body>
    </Card>
  );
}
