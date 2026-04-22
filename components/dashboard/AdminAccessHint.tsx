"use client";

import { Alert } from "react-bootstrap";
import styles from "./admin-surface.module.css";

/**
 * Explains how to obtain `role: admin` for dashboard sections that require it.
 */
export default function AdminAccessHint() {
  return (
    <div className={styles.page}>
      <Alert variant="warning">
        <h5 className="alert-heading">Admin access required</h5>
        <p className="mb-3">
          These tools are available only when your session has{" "}
          <strong>role: admin</strong>. Accounts created via sign-up default to{" "}
          <strong>user</strong>.
        </p>
        <hr />
        <p className="fw-semibold mb-2">Option A — Local mock (no real backend)</p>
        <ol className="small mb-3 ps-3">
          <li>Click <strong>Logout</strong> in the sidebar.</li>
          {/* <li>
            Sign in with the seeded admin:{" "}
            <code>admin@vg.local</code> / <code>admin123</code>
          </li> */}
        </ol>
        <p className="fw-semibold mb-2">Option B — Promote your user (still local)</p>
        <p className="small mb-3">
          Stop the dev server, open{" "}
          <code>data/.mock-backend-store.json</code>, find your user, set{" "}
          <code>&quot;role&quot;: &quot;admin&quot;</code>, save, restart, then{" "}
          <strong>sign out and sign in again</strong> (session must reload).
        </p>
        <p className="fw-semibold mb-2">Option C — Real API</p>
        <p className="small mb-0">
          Set <code>API_BASE</code> / <code>NEXT_PUBLIC_API_BASE</code> to your
          server. Your API must return <code>role: &quot;admin&quot;</code> in
          the login payload for users who should manage the store. After changing
          roles in the database, sign out and sign in again.
        </p>
      </Alert>
    </div>
  );
}
