# Email Logs Table Schema

## Table: `email_logs`

This table stores all email communication history for orders, tracking both customer and admin notifications.

### Columns

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `uuid` | PRIMARY KEY, DEFAULT `gen_random_uuid()` | Unique identifier |
| `order_id` | `uuid` | NULL, REFERENCES `orders(id)` ON DELETE SET NULL | Associated order |
| `recipient` | `text` | NOT NULL | Email recipient address |
| `subject` | `text` | NOT NULL | Email subject line |
| `type` | `text` | NOT NULL | Email type: 'customer_confirmation', 'admin_notification' |
| `status` | `text` | NOT NULL | Send status: 'sent', 'failed' |
| `error_message` | `text` | NULL | Error details if status is 'failed' |
| `resend_id` | `text` | NULL | Resend email ID for tracking |
| `sent_at` | `timestamptz` | DEFAULT `now()` | Timestamp when email was sent/attempted |
| `created_at` | `timestamptz` | DEFAULT `now()` | Record creation timestamp |

### Indexes

```sql
CREATE INDEX idx_email_logs_order_id ON email_logs(order_id);
CREATE INDEX idx_email_logs_type ON email_logs(type);
CREATE INDEX idx_email_logs_status ON email_logs(status);
CREATE INDEX idx_email_logs_sent_at ON email_logs(sent_at DESC);
```

### Example SQL Migration

```sql
CREATE TABLE email_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE SET NULL,
  recipient text NOT NULL,
  subject text NOT NULL,
  type text NOT NULL,
  status text NOT NULL,
  error_message text,
  resend_id text,
  sent_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_email_logs_order_id ON email_logs(order_id);
CREATE INDEX idx_email_logs_type ON email_logs(type);
CREATE INDEX idx_email_logs_status ON email_logs(status);
CREATE INDEX idx_email_logs_sent_at ON email_logs(sent_at DESC);
```

### Email Types

- **customer_confirmation**: Sent to customer after successful payment (legacy)
- **admin_notification**: Sent to admin when new order is placed
- **rental_confirmation**: Professional rental confirmation email (RentalConfirmation.tsx)

### Email Status

- **sent**: Email successfully sent via Resend
- **failed**: Email sending failed (check error_message)

### Usage

Emails are triggered in the Stripe webhook (`/api/stripe-webhook`) after `checkout.session.completed` event.
Each email attempt is logged regardless of success/failure for audit trail.
