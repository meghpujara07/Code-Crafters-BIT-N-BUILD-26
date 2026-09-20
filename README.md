# CloudOps

### Unified Multi-Cloud Resource, Scaling & Cost Management Platform

CloudOps is a unified control plane for managing cloud infrastructure across **AWS, Microsoft Azure, and Google Cloud Platform (GCP)** from a single interface.

It brings together infrastructure monitoring, resource management, cost analytics, AI-assisted recommendations, policy validation, approval workflows, and controlled scaling operations.

> **Core Idea:** See the cost impact before you act — never act without approval.

---

## 1. Problem

Modern applications are increasingly deployed across multiple cloud platforms. Managing these environments creates several operational challenges:

- Infrastructure is distributed across different cloud consoles.
- Teams lack a unified view of resource health and utilization.
- Cloud spending and budgets are difficult to monitor across providers.
- Scaling decisions can have unexpected cost and operational impact.
- High-impact infrastructure changes require governance and approval.
- Tracking who performed an action and why can be difficult.

### Proposed Solution

CloudOps provides a **single control plane** for multi-cloud infrastructure.

The platform connects:

- Infrastructure monitoring
- Resource management
- Cost intelligence
- AI-assisted recommendations
- Policy and budget validation
- Human approval
- Controlled execution
- Audit and notifications

### Workflow

```text
Monitor
   ↓
Understand
   ↓
Recommend
   ↓
Validate
   ↓
Approve
   ↓
Execute
   ↓
Audit
```

---

## 2. Key Features

### Multi-Cloud Management

- Unified AWS, Azure, and GCP resource view
- Cloud account management
- Region and provider information
- Centralized resource inventory

### Infrastructure Monitoring

- Request rate
- P95 latency
- CPU utilization
- Storage utilization
- Fleet uptime
- Error rate
- Configurable monitoring intervals

### Cost Management

- Month-to-date spending
- End-of-month forecast
- Budget utilization
- Daily spending trends
- Service-level cost breakdown
- Budget management

### AI-Assisted Optimization

- Scaling recommendations
- Resource optimization suggestions
- Cost-saving opportunities
- AI-generated explanations
- Confidence and estimated cost impact

### Controlled Scaling

- Scaling preview before execution
- Current vs. recommended capacity
- Projected monthly cost
- Budget impact
- Policy validation
- Permission validation
- Safety-limit validation

### Governance

- Approval workflows
- Policy-based controls
- Budget limits
- Safety limits
- Role-based permissions
- Audit trail

### Operations

- Alert and incident management
- Notification channels
- Cloud account synchronization
- Operational activity tracking

---

## 3. How CloudOps Works

```text
                    Multi-Cloud Infrastructure
                       AWS / Azure / GCP
                                |
                                v
                     +----------------------+
                     | Monitoring & Signals |
                     +----------+-----------+
                                |
                                v
                     +----------------------+
                     | AI Recommendation    |
                     | + Cost Impact        |
                     +----------+-----------+
                                |
                                v
                     +----------------------+
                     | Policy / Budget /    |
                     | Permission / Safety  |
                     | Validation           |
                     +----------+-----------+
                                |
                         Approval Required?
                           /           \
                         Yes            No
                         /               \
                        v                 |
                 Human Approval           |
                        \                 /
                         \               /
                          v             v
                       Controlled Execution
                                |
                                v
                     Live Status + Monitoring
                                |
                                v
                      Audit + Notifications
```

The key principle is that **AI recommends actions, while policies, budgets, permissions, safety limits, and human approval control execution.**

---

## 4. Product Screenshots

### Dashboard

The dashboard provides a fleet-wide view of resources, cost, health, recommendations, approvals, traffic, and AI-assisted insights.

<img width="1535" height="746" alt="Screenshot 2026-09-20 161020" src="https://github.com/user-attachments/assets/ff3bd11b-facd-4a2f-bfd5-06d32b912e23" />


### Fleet Monitoring

Real-time telemetry across AWS, Azure, and GCP, including request rate, latency, uptime, storage, and error rate.

<img width="1917" height="932" alt="Screenshot 2026-09-20 161217" src="https://github.com/user-attachments/assets/4ff676a0-3239-4328-a500-801dc599e2c7" />


### Resource Catalog

A unified inventory with provider, resource type, region, health, runtime status, and monthly cost.

<img width="1917" height="933" alt="Screenshot 2026-09-20 161227" src="https://github.com/user-attachments/assets/1ba65ac8-b891-4782-8ec8-fa4c5c07c1d7" />


### Optimization Recommendations

AI-assisted recommendations show the target resource, reason, confidence, and estimated monthly cost impact before an action is reviewed.

<img width="1917" height="937" alt="Screenshot 2026-09-20 161319" src="https://github.com/user-attachments/assets/019b0cc3-9035-47c9-8053-714c7dd68ba0" />


### Scaling Preview

A dry-run view shows the projected cost, budget utilization, and automated policy checks before scaling.

<img width="1860" height="935" alt="Screenshot 2026-09-20 161253" src="https://github.com/user-attachments/assets/70693ca9-4ead-4e05-ac9f-b345825d254c" />


### Approval Queue

High-impact actions can be routed to authorized users for governance review before execution.

<img width="1906" height="932" alt="Screenshot 2026-09-20 161334" src="https://github.com/user-attachments/assets/f3249e86-e439-4d43-90dd-b01647e99922" />


---

## 5. Architecture

<img width="1536" height="1024" alt="WhatsApp Image 2026-09-19 at 11 17 16 AM" src="https://github.com/user-attachments/assets/2864ef67-03c6-4180-ad6e-4496cc69ee17" />

---

## 6. Technology Stack

| Layer | Technologies |
|---|---|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS |
| Backend | Python, FastAPI, SQLAlchemy |
| Database | PostgreSQL 16 |
| Communication | REST APIs, WebSockets |
| Development | Docker, Docker Compose |
| Testing / Mocking | MSW, Fake WebSocket Mocks |
| Cloud Providers | AWS, Microsoft Azure, Google Cloud Platform |

---

## 7. Governance & Safety

Before a governed infrastructure action proceeds, CloudOps can evaluate:

```text
User Permission
      +
Policy Rules
      +
Safety Limits
      +
Budget Limits
      +
Approval Requirements
      ↓
Execution Decision
```

For example, a scaling request can show its **monthly cost delta and projected spend** before execution.

The platform can validate:

- User permissions
- Policy rules
- Budget limits
- Safety limits
- Required approvals
- Expected cost impact

If the configured threshold requires approval, the action is routed to the appropriate Manager or Admin workflow.

This creates a controlled path from **AI recommendation to infrastructure execution**.

---

## 8. Role-Based Access

CloudOps supports different operational responsibilities through role-based access control.

| Role | Responsibility |
|---|---|
| **ADMIN** | Platform administration and governance |
| **MANAGER** | Review and approval of governed actions |
| **DEVOPS** | Infrastructure operations |
| **VIEWER** | Read-oriented access |

---

## 9. Example Use Case

### Traffic Spike on `checkout-api`

1. Monitoring detects increased traffic.
2. CloudOps identifies a potential scaling requirement.
3. The recommendation engine proposes a scaling action.
4. The expected monthly cost impact is displayed.
5. Policy, budget, permission, and safety checks are performed.
6. If required, the action enters the approval queue.
7. An authorized user reviews the request.
8. After approval, the scaling action can be dispatched for execution.
9. Execution status and audit information can be tracked.

This connects **infrastructure optimization, cost awareness, and governance** in a single workflow.

---

## 10. Project Structure

```text
CloudOps/
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── features/
│   │   │   ├── dashboard/
│   │   │   ├── monitoring/
│   │   │   ├── resources/
│   │   │   ├── costs/
│   │   │   ├── recommendations/
│   │   │   ├── approvals/
│   │   │   ├── policies/
│   │   │   ├── accounts/
│   │   │   ├── alerts/
│   │   │   ├── notifications/
│   │   │   ├── audit/
│   │   │   ├── users/
│   │   │   └── ai/
│   │   └── mocks/
│   └── ...
├── backend/
├── docs/
│   └── screenshots/
└── ...
```

---

## 11. Getting Started

### Prerequisites

- Node.js
- npm
- Python
- PostgreSQL 16
- Docker
- Docker Compose

### Frontend

```bash
cd frontend
npm install
npm run dev
```

For a production build:

```bash
npm run build
```

### Docker

```bash
docker compose up --build
```

Use the environment variables and service configuration defined in the project repository before running the complete stack.

---

## 12. Project Status

The CloudOps frontend demonstrates the major control-plane workflows:

- Dashboard
- Multi-cloud monitoring
- Resource management
- Cost analytics
- AI recommendations
- Scaling preview
- Approval workflows
- Alert management
- Policies and budgets
- Cloud account connections
- Notifications
- Audit logs
- User and RBAC management

The complete system follows the project's defined frontend, backend/integration, data/intelligence, database, and cloud-adapter architecture.

---

## 13. Team Contributions

| Team Member | Contribution |
|---|---|
| **Megh Pujara** | Backend & API |
| **Tanish Solanki** | Frontend |
| **Pradhyuman Jadav** | Database |
| **Riya Singh** | Testing & Integration|

---

## 14. Project Highlights

### Infrastructure Operations

Unified visibility and management across multiple cloud providers.

### Cost Intelligence

Understand current spending and the financial impact of proposed infrastructure actions.

### Governance

Validate policies, budgets, permissions, safety limits, and approval requirements before governed actions proceed.

### Core Value

**One control plane. Multiple clouds. Cost-aware automation with governance.**

---

## License

Developed for educational, hackathon, and demonstration purposes.
