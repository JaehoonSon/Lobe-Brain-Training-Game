# Notification System Architecture

## Overview

The system operates in two distinct phases: **Scheduling** (Daily) and **Delivery** (Frequent). We utilize Supabase's internal database tools (`pg_cron`, `plpgsql`, `pgmq`) for the heavy lifting of logic and state, and use Edge Functions solely for the external HTTP requests to Expo.

---

## Phase 1: Scheduling (Daily)

Every day at **00:00 UTC**, the database wakes up to plan notifications for the next 24 hours.

```mermaid
graph LR
    %% Styles
    classDef db fill:#336791,stroke:#fff,stroke-width:2px,color:#fff;
    classDef logic fill:#e1e1e1,stroke:#333,stroke-width:1px;

    Cron("pg_cron: Daily"):::db -->|Triggers| SQL("Function: schedule_daily_notifications"):::db

    subgraph Execution ["In-Database Logic"]
        direction TB
        SQL -->|"1. Find Active Users"| Users[("Profiles")]:::db
        SQL -->|"2. Calc 6 PM (Local Time)"| Calc("Timezone Math"):::logic
        Calc -->|"3. Enqueue with Delay"| Queue[("PGMQ: 'notifications'")]:::db
    end
```

**Key Process:**

1.  **Trigger**: `pg_cron` runs `schedule_daily_notifications()` via SQL.
2.  **Logic**: Iterates through active users.
3.  **Calculation**: `Target Time = User's Next 6 PM`.
4.  **Storage**: Inserts a job into `pgmq` with `delay = Target Time - Now`. The job sits invisibly in the queue.

---

## Phase 2: Delivery (Every Minute)

The system checks frequently for messages that have "woken up" (i.e., their delay period has passed).

```mermaid
graph LR
    %% Styles
    classDef db fill:#336791,stroke:#fff,stroke-width:2px,color:#fff;
    classDef edge fill:#3ECF8E,stroke:#fff,stroke-width:2px,color:#fff;
    classDef ext fill:#fff,stroke:#333,stroke-width:1px,stroke-dasharray: 5 5;

    Cron("pg_cron: Minutely"):::db -->|Check w/ LIMIT 1| Check{{"Messages Ready?"}}:::db

    Check -- No --> Stop("Do Nothing"):::logic
    Check -- Yes --> Invoke("net.http_post"):::db

    Invoke -->|Triggers| Edge("Edge Function: send-notification"):::edge

    subgraph Delivery ["Edge Function Execution"]
        Edge -->|"1. Pop Batch"| Queue[("PGMQ")]:::db
        Edge -->|"2. POST"| Expo("Expo Push API"):::ext
    end

    Expo --> Device("User Device"):::ext
```

**Key Process:**

1.  **Optimization**: `pg_cron` runs a lightweight `EXISTS` query first.
2.  **Trigger**: Only if messages are ready (`vt <= now()`), it calls the Edge Function.
3.  **Action**: The Edge Function pops a batch of messages and sends them to Expo.
