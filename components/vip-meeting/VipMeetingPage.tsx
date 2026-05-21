"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Form } from "react-bootstrap";
import { FormProvider, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { useTranslation } from "react-i18next";
import BaseContainer from "@/components/common/container/BaseContainer";
import { InputField } from "@/components/common/form/InputField";
import TextAreaField from "@/components/common/form/TextAreaField";
import SubmitButton from "@/components/common/form/SubmitButton";
import { getErrorMessage } from "@/data/utils/lib";
import {
  VipMeetingFormFields,
  vipMeetingSchema,
} from "@/components/vip-meeting/helpers";
import styles from "./vip-meeting-page.module.css";

type Slot = { time: string; label: string; available: boolean };

const WEEKDAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;

function padMonth(year: number, month: number) {
  return `${year}-${String(month).padStart(2, "0")}`;
}

function daysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}

function firstWeekday(year: number, month: number) {
  return new Date(year, month - 1, 1).getDay();
}

export default function VipMeetingPage() {
  const { t, i18n } = useTranslation("common");
  const locale = i18n.language?.startsWith("ar") ? "ar" : "en";
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth() + 1);
  const [availability, setAvailability] = useState<Record<string, boolean>>({});
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [loadingMonth, setLoadingMonth] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const reactHookFormMethods = useForm<VipMeetingFormFields>({
    resolver: yupResolver(vipMeetingSchema),
    mode: "onTouched",
    defaultValues: {
      guest_name: "",
      guest_email: "",
      guest_phone: "",
      notes: "",
    },
  });

  const {
    handleSubmit,
    formState: { errors },
    reset,
  } = reactHookFormMethods;

  const errorMessage = getErrorMessage(errors);
  const monthKey = padMonth(viewYear, viewMonth);

  const loadMonth = useCallback(async () => {
    setLoadingMonth(true);
    setError(null);
    try {
      const res = await fetch(`/api/be/vip-meetings?month=${monthKey}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error ?? "Failed to load calendar");
      setAvailability(json.availability ?? {});
    } catch (err) {
      setAvailability({});
      setError(err instanceof Error ? err.message : t("vipMeetingPage.loadError"));
    } finally {
      setLoadingMonth(false);
    }
  }, [monthKey, t]);

  const loadSlots = useCallback(
    async (date: string) => {
      setLoadingSlots(true);
      setError(null);
      try {
        const res = await fetch(`/api/be/vip-meetings?date=${date}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error ?? "Failed to load slots");
        setSlots(Array.isArray(json.slots) ? json.slots : []);
      } catch (err) {
        setSlots([]);
        setError(err instanceof Error ? err.message : t("vipMeetingPage.loadError"));
      } finally {
        setLoadingSlots(false);
      }
    },
    [t]
  );

  useEffect(() => {
    void loadMonth();
  }, [loadMonth]);

  useEffect(() => {
    if (!selectedDate) return;
    void loadSlots(selectedDate);
  }, [selectedDate, loadSlots]);

  const calendarCells = useMemo(() => {
    const totalDays = daysInMonth(viewYear, viewMonth);
    const leading = firstWeekday(viewYear, viewMonth);
    const cells: Array<{ type: "empty" } | { type: "day"; date: string; day: number }> =
      [];
    for (let i = 0; i < leading; i++) cells.push({ type: "empty" });
    for (let day = 1; day <= totalDays; day++) {
      const date = `${monthKey}-${String(day).padStart(2, "0")}`;
      cells.push({ type: "day", date, day });
    }
    return cells;
  }, [viewMonth, viewYear, monthKey]);

  const monthLabel = useMemo(() => {
    const date = new Date(viewYear, viewMonth - 1, 1);
    return date.toLocaleDateString(locale === "ar" ? "ar" : "en", {
      month: "long",
      year: "numeric",
    });
  }, [locale, viewMonth, viewYear]);

  const selectedSummary = useMemo(() => {
    if (!selectedDate || !selectedTime) return null;
    const date = new Date(`${selectedDate}T${selectedTime}:00`);
    return date.toLocaleString(locale === "ar" ? "ar" : "en", {
      weekday: "long",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }, [locale, selectedDate, selectedTime]);

  const shiftMonth = (delta: number) => {
    const next = new Date(viewYear, viewMonth - 1 + delta, 1);
    setViewYear(next.getFullYear());
    setViewMonth(next.getMonth() + 1);
    setSelectedTime(null);
  };

  const onSelectDate = (date: string, available: boolean) => {
    if (!available) return;
    setSelectedDate(date);
    setSelectedTime(null);
    setSuccess(false);
  };

  const onSubmit = async (data: VipMeetingFormFields) => {
    if (!selectedDate || !selectedTime) {
      setError(t("vipMeetingPage.pickSlot"));
      return;
    }
    setSubmitLoading(true);
    setError(null);
    setSuccess(false);
    try {
      const res = await fetch("/api/be/vip-meetings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          date: selectedDate,
          time: selectedTime,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error ?? t("vipMeetingPage.bookError"));
      setSuccess(true);
      reset();
      setSelectedTime(null);
      await loadMonth();
      if (selectedDate) await loadSlots(selectedDate);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("vipMeetingPage.bookError"));
    } finally {
      setSubmitLoading(false);
    }
  };

  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  return (
    <section className={styles.page}>
      <BaseContainer>
        <div className={styles.inner}>
          <header className={styles.header}>
            <p className={styles.eyebrow}>{t("vipMeetingPage.eyebrow")}</p>
            <h1 className={styles.title}>{t("vipMeetingPage.title")}</h1>
            <p className={styles.subtitle}>{t("vipMeetingPage.subtitle")}</p>
          </header>

          <div className={styles.grid}>
            <div className={styles.panel}>
              <h2 className={styles.panelTitle}>{t("vipMeetingPage.calendarTitle")}</h2>
              <div className={styles.calendarNav}>
                <button
                  type="button"
                  className={styles.navBtn}
                  onClick={() => shiftMonth(-1)}
                  aria-label={t("vipMeetingPage.prevMonth")}
                >
                  ‹
                </button>
                <p className={styles.monthLabel}>{monthLabel}</p>
                <button
                  type="button"
                  className={styles.navBtn}
                  onClick={() => shiftMonth(1)}
                  aria-label={t("vipMeetingPage.nextMonth")}
                >
                  ›
                </button>
              </div>

              <div className={styles.weekdays}>
                {WEEKDAY_KEYS.map((key) => (
                  <span key={key} className={styles.weekday}>
                    {t(`vipMeetingPage.weekdays.${key}`)}
                  </span>
                ))}
              </div>

              <div className={styles.days} aria-busy={loadingMonth}>
                {calendarCells.map((cell, index) => {
                  if (cell.type === "empty") {
                    return <span key={`e-${index}`} className={styles.dayEmpty} />;
                  }
                  const available = availability[cell.date] === true;
                  const selected = selectedDate === cell.date;
                  const isToday = cell.date === todayKey;
                  return (
                    <button
                      key={cell.date}
                      type="button"
                      disabled={!available || loadingMonth}
                      className={[
                        styles.dayBtn,
                        available ? styles.dayAvailable : styles.dayUnavailable,
                        selected ? styles.daySelected : "",
                        isToday ? styles.dayToday : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                      onClick={() => onSelectDate(cell.date, available)}
                    >
                      {cell.day}
                    </button>
                  );
                })}
              </div>

              <div className={styles.legend}>
                <span className={styles.legendItem}>
                  <span className={`${styles.legendSwatch} ${styles.legendAvailable}`} />
                  {t("vipMeetingPage.legendAvailable")}
                </span>
                <span className={styles.legendItem}>
                  <span className={`${styles.legendSwatch} ${styles.legendUnavailable}`} />
                  {t("vipMeetingPage.legendUnavailable")}
                </span>
                <span className={styles.legendItem}>
                  <span className={`${styles.legendSwatch} ${styles.legendSelected}`} />
                  {t("vipMeetingPage.legendSelected")}
                </span>
              </div>

              {selectedDate ? (
                <div>
                  <p className={styles.slotsHint}>
                    {loadingSlots
                      ? t("vipMeetingPage.loadingSlots")
                      : t("vipMeetingPage.pickTime")}
                  </p>
                  <div className={styles.slots}>
                    {slots.map((slot) => (
                      <button
                        key={slot.time}
                        type="button"
                        disabled={!slot.available}
                        className={[
                          styles.slotBtn,
                          !slot.available ? styles.slotUnavailable : "",
                          selectedTime === slot.time ? styles.slotSelected : "",
                        ]
                          .filter(Boolean)
                          .join(" ")}
                        onClick={() => {
                          if (!slot.available) return;
                          setSelectedTime(slot.time);
                          setSuccess(false);
                        }}
                      >
                        {slot.label}
                      </button>
                    ))}
                  </div>
                  {selectedSummary ? (
                    <p className={styles.selectedSummary}>
                      {t("vipMeetingPage.selected")}: <strong>{selectedSummary}</strong>
                    </p>
                  ) : null}
                </div>
              ) : (
                <p className={styles.slotsHint}>{t("vipMeetingPage.pickDate")}</p>
              )}
            </div>

            <div className={`${styles.panel} ${styles.formPanel}`}>
              <h2 className={styles.panelTitle}>{t("vipMeetingPage.formTitle")}</h2>
              <FormProvider {...reactHookFormMethods}>
                <Form onSubmit={handleSubmit(onSubmit)} noValidate>
                  <InputField
                    labelText={t("vipMeetingPage.name")}
                    name="guest_name"
                    inputType="text"
                    errorMessage={errorMessage("guest_name")}
                    labelCls="ft-14"
                  />
                  <InputField
                    labelText={t("vipMeetingPage.email")}
                    name="guest_email"
                    inputType="email"
                    errorMessage={errorMessage("guest_email")}
                    labelCls="ft-14"
                  />
                  <InputField
                    labelText={t("vipMeetingPage.phone")}
                    name="guest_phone"
                    inputType="tel"
                    errorMessage={errorMessage("guest_phone")}
                    labelCls="ft-14"
                  />
                  <TextAreaField
                    labelText={t("vipMeetingPage.notes")}
                    name="notes"
                    rows={4}
                    errorMessage={errorMessage("notes")}
                    labelCls="ft-14"
                  />
                  {error ? <p className={styles.errorBox}>{error}</p> : null}
                  {success ? (
                    <div className={styles.successBox} role="status">
                      {t("vipMeetingPage.success")}
                    </div>
                  ) : null}
                  <SubmitButton
                    isLoading={submitLoading}
                    title={t("vipMeetingPage.submit")}
                    buttonCls={styles.submitBtn}
                    variant="dark"
                  />
                </Form>
              </FormProvider>
            </div>
          </div>
        </div>
      </BaseContainer>
    </section>
  );
}
