"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import {
  Alert,
  Button,
  Card,
  Col,
  Form,
  Row,
  Table,
} from "react-bootstrap";
import { useSession } from "next-auth/react";
import AdminAccessHint from "@/components/dashboard/AdminAccessHint";
import { useTranslation } from "react-i18next";
import styles from "@/components/dashboard/admin-surface.module.css";

type HeroSlide = {
  id: number;
  image_url: string;
  sort_order: number;
};

async function uploadProductImage(file: File): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch("/api/be/upload/product-image", {
    method: "POST",
    body: fd,
    credentials: "include",
  });
  const json = (await res.json()) as { url?: string; message?: string; error?: string };
  if (!res.ok) throw new Error(json.message ?? json.error ?? "Upload failed");
  if (!json.url) throw new Error("No URL returned");
  return json.url;
}

export default function DashboardHeroSlidesPage() {
  const { t } = useTranslation("common");
  const { data: session, status } = useSession();
  const role = (session as { role?: string } | null)?.role;
  const isAdmin = role === "admin";

  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [candidates, setCandidates] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pickUrl, setPickUrl] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [sRes, cRes] = await Promise.all([
        fetch("/api/be/hero-slides", { credentials: "include" }),
        fetch("/api/be/hero-image-candidates", { credentials: "include" }),
      ]);
      const sJson = await sRes.json();
      const cJson = await cRes.json();
      if (Array.isArray(sJson)) setSlides(sJson);
      if (Array.isArray(cJson)) setCandidates(cJson);
    } catch {
      setError(t("dashboard.failedToLoadHeroSlides"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    if (isAdmin) void load();
  }, [isAdmin, load]);

  const addSlide = async (imageUrl: string) => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/be/hero-slides", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image_url: imageUrl }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setError(
          (j as { message?: string; error?: string }).message ??
          (j as { message?: string; error?: string }).error ??
          t("dashboard.couldNotAddSlide")
        );
        return;
      }
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : t("dashboard.couldNotAddSlide"));
    } finally {
      setSaving(false);
    }
  };

  const updateSlide = async (id: number, patch: Partial<HeroSlide>) => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/be/hero-slides/${id}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setError(
          (j as { message?: string; error?: string }).message ??
          (j as { message?: string; error?: string }).error ??
          t("dashboard.couldNotSave")
        );
        return;
      }
      await load();
    } catch {
      setError(t("dashboard.couldNotSave"));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: number) => {
    if (!confirm(t("dashboard.deleteSlideConfirm"))) return;
    setError(null);
    const res = await fetch(`/api/be/hero-slides/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (!res.ok) {
      setError(t("dashboard.couldNotDelete"));
      return;
    }
    await load();
  };

  const onUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      const url = await uploadProductImage(f);
      await addSlide(url);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t("dashboard.uploadFailed"));
    }
    e.target.value = "";
  };

  if (status === "loading" || loading) {
    return <p className="p-4">{t("dashboard.loading")}</p>;
  }

  if (!isAdmin) {
    return <AdminAccessHint />;
  }

  return (
    <div className={styles.page}>
      <div className={styles.hero}>
        <div>
          <p className={styles.eyebrow}>Dashboard</p>
          <h1 className={styles.title}>{t("dashboard.heroSlides")}</h1>
          <p className={styles.subtle}>{t("dashboard.heroSlidesHelp")}</p>
        </div>
      </div>

      {error && (
        <Alert variant="danger" dismissible onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Card className={`${styles.panel} mb-4`}>
        <Card.Body>
          <Card.Title className={styles.panelTitle}>
            {t("dashboard.pickFromLibrary")}
          </Card.Title>
          <Row className="g-2 align-items-end mb-3">
            <Col md={8}>
              <Form.Select
                value={pickUrl}
                onChange={(e) => setPickUrl(e.target.value)}
              >
                <option value="">—</option>
                {candidates.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </Form.Select>
            </Col>
            <Col md={4}>
              <Button
                variant="dark"
                className={`w-100 ${styles.primaryBtn}`}
                disabled={!pickUrl || saving}
                onClick={() => pickUrl && void addSlide(pickUrl)}
              >
                {t("dashboard.addSlide")}
              </Button>
            </Col>
          </Row>
          <div>
            <Form.Label className="small text-muted">{t("dashboard.uploadNewImage")}</Form.Label>
            <Form.Control
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={onUpload}
              disabled={saving}
            />
          </div>
        </Card.Body>
      </Card>

      <div className={styles.tableWrap}>
      <Table responsive bordered hover size="sm" className="bg-white shadow-sm">
        <thead className="table-light">
          <tr>
            <th style={{ width: 120 }}>{t("dashboard.preview")}</th>
            <th>ID</th>
            <th>{t("dashboard.url")}</th>
            <th>{t("dashboard.sortOrder")}</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {[...slides]
            .sort((a, b) => a.sort_order - b.sort_order || a.id - b.id)
            .map((s) => (
              <tr key={s.id}>
                <td>
                  <div
                    className="position-relative rounded overflow-hidden bg-light"
                    style={{ width: 100, height: 56 }}
                  >
                    <Image
                      src={s.image_url}
                      alt=""
                      fill
                      style={{ objectFit: "cover" }}
                      sizes="100px"
                      unoptimized={
                        s.image_url.startsWith("/uploads/") ||
                        s.image_url.startsWith("http")
                      }
                    />
                  </div>
                </td>
                <td>{s.id}</td>
                <td>
                  <code className="small">{s.image_url}</code>
                </td>
                <td style={{ maxWidth: 120 }}>
                  <Form.Control
                    type="number"
                    size="sm"
                    key={`${s.id}-${s.sort_order}`}
                    defaultValue={s.sort_order}
                    onBlur={(e) =>
                      void updateSlide(s.id, {
                        sort_order: Number(e.target.value),
                      })
                    }
                    disabled={saving}
                  />
                </td>
                <td>
                  <Button
                    size="sm"
                    variant="outline-danger"
                    onClick={() => void remove(s.id)}
                    disabled={saving}
                  >
                    {t("dashboard.delete")}
                  </Button>
                </td>
              </tr>
            ))}
        </tbody>
      </Table>
      </div>
    </div>
  );
}
