"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
import { uploadMediaWithProgress } from "@/components/dashboard/upload-media";
import { useTranslation } from "react-i18next";
import { PROJECT_TYPES, type ProjectType } from "@/lib/project-type";
import styles from "@/components/dashboard/admin-surface.module.css";

type ProjectRow = {
  id: number;
  name: string;
  name_ar?: string | null;
  city?: string | null;
  city_ar?: string | null;
  address?: string | null;
  address_ar?: string | null;
  description?: string | null;
  description_ar?: string | null;
  images?: string[] | null;
  image_url?: string | null;
  sort_order: number;
  project_type?: string | null;
};

export default function DashboardProjectsPage() {
  const { t } = useTranslation("common");
  const { data: session, status } = useSession();
  const role = (session as { role?: string } | null)?.role;
  const isAdmin = role === "admin";

  const [rows, setRows] = useState<ProjectRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const emptyForm = () => ({
    name: "",
    nameAr: "",
    city: "",
    cityAr: "",
    address: "",
    addressAr: "",
    description: "",
    descriptionAr: "",
    sortOrder: "0",
    projectType: "residential" as ProjectType,
    images: [] as string[],
  });

  const [form, setForm] = useState(emptyForm());

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/be/projects", { credentials: "include" });
      const j = await res.json();
      if (Array.isArray(j)) setRows(j);
    } catch {
      setError(t("dashboard.failedToLoadProjects"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    if (isAdmin) void load();
  }, [isAdmin, load]);

  const reset = () => {
    setEditingId(null);
    setForm(emptyForm());
    if (fileRef.current) fileRef.current.value = "";
  };

  const startEdit = (r: ProjectRow) => {
    setEditingId(r.id);
    setForm({
      name: r.name,
      nameAr: r.name_ar ?? "",
      city: r.city ?? "",
      cityAr: r.city_ar ?? "",
      address: r.address ?? "",
      addressAr: r.address_ar ?? "",
      description: r.description ?? "",
      descriptionAr: r.description_ar ?? "",
      sortOrder: String(r.sort_order),
      projectType:
        r.project_type === "commercial" ? "commercial" : "residential",
      images:
        r.images?.filter(Boolean) ??
        (r.image_url?.trim() ? [r.image_url.trim()] : []),
    });
    if (fileRef.current) fileRef.current.value = "";
  };

  const submitCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    if (uploadingImage) {
      setError("Please wait for the image upload to finish.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/be/projects", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          name_ar: form.nameAr || undefined,
          city: form.city || undefined,
          city_ar: form.cityAr || undefined,
          address: form.address || undefined,
          address_ar: form.addressAr || undefined,
          description: form.description || undefined,
          description_ar: form.descriptionAr || undefined,
          images: form.images,
          image_url: form.images[0] || undefined,
          sort_order: Number(form.sortOrder),
          project_type: form.projectType,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setError(
          (j as { message?: string; error?: string }).message ??
          (j as { message?: string; error?: string }).error ??
          t("dashboard.couldNotCreate")
        );
        return;
      }
      reset();
      await load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t("dashboard.couldNotCreate"));
    } finally {
      setSaving(false);
    }
  };

  const submitUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin || editingId == null) return;
    if (uploadingImage) {
      setError("Please wait for the image upload to finish.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/be/projects/${editingId}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          name_ar: form.nameAr,
          city: form.city,
          city_ar: form.cityAr,
          address: form.address,
          address_ar: form.addressAr,
          description: form.description,
          description_ar: form.descriptionAr,
          images: form.images,
          image_url: form.images[0] || "",
          sort_order: Number(form.sortOrder),
          project_type: form.projectType,
        }),
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
      reset();
      await load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t("dashboard.couldNotSave"));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: number) => {
    if (!confirm(t("dashboard.deleteProjectConfirm"))) return;
    const res = await fetch(`/api/be/projects/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (!res.ok) {
      setError(t("dashboard.couldNotDelete"));
      return;
    }
    if (editingId === id) reset();
    await load();
  };

  const onPickUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      setUploadingImage(true);
      setUploadProgress(0);
      const url = await uploadMediaWithProgress(f, setUploadProgress);
      setForm((prev) => ({ ...prev, images: [...prev.images, url] }));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t("dashboard.uploadFailed"));
    } finally {
      setUploadingImage(false);
      setUploadProgress(null);
    }
    e.target.value = "";
  };

  const removeImageAt = (index: number) => {
    setForm((prev) => ({
      ...prev,
      images: prev.images.filter((_, currentIndex) => currentIndex !== index),
    }));
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
          <h1 className={styles.title}>{t("dashboard.projectsMenu")}</h1>
          <p className={styles.subtle}>Manage completed projects, gallery images, and presentation order in the same flow used for showrooms.</p>
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
            {editingId == null
              ? t("dashboard.addProject")
              : `${t("dashboard.editProject")} #${editingId}`}
          </Card.Title>
          <Form
            onSubmit={editingId == null ? submitCreate : submitUpdate}
            className="mt-2"
          >
            <Row className="g-2 mb-2">
              <Col md={3}>
                <Form.Label>{t("dashboard.nameEn")}</Form.Label>
                <Form.Control
                  value={form.name}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, name: e.target.value }))
                  }
                  required
                />
              </Col>
              <Col md={3}>
                <Form.Label>{t("dashboard.nameAr")}</Form.Label>
                <Form.Control
                  value={form.nameAr}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, nameAr: e.target.value }))
                  }
                />
              </Col>
              <Col md={2}>
                <Form.Label>{t("dashboard.cityEn")}</Form.Label>
                <Form.Control
                  value={form.city}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, city: e.target.value }))
                  }
                />
              </Col>
              <Col md={2}>
                <Form.Label>{t("dashboard.cityAr")}</Form.Label>
                <Form.Control
                  value={form.cityAr}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, cityAr: e.target.value }))
                  }
                />
              </Col>
              <Col md={2}>
                <Form.Label>{t("dashboard.sortOrder")}</Form.Label>
                <Form.Control
                  type="number"
                  value={form.sortOrder}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, sortOrder: e.target.value }))
                  }
                />
              </Col>
              <Col md={2}>
                <Form.Label>Project type</Form.Label>
                <Form.Select
                  value={form.projectType}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      projectType: e.target.value as ProjectType,
                    }))
                  }
                >
                  {PROJECT_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type === "commercial" ? "Commercial" : "Residential"}
                    </option>
                  ))}
                </Form.Select>
              </Col>
            </Row>
            <Row className="g-2 mb-2">
              <Col md={6}>
                <Form.Label>{t("dashboard.addressEn")}</Form.Label>
                <Form.Control
                  value={form.address}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, address: e.target.value }))
                  }
                />
              </Col>
              <Col md={6}>
                <Form.Label>{t("dashboard.addressAr")}</Form.Label>
                <Form.Control
                  value={form.addressAr}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, addressAr: e.target.value }))
                  }
                />
              </Col>
            </Row>
            <Row className="g-2 mb-2">
              <Col md={6}>
                <Form.Label>{t("dashboard.descriptionEn")}</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={2}
                  value={form.description}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, description: e.target.value }))
                  }
                />
              </Col>
              <Col md={6}>
                <Form.Label>{t("dashboard.descriptionAr")}</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={2}
                  value={form.descriptionAr}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, descriptionAr: e.target.value }))
                  }
                />
              </Col>
            </Row>
            <Row className="g-2 mb-3 align-items-end">
              <Col md={8}>
                <Form.Label>{t("dashboard.productImage")}s</Form.Label>
                <Form.Control
                  ref={fileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={onPickUpload}
                  disabled={saving || uploadingImage}
                />
                <Form.Text>{t("dashboard.projectImagesHelp")}</Form.Text>
                {uploadingImage ? (
                  <div className="small text-muted mt-2">Uploading image...</div>
                ) : null}
                {uploadProgress != null ? (
                  <div className={styles.progressShell}>
                    <div
                      className={styles.progressBar}
                      style={{ width: `${uploadProgress}%` }}
                    />
                    <span className={styles.progressLabel}>
                      Uploading... {uploadProgress}%
                    </span>
                  </div>
                ) : null}
                {form.images.length > 0 ? (
                  <div className="d-flex gap-2 flex-wrap mt-2">
                    {form.images.map((image, index) => (
                      <div
                        key={`${image}-${index}`}
                        className="border rounded p-1 bg-white"
                      >
                        <div
                          className="position-relative overflow-hidden rounded bg-light"
                          style={{ width: 88, height: 60 }}
                        >
                          <Image
                            src={image}
                            alt=""
                            fill
                            sizes="88px"
                            style={{ objectFit: "cover" }}
                            unoptimized={
                              image.startsWith("/uploads/") ||
                              image.startsWith("http")
                            }
                          />
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline-danger"
                          className="mt-1 w-100"
                          onClick={() => removeImageAt(index)}
                        >
                          {t("dashboard.remove")}
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : null}
              </Col>
              <Col md={4}>
                <Button
                  type="submit"
                  variant="dark"
                  className={`w-100 ${styles.primaryBtn}`}
                  disabled={saving || uploadingImage}
                >
                  {uploadingImage
                    ? "Uploading image..."
                    : saving
                    ? t("dashboard.saving")
                    : editingId == null
                      ? t("dashboard.add")
                      : t("dashboard.save")}
                </Button>
                {editingId != null && (
                  <Button
                    type="button"
                    variant="outline-secondary"
                    className={`w-100 mt-2 ${styles.secondaryBtn}`}
                    onClick={reset}
                    disabled={saving}
                  >
                    {t("dashboard.cancel")}
                  </Button>
                )}
              </Col>
            </Row>
          </Form>
        </Card.Body>
      </Card>

      <div className={styles.tableWrap}>
        <Table responsive bordered hover size="sm" className="bg-white shadow-sm">
          <thead className="table-light">
            <tr>
              <th style={{ width: 88 }} />
              <th>ID</th>
              <th>{t("dashboard.name")}</th>
              <th>{t("dashboard.city")}</th>
              <th>{t("dashboard.sortOrder")}</th>
              <th>{t("dashboard.images")}</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {[...rows]
              .sort((a, b) => a.sort_order - b.sort_order || a.id - b.id)
              .map((r) => {
                const cover = r.images?.[0] || r.image_url || "";
                return (
                  <tr key={r.id}>
                    <td>
                      <div
                        className="position-relative rounded overflow-hidden bg-light"
                        style={{ width: 72, height: 48 }}
                      >
                        {cover ? (
                          <Image
                            src={cover}
                            alt=""
                            fill
                            style={{ objectFit: "cover" }}
                            sizes="72px"
                            unoptimized={
                              cover.startsWith("/uploads/") ||
                              cover.startsWith("http")
                            }
                          />
                        ) : (
                          <span className="small text-muted p-1">-</span>
                        )}
                      </div>
                    </td>
                    <td>{r.id}</td>
                    <td>{r.name}</td>
                    <td>{r.city ?? "-"}</td>
                    <td>{r.sort_order}</td>
                    <td>{r.images?.length ?? (r.image_url ? 1 : 0)}</td>
                    <td>
                      <Button
                        size="sm"
                        variant="outline-primary"
                        className="me-1"
                        onClick={() => startEdit(r)}
                      >
                        {t("dashboard.edit")}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline-danger"
                        onClick={() => void remove(r.id)}
                      >
                        {t("dashboard.delete")}
                      </Button>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </Table>
      </div>
    </div>
  );
}
