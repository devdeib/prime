"use client";

import { useCallback, useEffect, useState } from "react";
import { Alert, Badge, Button, Card, Table } from "react-bootstrap";
import { useSession } from "next-auth/react";
import { useTranslation } from "react-i18next";
import AdminAccessHint from "@/components/dashboard/AdminAccessHint";
import VipMeetingSettingsPanel from "@/components/dashboard/VipMeetingSettingsPanel";
import {
  formatMeetingDate,
  formatMeetingTime,
  type VipMeetingRow,
} from "@/lib/vip-meetings";
import styles from "@/components/dashboard/admin-surface.module.css";

export default function DashboardVipMeetingsPage() {
  const { t, i18n } = useTranslation("common");
  const locale = i18n.language?.startsWith("ar") ? "ar" : "en";
  const { data: session } = useSession();
  const role = (session as { role?: string } | null)?.role;
  const isAdmin = role === "admin";

  const [rows, setRows] = useState<VipMeetingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/be/vip-meetings/today", {
        credentials: "include",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error ?? t("dashboard.failedToLoadMeetings"));
      setRows(Array.isArray(json) ? json : []);
    } catch (err) {
      setRows([]);
      setError(err instanceof Error ? err.message : t("dashboard.failedToLoadMeetings"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    if (isAdmin) void load();
  }, [isAdmin, load]);

  const updateStatus = async (id: number, status: VipMeetingRow["status"]) => {
    setUpdatingId(id);
    setError(null);
    try {
      const res = await fetch(`/api/be/vip-meetings/${id}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error ?? t("dashboard.couldNotUpdate"));
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("dashboard.couldNotUpdate"));
    } finally {
      setUpdatingId(null);
    }
  };

  const statusVariant = (status: VipMeetingRow["status"]) => {
    if (status === "confirmed") return "success";
    if (status === "cancelled") return "secondary";
    return "warning";
  };

  if (!isAdmin) {
    return <AdminAccessHint />;
  }

  return (
    <section className={styles.page}>
      <header className={styles.hero}>
        <div>
          <p className={styles.eyebrow}>{t("dashboard.vipMeetingsEyebrow")}</p>
          <h1 className={styles.title}>{t("dashboard.vipMeetings")}</h1>
          <p className={styles.subtle}>{t("dashboard.vipMeetingsHelp")}</p>
        </div>
        <Button variant="outline-dark" onClick={() => void load()} disabled={loading}>
          {t("dashboard.refresh")}
        </Button>
      </header>

      {error ? (
        <Alert variant="danger" className="rounded-0">
          {error}
        </Alert>
      ) : null}

      <Card className={styles.panel}>
        <Card.Body>
          <h2 className={styles.panelTitle}>{t("dashboard.meetingsToday")}</h2>
          {loading ? (
            <p className={styles.subtle}>{t("dashboard.loading")}</p>
          ) : rows.length === 0 ? (
            <p className={styles.subtle}>{t("dashboard.noMeetingsToday")}</p>
          ) : (
            <div className={styles.tableWrap}>
              <Table responsive bordered hover className="mb-0 align-middle">
                <thead>
                  <tr>
                    <th>{t("dashboard.meetingTime")}</th>
                    <th>{t("dashboard.meetingGuest")}</th>
                    <th>{t("dashboard.meetingContact")}</th>
                    <th>{t("dashboard.meetingNotes")}</th>
                    <th>{t("dashboard.meetingStatus")}</th>
                    <th>{t("dashboard.actions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.id}>
                      <td>
                        <div>{formatMeetingTime(row.scheduled_at, locale)}</div>
                        <small className="text-muted">
                          {formatMeetingDate(row.scheduled_at, locale)}
                        </small>
                      </td>
                      <td>{row.guest_name}</td>
                      <td>
                        <div>{row.guest_email}</div>
                        {row.guest_phone ? (
                          <small className="text-muted">{row.guest_phone}</small>
                        ) : null}
                      </td>
                      <td>{row.notes?.trim() || "—"}</td>
                      <td>
                        <Badge bg={statusVariant(row.status)} className="text-uppercase">
                          {t(`dashboard.meetingStatus_${row.status}`)}
                        </Badge>
                      </td>
                      <td>
                        <div className="d-flex flex-wrap gap-2">
                          {row.status !== "confirmed" ? (
                            <Button
                              size="sm"
                              variant="outline-success"
                              disabled={updatingId === row.id}
                              onClick={() => void updateStatus(row.id, "confirmed")}
                            >
                              {t("dashboard.confirmMeeting")}
                            </Button>
                          ) : null}
                          {row.status !== "cancelled" ? (
                            <Button
                              size="sm"
                              variant="outline-danger"
                              disabled={updatingId === row.id}
                              onClick={() => void updateStatus(row.id, "cancelled")}
                            >
                              {t("dashboard.cancelMeeting")}
                            </Button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </Card.Body>
      </Card>

      <VipMeetingSettingsPanel />
    </section>
  );
}
