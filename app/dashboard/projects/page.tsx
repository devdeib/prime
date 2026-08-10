"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  Alert,
  Badge,
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
import styles from "@/components/dashboard/admin-surface.module.css";
import catStyles from "./categories.module.css";

// ─── Types ───────────────────────────────────────────────────────────────────

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

// ─── Category storage (localStorage, key: "prime_project_categories") ────────

const CAT_KEY = "prime_project_categories";
const DEFAULT_CATS = ["Residential", "Commercial"];

function loadCategories(): string[] {
  try {
    const raw = localStorage.getItem(CAT_KEY);
    if (!raw) return DEFAULT_CATS;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_CATS;
  } catch {
    return DEFAULT_CATS;
  }
}

function saveCategories(cats: string[]) {
  try {
    localStorage.setItem(CAT_KEY, JSON.stringify(cats));
  } catch {}
}

// ─── Component ───────────────────────────────────────────────────────────────

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

  // ── Categories state ────────────────────────────────────────────────────────
  const [categories, setCategories] = useState<string[]>([]);
  const [newCatName, setNewCatName] = useState("");
  const [editingCat, setEditingCat] = useState<string | null>(null);
  const [editingCatValue, setEditingCatValue] = useState("");
  const [catError, setCatError] = useState<string | null>(null);

  // Load categories from localStorage after mount
  useEffect(() => {
    setCategories(loadCategories());
  }, []);

  const persistCategories = (updated: string[]) => {
    setCategories(updated);
    saveCategories(updated);
  };

  const addCategory = () => {
    const name = newCatName.trim();
    if (!name) { setCatError("Category name cannot be empty."); return; }
    if (categories.map((c) => c.toLowerCase()).includes(name.toLowerCase())) {
      setCatError("A category with this name already exists."); return;
    }
    setCatError(null);
    persistCategories([...categories, name]);
    setNewCatName("");
  };

  const startEditCat = (cat: string) => {
    setEditingCat(cat);
    setEditingCatValue(cat);
    setCatError(null);
  };

  const saveEditCat = () => {
    const name = editingCatValue.trim();
    if (!name) { setCatError("Category name cannot be empty."); return; }
    if (
      name.toLowerCase() !== editingCat?.toLowerCase() &&
      categories.map((c) => c.toLowerCase()).includes(name.toLowerCase())
    ) {
      setCatError("A category with this name already exists."); return;
    }
    setCatError(null);
    const updated = categories.map((c) => (c === editingCat ? name : c));
    persistCategories(updated);
    // Also update all projects with the old category name
    setRows((prev) =>
      prev.map((r) =>
        r.project_type === editingCat ? { ...r, project_type: name } : r
      )
    );
    setEditingCat(null);
    setEditingCatValue("");
  };

  const deleteCategory = (cat: string) => {
    const count = rows.filter((r) => (r.project_type ?? "") === cat).length;
    const msg = count > 0
      ? `Delete "${cat}"? ${count} project(s) using it will show as uncategorised.`
      : `Delete "${cat}"?`;
    if (!confirm(msg)) return;
    persistCategories(categories.filter((c) => c !== cat));
  };

  // ── Project form ────────────────────────────────────────────────────────────
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
    projectType: categories[0] ?? "Residential",
    images: [] as string[],
  });

  const [form, setForm] = useState(emptyForm());

  // Keep default projectType in sync with first category after load
  useEffect(() => {
    if (categories.length > 0 && !form.projectType) {
      setForm((p) => ({ ...p, projectType: categories[0] }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categories]);

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
      projectType: r.project_type ?? categories[0] ?? "Residential",
      images:
        r.images?.filter(Boolean) ??
        (r.image_url?.trim() ? [r.image_url.trim()] : []),
    });
    if (fileRef.current) fileRef.current.value = "";
  };

  const submitCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    if (uploadingImage) { setError("Please wait for the image upload to finish."); return; }
    setSaving(true); setError(null);
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
        setError((j as { message?: string; error?: string }).message ?? (j as { message?: string; error?: string }).error ?? t("dashboard.couldNotCreate"));
        return;
      }
      reset(); await load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t("dashboard.couldNotCreate"));
    } finally { setSaving(false); }
  };

  const submitUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin || editingId == null) return;
    if (uploadingImage) { setError("Please wait for the image upload to finish."); return; }
    setSaving(true); setError(null);
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
        setError((j as { message?: string; error?: string }).message ?? (j as { message?: string; error?: string }).error ?? t("dashboard.couldNotSave"));
        return;
      }
      reset(); await load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t("dashboard.couldNotSave"));
    } finally { setSaving(false); }
  };

  const remove = async (id: number) => {
    if (!confirm(t("dashboard.deleteProjectConfirm"))) return;
    const res = await fetch(`/api/be/projects/${id}`, { method: "DELETE", credentials: "include" });
    if (!res.ok) { setError(t("dashboard.couldNotDelete")); return; }
    if (editingId === id) reset();
    await load();
  };

  const onPickUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      setUploadingImage(true); setUploadProgress(0);
      const url = await uploadMediaWithProgress(f, setUploadProgress);
      setForm((prev) => ({ ...prev, images: [...prev.images, url] }));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t("dashboard.uploadFailed"));
    } finally {
      setUploadingImage(false); setUploadProgress(null);
    }
    e.target.value = "";
  };

  const removeImageAt = (index: number) => {
    setForm((prev) => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }));
  };

  // ─────────────────────────────────────────────────────────────────────────
  if (status === "loading" || loading) return <p className="p-4">{t("dashboard.loading")}</p>;
  if (!isAdmin) return <AdminAccessHint />;

  return (
    <div className={styles.page}>
      <div className={styles.hero}>
        <div>
          <p className={styles.eyebrow}>Dashboard</p>
          <h1 className={styles.title}>{t("dashboard.projectsMenu")}</h1>
          <p className={styles.subtle}>Manage projects, categories, and gallery images.</p>
        </div>
      </div>

      {error && (
        <Alert variant="danger" dismissible onClose={() => setError(null)}>{error}</Alert>
      )}

      {/* ── Categories panel ──────────────────────────────────────────────── */}
      <Card className={`${styles.panel} mb-4`}>
        <Card.Body>
          <Card.Title className={styles.panelTitle}>Project Categories</Card.Title>
          <p className="text-muted small mb-3">
            Add, rename, or remove categories. When creating a project you pick one from this list.
          </p>

          {catError && (
            <Alert variant="warning" dismissible onClose={() => setCatError(null)} className="py-2 small">
              {catError}
            </Alert>
          )}

          {/* Existing categories */}
          <div className={catStyles.catList}>
            {categories.map((cat) => (
              <div key={cat} className={catStyles.catRow}>
                {editingCat === cat ? (
                  <>
                    <Form.Control
                      size="sm"
                      value={editingCatValue}
                      onChange={(e) => setEditingCatValue(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); saveEditCat(); } if (e.key === "Escape") setEditingCat(null); }}
                      className={catStyles.catInput}
                      autoFocus
                    />
                    <Button size="sm" variant="dark" onClick={saveEditCat} className={catStyles.catBtn}>Save</Button>
                    <Button size="sm" variant="outline-secondary" onClick={() => setEditingCat(null)} className={catStyles.catBtn}>Cancel</Button>
                  </>
                ) : (
                  <>
                    <span className={catStyles.catName}>
                      {cat}
                      <Badge bg="secondary" className={catStyles.catCount}>
                        {rows.filter((r) => (r.project_type ?? "") === cat).length}
                      </Badge>
                    </span>
                    <Button size="sm" variant="outline-primary" onClick={() => startEditCat(cat)} className={catStyles.catBtn}>Rename</Button>
                    <Button size="sm" variant="outline-danger" onClick={() => deleteCategory(cat)} className={catStyles.catBtn}>Delete</Button>
                  </>
                )}
              </div>
            ))}
            {categories.length === 0 && (
              <p className="text-muted small mb-0">No categories yet. Add one below.</p>
            )}
          </div>

          {/* Add new category */}
          <div className={catStyles.addRow}>
            <Form.Control
              size="sm"
              placeholder="New category name (e.g. Hospitality)"
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCategory(); } }}
              className={catStyles.addInput}
            />
            <Button size="sm" variant="dark" onClick={addCategory} className={catStyles.catBtn}>
              + Add
            </Button>
          </div>
        </Card.Body>
      </Card>

      {/* ── Project form ───────────────────────────────────────────────────── */}
      <Card className={`${styles.panel} mb-4`}>
        <Card.Body>
          <Card.Title className={styles.panelTitle}>
            {editingId == null ? t("dashboard.addProject") : `${t("dashboard.editProject")} #${editingId}`}
          </Card.Title>
          <Form onSubmit={editingId == null ? submitCreate : submitUpdate} className="mt-2">
            <Row className="g-2 mb-2">
              <Col md={3}>
                <Form.Label>{t("dashboard.nameEn")}</Form.Label>
                <Form.Control
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  required
                />
              </Col>
              <Col md={3}>
                <Form.Label>{t("dashboard.nameAr")}</Form.Label>
                <Form.Control
                  value={form.nameAr}
                  onChange={(e) => setForm((p) => ({ ...p, nameAr: e.target.value }))}
                />
              </Col>
              <Col md={2}>
                <Form.Label>{t("dashboard.cityEn")}</Form.Label>
                <Form.Control
                  value={form.city}
                  onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))}
                />
              </Col>
              <Col md={2}>
                <Form.Label>{t("dashboard.cityAr")}</Form.Label>
                <Form.Control
                  value={form.cityAr}
                  onChange={(e) => setForm((p) => ({ ...p, cityAr: e.target.value }))}
                />
              </Col>
              <Col md={2}>
                <Form.Label>{t("dashboard.sortOrder")}</Form.Label>
                <Form.Control
                  type="number"
                  value={form.sortOrder}
                  onChange={(e) => setForm((p) => ({ ...p, sortOrder: e.target.value }))}
                />
              </Col>
              <Col md={2}>
                <Form.Label>Category</Form.Label>
                <Form.Select
                  value={form.projectType}
                  onChange={(e) => setForm((p) => ({ ...p, projectType: e.target.value }))}
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                  {categories.length === 0 && (
                    <option value="">No categories — add one above</option>
                  )}
                </Form.Select>
              </Col>
            </Row>
            <Row className="g-2 mb-2">
              <Col md={6}>
                <Form.Label>{t("dashboard.addressEn")}</Form.Label>
                <Form.Control
                  value={form.address}
                  onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
                />
              </Col>
              <Col md={6}>
                <Form.Label>{t("dashboard.addressAr")}</Form.Label>
                <Form.Control
                  value={form.addressAr}
                  onChange={(e) => setForm((p) => ({ ...p, addressAr: e.target.value }))}
                />
              </Col>
            </Row>
            <Row className="g-2 mb-2">
              <Col md={6}>
                <Form.Label>{t("dashboard.descriptionEn")}</Form.Label>
                <Form.Control
                  as="textarea" rows={2}
                  value={form.description}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                />
              </Col>
              <Col md={6}>
                <Form.Label>{t("dashboard.descriptionAr")}</Form.Label>
                <Form.Control
                  as="textarea" rows={2}
                  value={form.descriptionAr}
                  onChange={(e) => setForm((p) => ({ ...p, descriptionAr: e.target.value }))}
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
                {uploadingImage && <div className="small text-muted mt-2">Uploading image...</div>}
                {uploadProgress != null && (
                  <div className={styles.progressShell}>
                    <div className={styles.progressBar} style={{ width: `${uploadProgress}%` }} />
                    <span className={styles.progressLabel}>Uploading... {uploadProgress}%</span>
                  </div>
                )}
                {form.images.length > 0 && (
                  <div className="d-flex gap-2 flex-wrap mt-2">
                    {form.images.map((image, index) => (
                      <div key={`${image}-${index}`} className="border rounded p-1 bg-white">
                        <div className="position-relative overflow-hidden rounded bg-light" style={{ width: 88, height: 60 }}>
                          <Image
                            src={image} alt="" fill sizes="88px"
                            style={{ objectFit: "cover" }}
                            unoptimized={image.startsWith("/uploads/") || image.startsWith("http")}
                          />
                        </div>
                        <Button
                          type="button" size="sm" variant="outline-danger"
                          className="mt-1 w-100" onClick={() => removeImageAt(index)}
                        >
                          {t("dashboard.remove")}
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </Col>
              <Col md={4}>
                <Button
                  type="submit" variant="dark"
                  className={`w-100 ${styles.primaryBtn}`}
                  disabled={saving || uploadingImage}
                >
                  {uploadingImage ? "Uploading image..." : saving ? t("dashboard.saving") : editingId == null ? t("dashboard.add") : t("dashboard.save")}
                </Button>
                {editingId != null && (
                  <Button
                    type="button" variant="outline-secondary"
                    className={`w-100 mt-2 ${styles.secondaryBtn}`}
                    onClick={reset} disabled={saving}
                  >
                    {t("dashboard.cancel")}
                  </Button>
                )}
              </Col>
            </Row>
          </Form>
        </Card.Body>
      </Card>

      {/* ── Projects table ─────────────────────────────────────────────────── */}
      <div className={styles.tableWrap}>
        <Table responsive bordered hover size="sm" className="bg-white shadow-sm">
          <thead className="table-light">
            <tr>
              <th style={{ width: 88 }} />
              <th>ID</th>
              <th>{t("dashboard.name")}</th>
              <th>{t("dashboard.city")}</th>
              <th>{t("dashboard.sortOrder")}</th>
              <th>Category</th>
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
                      <div className="position-relative rounded overflow-hidden bg-light" style={{ width: 72, height: 48 }}>
                        {cover ? (
                          <Image src={cover} alt="" fill style={{ objectFit: "cover" }} sizes="72px"
                            unoptimized={cover.startsWith("/uploads/") || cover.startsWith("http")}
                          />
                        ) : <span className="small text-muted p-1">-</span>}
                      </div>
                    </td>
                    <td>{r.id}</td>
                    <td>{r.name}</td>
                    <td>{r.city ?? "-"}</td>
                    <td>{r.sort_order}</td>
                    <td>{r.project_type ?? "-"}</td>
                    <td>{r.images?.length ?? (r.image_url ? 1 : 0)}</td>
                    <td>
                      <Button size="sm" variant="outline-primary" className="me-1" onClick={() => startEdit(r)}>
                        {t("dashboard.edit")}
                      </Button>
                      <Button size="sm" variant="outline-danger" onClick={() => void remove(r.id)}>
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
