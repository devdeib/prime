"use client";

import { useCallback, useEffect, useState } from "react";
import { Alert, Button, Card, Col, Form, Row } from "react-bootstrap";
import { useSession } from "next-auth/react";
import AdminAccessHint from "@/components/dashboard/AdminAccessHint";
import styles from "@/components/dashboard/admin-surface.module.css";

type SiteContent = Record<string, string>;

const SECTIONS = [
  {
    key: "about",
    title: "About us",
    fields: [
      "eyebrow",
      "title",
      "body",
      "image_url",
      "stat_primary_value",
      "stat_primary_label",
      "stat_1_value",
      "stat_1_label",
      "stat_2_value",
      "stat_2_label",
      "stat_3_value",
      "stat_3_label",
    ],
  },
  {
    key: "services",
    title: "Services",
    fields: [
      "eyebrow",
      "title",
      "body",
      "image_url",
      "stat_primary_value",
      "stat_primary_label",
      "stat_1_value",
      "stat_1_label",
      "stat_2_value",
      "stat_2_label",
      "stat_3_value",
      "stat_3_label",
    ],
  },
  {
    key: "contact",
    title: "Contact and map",
    fields: [
      "title",
      "headquarters",
      "headquarters_value",
      "phone_label",
      "phone_value",
      "email_label",
      "email_value",
      "hours_label",
      "hours_value",
      "map_embed_url",
    ],
  },
  {
    key: "footer_socials",
    title: "Footer social links",
    fields: ["facebook", "instagram", "snapchat", "linkedin"],
  },
] as const;

function localizedFieldNames(field: string) {
  if (field === "image_url" || field === "map_embed_url") return [field];
  if (["facebook", "instagram", "snapchat", "linkedin"].includes(field)) {
    return [field];
  }
  return [`${field}_en`, `${field}_ar`];
}

export default function DashboardContentPage() {
  const { data: session, status } = useSession();
  const role = (session as { role?: string } | null)?.role;
  const isAdmin = role === "admin";
  const [content, setContent] = useState<Record<string, SiteContent>>({});
  const [active, setActive] = useState<(typeof SECTIONS)[number]["key"]>("about");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/be/site-content", { credentials: "include" });
      const json = await res.json();
      setContent(json ?? {});
    } catch {
      setError("Could not load editable content.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) void load();
  }, [isAdmin, load]);

  const section = SECTIONS.find((item) => item.key === active) ?? SECTIONS[0];
  const form = content[section.key] ?? {};

  const updateField = (name: string, value: string) => {
    setContent((current) => ({
      ...current,
      [section.key]: {
        ...(current[section.key] ?? {}),
        [name]: value,
      },
    }));
  };

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/be/site-content/${section.key}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setError(json?.error ?? "Could not save content. Check the Supabase site_content table.");
      }
    } finally {
      setSaving(false);
    }
  };

  if (status === "loading" || loading) return <p className="p-4">Loading...</p>;
  if (!isAdmin) return <AdminAccessHint />;

  return (
    <div className={styles.page}>
      <div className={styles.hero}>
        <div>
          <p className={styles.eyebrow}>Dashboard</p>
          <h1 className={styles.title}>Editable content</h1>
          <p className={styles.subtle}>
            Update About, Services, Contact map details, and footer social links.
          </p>
        </div>
      </div>

      {error ? (
        <Alert variant="danger" dismissible onClose={() => setError(null)}>
          {error}
        </Alert>
      ) : null}

      <Card className={styles.panel}>
        <Card.Body>
          <div className="d-flex gap-2 flex-wrap mb-4">
            {SECTIONS.map((item) => (
              <Button
                key={item.key}
                type="button"
                variant={active === item.key ? "dark" : "outline-dark"}
                onClick={() => setActive(item.key)}
              >
                {item.title}
              </Button>
            ))}
          </div>

          <Row className="g-3">
            {section.fields.flatMap((field) =>
              localizedFieldNames(field).map((name) => (
                <Col md={name.includes("body") || name.includes("hours") ? 12 : 6} key={name}>
                  <Form.Label>{name.replaceAll("_", " ")}</Form.Label>
                  {name.includes("body") || name.includes("hours") ? (
                    <Form.Control
                      as="textarea"
                      rows={name.includes("body") ? 8 : 3}
                      value={form[name] ?? ""}
                      onChange={(event) => updateField(name, event.target.value)}
                    />
                  ) : (
                    <Form.Control
                      value={form[name] ?? ""}
                      onChange={(event) => updateField(name, event.target.value)}
                    />
                  )}
                </Col>
              ))
            )}
          </Row>

          <Button
            type="button"
            variant="dark"
            className={`mt-4 ${styles.primaryBtn}`}
            disabled={saving}
            onClick={() => void save()}
          >
            {saving ? "Saving..." : "Save content"}
          </Button>
        </Card.Body>
      </Card>
    </div>
  );
}
