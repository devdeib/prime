"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Button,
  Card,
  Col,
  Form,
  Row,
  Table,
  Alert,
} from "react-bootstrap";
import { useSession } from "next-auth/react";
import AdminAccessHint from "@/components/dashboard/AdminAccessHint";
import { useTranslation } from "react-i18next";
import styles from "@/components/dashboard/admin-surface.module.css";

type CategoryRow = {
  id: number;
  name: string;
  name_ar?: string | null;
  alias: string;
};

export default function DashboardCategoriesPage() {
  const { t } = useTranslation("common");
  const { data: session, status } = useSession();
  const role = (session as { role?: string } | null)?.role;
  const isAdmin = role === "admin";

  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [nameAr, setNameAr] = useState("");
  const [alias, setAlias] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/be/categories", { credentials: "include" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message ?? "Failed to load");
      if (Array.isArray(json)) {
        setCategories(
          json.map(
            (c: {
              id: number;
              name: string;
              name_ar?: string | null;
              alias: string;
            }) => ({
              id: c.id,
              name: c.name,
              name_ar: c.name_ar,
              alias: c.alias,
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

  const resetForm = () => {
    setName("");
    setNameAr("");
    setAlias("");
    setEditingId(null);
  };

  const submitCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    setError(null);
    const res = await fetch("/api/be/categories", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        name_ar: nameAr.trim() || undefined,
        alias: alias.trim() || undefined,
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
    resetForm();
    await load();
  };

  const startEdit = (c: CategoryRow) => {
    setEditingId(c.id);
    setName(c.name);
    setNameAr(c.name_ar ?? "");
    setAlias(c.alias);
  };

  const submitUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin || editingId == null) return;
    setError(null);
    const res = await fetch(`/api/be/categories/${editingId}`, {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        name_ar: nameAr,
        alias: alias.trim() || undefined,
      }),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(
        (j as { message?: string; error?: string; errors?: { alias?: string[] } }).errors
          ?.alias?.[0] ??
          (j as { message?: string; error?: string }).message ??
          (j as { message?: string; error?: string }).error ??
          t("dashboard.couldNotUpdate")
      );
      return;
    }
    resetForm();
    await load();
  };

  const remove = async (id: number) => {
    if (!isAdmin || !confirm(t("dashboard.deleteCategoryConfirm"))) return;
    setError(null);
    const res = await fetch(`/api/be/categories/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(
        (j as { message?: string; error?: string }).message ??
        (j as { message?: string; error?: string }).error ??
        t("dashboard.couldNotDelete")
      );
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
          <h1 className={styles.title}>{t("dashboard.categoriesPageTitle")}</h1>
          <p className={styles.subtle}>{t("dashboard.manageCategoriesHelp")}</p>
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
              ? t("dashboard.addCategory")
              : `${t("dashboard.editCategory")} #${editingId}`}
          </Card.Title>
          <Form onSubmit={editingId == null ? submitCreate : submitUpdate}>
            <Row className="g-2 mb-2">
              <Col md={4}>
                <Form.Label>{t("dashboard.nameEn")}</Form.Label>
                <Form.Control
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder={t("dashboard.nameEnPlaceholder")}
                />
              </Col>
              <Col md={4}>
                <Form.Label>{t("dashboard.nameAr")}</Form.Label>
                <Form.Control
                  value={nameAr}
                  onChange={(e) => setNameAr(e.target.value)}
                  placeholder={t("dashboard.nameArPlaceholder")}
                />
              </Col>
              <Col md={4}>
                <Form.Label>{t("dashboard.slugOptional")}</Form.Label>
                <Form.Control
                  value={alias}
                  onChange={(e) => setAlias(e.target.value)}
                  placeholder={t("dashboard.slugPlaceholder")}
                />
              </Col>
            </Row>
            <Button type="submit" variant="dark" className={`me-2 ${styles.primaryBtn}`}>
              {editingId == null ? t("dashboard.add") : t("dashboard.save")}
            </Button>
            {editingId != null && (
              <Button
                type="button"
                variant="outline-secondary"
                className={styles.secondaryBtn}
                onClick={resetForm}
              >
                {t("dashboard.cancel")}
              </Button>
            )}
          </Form>
        </Card.Body>
      </Card>

      <div className={styles.tableWrap}>
      <Table striped bordered hover size="sm">
        <thead>
          <tr>
            <th>ID</th>
            <th>{t("dashboard.nameEn")}</th>
            <th>{t("dashboard.nameAr")}</th>
            <th>{t("dashboard.slugAlias")}</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {categories.map((c) => (
            <tr key={c.id}>
              <td>{c.id}</td>
              <td>{c.name}</td>
              <td>{c.name_ar ?? "—"}</td>
              <td>
                <code>{c.alias}</code>
              </td>
              <td>
                <Button
                  size="sm"
                  variant="outline-primary"
                  className="me-1"
                  onClick={() => startEdit(c)}
                >
                  {t("dashboard.edit")}
                </Button>
                <Button
                  size="sm"
                  variant="outline-danger"
                  onClick={() => remove(c.id)}
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
