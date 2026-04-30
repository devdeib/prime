"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Button, Card, Col, Form, Row, Table, Alert } from "react-bootstrap";
import { useSession } from "next-auth/react";
import AdminAccessHint from "@/components/dashboard/AdminAccessHint";
import { uploadMediaWithProgress } from "@/components/dashboard/upload-media";
import { useTranslation } from "react-i18next";
import styles from "@/components/dashboard/admin-surface.module.css";

type Category = {
  id: number;
  name: string;
  name_ar?: string | null;
  alias: string;
};

type ProductRow = {
  id: number;
  name: string;
  name_ar?: string | null;
  price: number;
  category?: string;
  descriptions?: string;
  descriptions_ar?: string | null;
  thumbUrl?: string;
  external_url?: string | null;
};

export default function DashboardProductsPage() {
  const { t } = useTranslation("common");
  const { data: session, status } = useSession();
  const role = (session as { role?: string } | null)?.role;
  const isAdmin = role === "admin";
  const productLinkLabel =
    t("dashboard.productLink") === "dashboard.productLink"
      ? "Product link"
      : t("dashboard.productLink");
  const productLinkHelp =
    t("dashboard.productLinkHelp") === "dashboard.productLinkHelp"
      ? "When customers click this product, they will be redirected to this external store URL."
      : t("dashboard.productLinkHelp");
  const productLinkPlaceholder =
    t("dashboard.productLinkPlaceholder") ===
    "dashboard.productLinkPlaceholder"
      ? "https://store.example.com/product-name"
      : t("dashboard.productLinkPlaceholder");
  const openLinkLabel =
    t("dashboard.openLink") === "dashboard.openLink"
      ? "Open link"
      : t("dashboard.openLink");

  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  const [name, setName] = useState("");
  const [nameAr, setNameAr] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("sofas");
  const [descriptions, setDescriptions] = useState("");
  const [descriptionsAr, setDescriptionsAr] = useState("");
  const [externalUrl, setExternalUrl] = useState("");

  const [editingId, setEditingId] = useState<number | null>(null);
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);
  const [pickedFile, setPickedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [removeImage, setRemoveImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [catRes, prodRes] = await Promise.all([
        fetch("/api/be/categories", { credentials: "include" }),
        fetch("/api/be/products", { credentials: "include" }),
      ]);
      const catJson = await catRes.json();
      const prodJson = await prodRes.json();
      if (Array.isArray(catJson)) setCategories(catJson);
      if (Array.isArray(prodJson)) {
        setProducts(
          prodJson.map(
            (p: ProductRow & {
              category_id?: number;
              storage_files?: { image_url?: string }[];
            }) => ({
              id: p.id,
              name: p.name,
              name_ar: p.name_ar,
              price: p.price,
              category: p.category ?? "others",
              descriptions: p.descriptions,
              descriptions_ar: p.descriptions_ar,
              external_url: p.external_url,
              thumbUrl:
                p.storage_files?.[0]?.image_url ??
                (p as { image_url?: string }).image_url,
            })
          )
        );
      }
    } catch {
      setError(t("dashboard.failedToLoadCategories"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    return () => {
      if (previewUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const resetForm = () => {
    setName("");
    setNameAr("");
    setPrice("");
    setCategory(categories[0]?.alias ?? "sofas");
    setDescriptions("");
    setDescriptionsAr("");
    setExternalUrl("");
    setEditingId(null);
    setExistingImageUrl(null);
    setPickedFile(null);
    if (previewUrl?.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setRemoveImage(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  useEffect(() => {
    if (categories.length && !category) {
      setCategory(categories[0].alias);
    }
  }, [categories, category]);

  const onPickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    setRemoveImage(false);
    if (!f) {
      setPickedFile(null);
      if (previewUrl?.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(editingId != null ? existingImageUrl : null);
      return;
    }
    setPickedFile(f);
    if (previewUrl?.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(f));
  };

  const submitCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    setError(null);
    setSaving(true);
    try {
      let imageUrl: string | undefined;
      if (pickedFile) {
        setUploadProgress(0);
        imageUrl = await uploadMediaWithProgress(pickedFile, setUploadProgress);
      }
      const res = await fetch("/api/be/products", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          name_ar: nameAr.trim() || undefined,
          price: Number(price),
          category,
          descriptions: descriptions || undefined,
          descriptions_ar: descriptionsAr.trim() || undefined,
          external_url: externalUrl.trim() || undefined,
          ...(imageUrl ? { image_url: imageUrl } : {}),
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setError(
          (j as { message?: string; error?: string }).message ??
          (j as { message?: string; error?: string }).error ??
          t("dashboard.couldNotCreateProduct")
        );
        return;
      }
      resetForm();
      await load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t("dashboard.couldNotCreateProduct"));
    } finally {
      setUploadProgress(null);
      setSaving(false);
    }
  };

  const startEdit = (p: ProductRow) => {
    setEditingId(p.id);
    setName(p.name);
    setNameAr(p.name_ar ?? "");
    setPrice(String(p.price));
    setCategory(p.category ?? "sofas");
    setDescriptions(p.descriptions ?? "");
    setDescriptionsAr(p.descriptions_ar ?? "");
    setExternalUrl(p.external_url ?? "");
    setPickedFile(null);
    setRemoveImage(false);
    if (previewUrl?.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
    const u = p.thumbUrl ?? null;
    setExistingImageUrl(u && !u.includes("picsum.photos") ? u : null);
    setPreviewUrl(u ?? null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const submitUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin || editingId == null) return;
    setError(null);
    setSaving(true);
    try {
      let imagePatch: { image_url: string } | undefined;
      if (removeImage) {
        imagePatch = { image_url: "" };
      } else if (pickedFile) {
        setUploadProgress(0);
        const url = await uploadMediaWithProgress(pickedFile, setUploadProgress);
        imagePatch = { image_url: url };
      }

      const body: Record<string, unknown> = {
        name,
        name_ar: nameAr,
        price: Number(price),
        category,
        descriptions,
        descriptions_ar: descriptionsAr,
        external_url: externalUrl.trim(),
      };
      if (imagePatch) body.image_url = imagePatch.image_url;

      const res = await fetch(`/api/be/products/${editingId}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setError(
          (j as { message?: string; error?: string }).message ??
          (j as { message?: string; error?: string }).error ??
          t("dashboard.couldNotUpdateProduct")
        );
        return;
      }
      resetForm();
      await load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t("dashboard.couldNotUpdateProduct"));
    } finally {
      setUploadProgress(null);
      setSaving(false);
    }
  };

  const remove = async (id: number) => {
    if (!isAdmin || !confirm(t("dashboard.deleteProductConfirm"))) return;
    setError(null);
    const res = await fetch(`/api/be/products/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (!res.ok) {
      setError(t("dashboard.couldNotDeleteProduct"));
      return;
    }
    await load();
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
          <h1 className={styles.title}>{t("dashboard.productsPageTitle")}</h1>
          <p className={styles.subtle}>{t("dashboard.manageProductsHelp")}</p>
        </div>
      </div>

      {error && (
        <Alert variant="danger" onClose={() => setError(null)} dismissible>
          {error}
        </Alert>
      )}

      <Card className={`${styles.panel} mb-4`}>
        <Card.Body>
          <Card.Title className={styles.panelTitle}>
            {editingId == null
              ? t("dashboard.addProduct")
              : `${t("dashboard.editProduct")} #${editingId}`}
          </Card.Title>
          <Form onSubmit={editingId == null ? submitCreate : submitUpdate}>
            <Row className="g-2 mb-2">
              <Col md={3}>
                <Form.Label>{t("dashboard.nameEn")}</Form.Label>
                <Form.Control
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </Col>
              <Col md={3}>
                <Form.Label>{t("dashboard.nameAr")}</Form.Label>
                <Form.Control
                  value={nameAr}
                  onChange={(e) => setNameAr(e.target.value)}
                  placeholder={t("dashboard.optionalPlaceholder")}
                />
              </Col>
              <Col md={2}>
                <Form.Label>{t("dashboard.price")}</Form.Label>
                <Form.Control
                  type="number"
                  min={0}
                  step={1}
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  required
                />
              </Col>
              <Col md={4}>
                <Form.Label>{t("dashboard.category")}</Form.Label>
                <Form.Select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.alias}>
                      {c.name}
                    </option>
                  ))}
                </Form.Select>
              </Col>
            </Row>
            <Row className="g-2 mb-2">
              <Col md={6}>
                <Form.Label>{t("dashboard.descriptionEn")}</Form.Label>
                <Form.Control
                  value={descriptions}
                  onChange={(e) => setDescriptions(e.target.value)}
                  placeholder={t("dashboard.optionalPlaceholder")}
                />
              </Col>
              <Col md={6}>
                <Form.Label>{t("dashboard.descriptionAr")}</Form.Label>
                <Form.Control
                  value={descriptionsAr}
                  onChange={(e) => setDescriptionsAr(e.target.value)}
                  placeholder={t("dashboard.optionalPlaceholder")}
                />
              </Col>
            </Row>
            <Row className="g-2 mb-2">
              <Col md={12}>
                <Form.Label>{productLinkLabel}</Form.Label>
                <Form.Control
                  type="url"
                  value={externalUrl}
                  onChange={(e) => setExternalUrl(e.target.value)}
                  placeholder={productLinkPlaceholder}
                />
                <Form.Text className="text-muted">
                  {productLinkHelp}
                </Form.Text>
              </Col>
            </Row>
            <Row className="g-2 mb-3 align-items-end">
              <Col md={6}>
                <Form.Label>{t("dashboard.productImage")}</Form.Label>
                <Form.Control
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={onPickFile}
                />
                <Form.Text className="text-muted">
                  {t("dashboard.imageHelp")}
                </Form.Text>
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
              </Col>
              <Col md={6}>
                {editingId != null && existingImageUrl && (
                  <Button
                    type="button"
                    variant="outline-warning"
                    size="sm"
                    className="me-2"
                    onClick={() => {
                      setRemoveImage(true);
                      setPickedFile(null);
                      if (fileInputRef.current) fileInputRef.current.value = "";
                      if (previewUrl?.startsWith("blob:"))
                        URL.revokeObjectURL(previewUrl);
                      setPreviewUrl(null);
                      setExistingImageUrl(null);
                    }}
                  >
                    {t("dashboard.removeSavedImage")}
                  </Button>
                )}
              </Col>
            </Row>
            {previewUrl && (
              <div className={styles.previewCard}>
                <Image
                  src={previewUrl}
                  alt={t("dashboard.preview")}
                  fill
                  className="rounded border bg-light"
                  style={{ objectFit: "contain" }}
                  unoptimized={
                    previewUrl.startsWith("blob:") ||
                    previewUrl.startsWith("/uploads/")
                  }
                />
              </div>
            )}
              <Button
                type="submit"
                variant="dark"
                className={`me-2 ${styles.primaryBtn}`}
                disabled={saving}
              >
              {saving
                ? t("dashboard.saving")
                : editingId == null
                  ? t("dashboard.add")
                  : t("dashboard.save")}
            </Button>
            {editingId != null && (
              <Button
                type="button"
                variant="outline-secondary"
                className={styles.secondaryBtn}
                onClick={resetForm}
                disabled={saving}
              >
                {t("dashboard.cancelEdit")}
              </Button>
            )}
          </Form>
        </Card.Body>
      </Card>

      <div className={styles.tableWrap}>
      <Table striped bordered hover size="sm">
        <thead>
          <tr>
            <th style={{ width: 72 }}>{t("dashboard.preview")}</th>
            <th>ID</th>
            <th>{t("dashboard.nameEn")}</th>
            <th>{t("dashboard.nameAr")}</th>
            <th>{t("dashboard.price")}</th>
            <th>{t("dashboard.category")}</th>
            <th>{productLinkLabel}</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <tr key={p.id}>
              <td className="p-1">
                <div
                  className="position-relative rounded overflow-hidden bg-light"
                  style={{ width: 56, height: 56 }}
                >
                  {p.thumbUrl ? (
                    <Image
                      src={p.thumbUrl}
                      alt=""
                      fill
                      sizes="56px"
                      style={{ objectFit: "cover" }}
                      unoptimized={
                        p.thumbUrl.startsWith("/uploads/") ||
                        p.thumbUrl.startsWith("http")
                      }
                    />
                  ) : (
                    <span className="small text-muted p-1">—</span>
                  )}
                </div>
              </td>
              <td>{p.id}</td>
              <td>{p.name}</td>
              <td>{p.name_ar ?? "—"}</td>
              <td>{p.price}</td>
              <td>{p.category}</td>
              <td>
                {p.external_url ? (
                  <a href={p.external_url} target="_blank" rel="noreferrer">
                    {openLinkLabel}
                  </a>
                ) : (
                  "â€”"
                )}
              </td>
              <td>
                <Button
                  size="sm"
                  variant="outline-primary"
                  className="me-1"
                  onClick={() => startEdit(p)}
                >
                  {t("dashboard.edit")}
                </Button>
                <Button
                  size="sm"
                  variant="outline-danger"
                  onClick={() => remove(p.id)}
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
