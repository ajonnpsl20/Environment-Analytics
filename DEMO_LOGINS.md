# Demo logins (TEMPORARY — safe to delete)

All demo users share the same password: **`demo1234`**

| Role | Email | Password | Sees / can do |
|---|---|---|---|
| **System Admin** | `admin@envirohub.demo` | `demo1234` | **All 5 sites** + the **Sites** management screen + manage everything (approve, connectors, audit log) |
| **Site Admin – England** | `siteadmin@envirohub.demo` | `demo1234` | **Manchester, Birmingham, London** only — enter data, approve/reject/return, run connector, audit log (scoped to those 3 sites). **No** Sites management |
| **Site Admin – Scotland & Wales** | `siteadmin2@envirohub.demo` | `demo1234` | **Glasgow, Cardiff** only — same powers as the other Site Admin, scoped to those 2 sites |
| **Data Entry User** | `data@envirohub.demo` | `demo1234` | **Manchester, Birmingham** only — enter/import/export data. **No** approvals, connector, or audit log |

## Seeing the role difference (for the pitch)
- Log in as **System Admin** → all 5 sites everywhere, plus the **Sites** nav item.
- Log in as **Site Admin – England** → dashboards, tables, approvals queue, exports, and audit show **only Manchester / Birmingham / London**; the **Sites** nav item is gone.
- Log in as **Site Admin – Scotland & Wales** → the same, but **only Glasgow / Cardiff**.
- Log in as **Data Entry User** → only Manchester / Birmingham, and no Approvals / Connectors / Audit Log nav.

> There is also a non-login service account `system@envirohub.demo` (the "SAP Connector (System)" account) used to attribute connector-imported records — you don't log in as it.

_Reset to clean demo data anytime with:_ `npm run db:seed`

_This file is a convenience note; delete it before pushing to GitHub if you'd rather not ship it (the password is only the shared demo value, not a real secret)._
