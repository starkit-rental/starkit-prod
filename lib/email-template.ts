/**
 * Unified Starkit Email Template System
 *
 * All emails share a consistent branded wrapper:
 * - White container on gray background
 * - Starkit logo header with gold accent
 * - Professional footer with contact info
 * - Fully responsive (mobile-friendly)
 */

const BRAND = {
  name: "Starkit",
  email: "wynajem@starkit.pl",
  website: "https://www.starkit.pl",
  gold: "#D4A843",
  dark: "#1a1a2e",
  gray: "#64748b",
  lightGray: "#f1f5f9",
  white: "#ffffff",
  font: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

// ═══════════════════════════════════════════════════════════
//  UNIVERSAL WRAPPER
// ═══════════════════════════════════════════════════════════

/**
 * Wraps any HTML content in the Starkit branded email template.
 * Use for ALL outgoing emails (automated + manual).
 */
export function withStarkitTemplate(bodyContent: string, previewText?: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.starkit.pl";

  return `<!DOCTYPE html>
<html lang="pl">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<meta http-equiv="X-UA-Compatible" content="IE=edge"/>
<title>Starkit</title>
${previewText ? `<div style="display:none;max-height:0;overflow:hidden">${previewText}</div>` : ""}
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:${BRAND.font};-webkit-font-smoothing:antialiased;mso-line-height-rule:exactly">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9">
<tr><td align="center" style="padding:32px 16px">

<!-- Container -->
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:${BRAND.white};border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08)">

<!-- Gold accent bar -->
<tr><td style="height:4px;background:linear-gradient(90deg,${BRAND.gold},#e8c65a,${BRAND.gold})"></td></tr>

<!-- Logo -->
<tr><td align="center" style="padding:32px 40px 16px">
  <a href="${baseUrl}" style="text-decoration:none">
    <!--[if mso]><img src="${baseUrl}/logo.png" width="150" height="50" alt="Starkit" style="display:block;border:0"/><![endif]-->
    <!--[if !mso]><!--><img src="${baseUrl}/logo.png" width="150" alt="Starkit" style="display:block;border:0;width:150px;max-width:150px;height:auto"/><!--<![endif]-->
  </a>
</td></tr>

<!-- Body content -->
<tr><td style="padding:0 40px 32px">
${bodyContent}
</td></tr>

<!-- Footer -->
<tr><td style="border-top:1px solid #e2e8f0;padding:24px 40px;background-color:#fafbfc">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
  <tr><td align="center">
    <p style="margin:0 0 8px;font-size:13px;color:${BRAND.gray};line-height:1.5">
      <strong style="color:${BRAND.dark}">Starkit</strong> — wynajem Starlink Mini
    </p>
    <p style="margin:0 0 4px;font-size:12px;color:${BRAND.gray};line-height:1.5">
      <a href="mailto:${BRAND.email}" style="color:${BRAND.dark};text-decoration:underline">${BRAND.email}</a>
      &nbsp;·&nbsp;
      <a href="${BRAND.website}" style="color:${BRAND.dark};text-decoration:underline">www.starkit.pl</a>
    </p>
    <p style="margin:8px 0 0;font-size:11px;color:#94a3b8;line-height:1.4">
      Ta wiadomość została wygenerowana automatycznie. Możesz odpowiedzieć na tego maila.
    </p>
  </td></tr>
  </table>
</td></tr>

</table>
<!-- /Container -->

</td></tr>
</table>
</body>
</html>`;
}

// ═══════════════════════════════════════════════════════════
//  SHARED HTML HELPERS
// ═══════════════════════════════════════════════════════════

function heading(text: string, emoji?: string): string {
  return `<h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:${BRAND.dark};line-height:1.3;text-align:center">${emoji ? `${emoji} ` : ""}${text}</h1>`;
}

function subtitle(text: string): string {
  return `<p style="margin:0 0 24px;font-size:15px;color:${BRAND.gray};text-align:center">${text}</p>`;
}

function paragraph(text: string): string {
  return `<p style="margin:0 0 16px;font-size:15px;color:#334155;line-height:1.65">${text}</p>`;
}

function infoBox(title: string, rows: [string, string][]): string {
  const rowsHtml = rows
    .map(
      ([label, value]) =>
        `<tr>
          <td style="padding:8px 0;font-size:14px;color:${BRAND.gray};width:45%;vertical-align:top">${label}</td>
          <td style="padding:8px 0;font-size:14px;color:${BRAND.dark};font-weight:600">${value}</td>
        </tr>`
    )
    .join("");

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;margin:20px 0">
    <tr><td style="padding:20px 24px">
      <p style="margin:0 0 14px;font-size:15px;font-weight:600;color:${BRAND.dark}">${title}</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rowsHtml}</table>
    </td></tr>
  </table>`;
}

function alertBox(text: string, variant: "info" | "warning" | "success" | "blue" = "info"): string {
  const styles: Record<string, { bg: string; border: string; color: string }> = {
    info: { bg: "#fffbeb", border: "#fbbf24", color: "#92400e" },
    warning: { bg: "#fff7ed", border: "#f97316", color: "#9a3412" },
    success: { bg: "#f0fdf4", border: "#22c55e", color: "#166534" },
    blue: { bg: "#eff6ff", border: "#3b82f6", color: "#1e40af" },
  };
  const s = styles[variant];
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0">
    <tr><td style="background-color:${s.bg};border:1px solid ${s.border};border-left:4px solid ${s.border};border-radius:8px;padding:16px 20px">
      <p style="margin:0;font-size:14px;line-height:1.6;color:${s.color}">${text}</p>
    </td></tr>
  </table>`;
}

function signOff(): string {
  return `<p style="margin:24px 0 0;font-size:15px;color:#334155;line-height:1.65">Pozdrawiamy,<br/><strong>Zespół Starkit</strong></p>`;
}

function ctaButton(text: string, href: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px auto" align="center">
    <tr><td style="background-color:${BRAND.dark};border-radius:8px">
      <a href="${href}" style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;font-family:${BRAND.font}">${text}</a>
    </td></tr>
  </table>`;
}

// ═══════════════════════════════════════════════════════════
//  INDIVIDUAL EMAIL CONTENT BUILDERS
// ═══════════════════════════════════════════════════════════

export interface OrderVars {
  customer_name: string;
  order_number: string;
  start_date: string;
  end_date: string;
  total_amount: string;
  rental_price?: string;
  deposit?: string;
  rental_days?: string;
  inpost_point_id?: string;
  inpost_point_address?: string;
  customer_email?: string;
  customer_phone?: string;
  company_name?: string;
  nip?: string;
  order_url?: string;
}

/** 1. Order Received — tuż po płatności */
export function buildOrderReceivedHtml(v: OrderVars): string {
  const content = [
    heading("Otrzymaliśmy Twoją rezerwację!", "📡"),
    subtitle(`Dziękujemy za zaufanie, ${v.customer_name}`),
    paragraph(`Twoja rezerwacja <strong>${v.order_number}</strong> została zarejestrowana w naszym systemie.`),
    paragraph(`<strong>Co dalej?</strong> Nasz zespół weryfikuje dostępność sprzętu na wybrane przez Ciebie daty. W ciągu najbliższych godzin otrzymasz kolejną wiadomość z potwierdzeniem wynajmu oraz szczegółami dotyczącymi odbioru i zwrotu.`),
    infoBox("📋 Podsumowanie rezerwacji", [
      ["Numer zamówienia:", v.order_number],
      ["Okres wynajmu:", `${v.start_date} – ${v.end_date}`],
      ["Łączna kwota:", v.total_amount],
    ]),
    alertBox(`💡 <strong>Ważne:</strong> Płatność została zaksięgowana. Kaucja zwrotna zostanie zwrócona na Twoje konto w ciągu 48h od zwrotu sprzętu w nienaruszonym stanie.`, "info"),
    paragraph(`Jeśli masz pytania, śmiało odpowiedz na tego maila lub napisz na <a href="mailto:wynajem@starkit.pl" style="color:${BRAND.dark}">wynajem@starkit.pl</a>.`),
    signOff(),
  ].join("\n");
  return withStarkitTemplate(content, `Otrzymaliśmy Twoją rezerwację ${v.order_number}`);
}

/** 2. Order Confirmed — po zmianie statusu na reserved, z PDF */
export function buildOrderConfirmedHtml(v: OrderVars): string {
  const content = [
    heading("Rezerwacja potwierdzona!", "🎉"),
    subtitle(`Wszystko gotowe, ${v.customer_name}`),
    paragraph(`Twoja rezerwacja <strong>${v.order_number}</strong> została oficjalnie potwierdzona. Sprzęt Starlink Mini jest zarezerwowany i czeka na Ciebie.`),
    infoBox("📋 Szczegóły wynajmu", [
      ["Numer zamówienia:", v.order_number],
      ["Okres wynajmu:", `${v.start_date} – ${v.end_date}`],
      ...(v.rental_days ? [["Liczba dni:", `${v.rental_days} dni`] as [string, string]] : []),
    ]),
    v.inpost_point_id
      ? infoBox("📦 Punkt odbioru i zwrotu", [
          ["Paczkomat InPost:", v.inpost_point_id],
          ...(v.inpost_point_address ? [["Adres:", v.inpost_point_address] as [string, string]] : []),
        ])
      : "",
    v.rental_price && v.deposit
      ? infoBox("💰 Podsumowanie finansowe", [
          ["Opłata za najem:", `${v.rental_price}`],
          ["Kaucja zwrotna:", `${v.deposit}`],
          ["Łącznie zapłacono:", `<strong>${v.total_amount}</strong>`],
        ])
      : "",
    alertBox(`📄 <strong>Umowa najmu:</strong> W załączniku znajdziesz umowę najmu w formacie PDF. Prosimy o zapoznanie się z regulaminem przed odbiorem sprzętu.`, "blue"),
    alertBox(`💳 <strong>Zwrot kaucji:</strong> Kaucja zostanie automatycznie zwrócona na Twoje konto w ciągu 48h od zwrotu i weryfikacji sprzętu.`, "info"),
    paragraph(`<strong>Co dalej?</strong>`),
    `<ul style="margin:0 0 16px;padding-left:20px;color:#334155;font-size:15px;line-height:1.8">
      <li>Przygotuj dokument tożsamości na wypadek weryfikacji</li>
      <li>Sprzęt odbierzesz w dniu <strong>${v.start_date}</strong></li>
      <li>Zwrot do końca dnia <strong>${v.end_date}</strong></li>
      <li>Kod odbioru otrzymasz SMS-em od InPost</li>
    </ul>`,
    paragraph(`Dziękujemy za wybór Starkit i życzymy udanego wynajmu!`),
    signOff(),
  ].join("\n");
  return withStarkitTemplate(content, `Potwierdzenie rezerwacji ${v.order_number}`);
}

/** 3. Order Picked Up — sprzęt wysłany */
export function buildOrderPickedUpHtml(v: OrderVars): string {
  const content = [
    heading("Sprzęt w drodze!", "🚀"),
    subtitle(`Twój Starlink Mini jedzie do Ciebie, ${v.customer_name}`),
    paragraph(`Zamówienie <strong>${v.order_number}</strong> zostało właśnie wysłane! Sprzęt Starlink Mini jest w drodze do wybranego przez Ciebie paczkomatu InPost.`),
    alertBox(`📦 Otrzymasz osobne powiadomienie SMS od InPost, gdy paczka będzie gotowa do odbioru.`, "blue"),
    infoBox("📋 Przypomnienie", [
      ["Numer zamówienia:", v.order_number],
      ["Okres wynajmu:", `${v.start_date} – ${v.end_date}`],
    ]),
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;margin:20px 0">
      <tr><td style="padding:20px 24px">
        <p style="margin:0 0 14px;font-size:15px;font-weight:600;color:${BRAND.dark}">📡 Instrukcja uruchomienia Starlink Mini</p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding:10px 0;font-size:14px;color:#334155;line-height:1.5;border-bottom:1px solid #e2e8f0">
              <strong style="color:${BRAND.gold}">1.</strong>&nbsp; Rozpakuj zestaw i sprawdź kompletność (antena, router, kabel, zasilacz)
            </td>
          </tr>
          <tr>
            <td style="padding:10px 0;font-size:14px;color:#334155;line-height:1.5;border-bottom:1px solid #e2e8f0">
              <strong style="color:${BRAND.gold}">2.</strong>&nbsp; Postaw antenę na zewnątrz z widokiem na otwarte niebo
            </td>
          </tr>
          <tr>
            <td style="padding:10px 0;font-size:14px;color:#334155;line-height:1.5;border-bottom:1px solid #e2e8f0">
              <strong style="color:${BRAND.gold}">3.</strong>&nbsp; Podłącz zasilanie i poczekaj 2–5 minut na połączenie z satelitami
            </td>
          </tr>
          <tr>
            <td style="padding:10px 0;font-size:14px;color:#334155;line-height:1.5">
              <strong style="color:${BRAND.gold}">4.</strong>&nbsp; Połącz się z siecią WiFi <strong>"STARLINK"</strong> — hasło znajdziesz na karcie w zestawie
            </td>
          </tr>
        </table>
      </td></tr>
    </table>`,
    alertBox(`💡 <strong>Wskazówka:</strong> Najlepsza jakość sygnału jest przy otwartym widoku na niebo, bez przeszkód (drzew, budynków). Antena automatycznie ustawi się w optymalnym kierunku.`, "info"),
    paragraph(`W razie pytań pisz na <a href="mailto:wynajem@starkit.pl" style="color:${BRAND.dark}">wynajem@starkit.pl</a> — odpowiadamy szybko!`),
    signOff(),
  ].join("\n");
  return withStarkitTemplate(content, `Sprzęt w drodze! Instrukcja obsługi ${v.order_number}`);
}

/** 4. Order Returned — potwierdzenie zwrotu */
export function buildOrderReturnedHtml(v: OrderVars): string {
  const content = [
    heading("Dziękujemy za zwrot!", "✅"),
    subtitle(`Sprzęt wrócił do nas, ${v.customer_name}`),
    paragraph(`Potwierdzamy odbiór zwróconego zestawu Starlink Mini z zamówienia <strong>${v.order_number}</strong>.`),
    infoBox("📋 Podsumowanie", [
      ["Numer zamówienia:", v.order_number],
      ["Okres wynajmu:", `${v.start_date} – ${v.end_date}`],
      ...(v.total_amount ? [["Łączna kwota:", v.total_amount] as [string, string]] : []),
    ]),
    alertBox(`💳 <strong>Rozliczenie kaucji:</strong> Nasz zespół sprawdzi kompletność i stan sprzętu. Jeśli wszystko będzie w porządku, kaucja zostanie zwrócona na Twoje konto w ciągu <strong>48 godzin</strong>.`, "success"),
    paragraph(`Dziękujemy za skorzystanie z usług Starkit! Mamy nadzieję, że internet Starlink spełnił Twoje oczekiwania.`),
    paragraph(`Jeśli będziesz potrzebować internetu satelitarnego w przyszłości — jesteśmy do dyspozycji! 🛰️`),
    paragraph(`Będziemy wdzięczni za Twoją opinię — pomaga nam to stawać się lepszymi. Odpowiedz na tego maila i powiedz, jak Ci się korzystało!`),
    signOff(),
  ].join("\n");
  return withStarkitTemplate(content, `Potwierdzenie zwrotu sprzętu ${v.order_number}`);
}

/** 5. Order Cancelled — anulowanie */
export function buildOrderCancelledHtml(v: OrderVars): string {
  const content = [
    heading("Zamówienie anulowane", "ℹ️"),
    subtitle(`Informacja o zamówieniu ${v.order_number}`),
    paragraph(`Cześć ${v.customer_name},`),
    paragraph(`Informujemy, że Twoje zamówienie <strong>${v.order_number}</strong> zostało anulowane.`),
    infoBox("📋 Szczegóły anulowanego zamówienia", [
      ["Numer zamówienia:", v.order_number],
      ["Planowany okres:", `${v.start_date} – ${v.end_date}`],
      ...(v.total_amount ? [["Kwota:", v.total_amount] as [string, string]] : []),
    ]),
    alertBox(`💳 <strong>Zwrot środków:</strong> Jeśli dokonałeś płatności, zwrot nastąpi automatycznie w ciągu <strong>5–10 dni roboczych</strong> na kartę, którą dokonano płatności.`, "warning"),
    paragraph(`Jeśli masz pytania dotyczące anulowania lub chcesz złożyć nowe zamówienie, skontaktuj się z nami: <a href="mailto:wynajem@starkit.pl" style="color:${BRAND.dark}">wynajem@starkit.pl</a>`),
    signOff(),
  ].join("\n");
  return withStarkitTemplate(content, `Informacja o anulowaniu zamówienia ${v.order_number}`);
}

/** 6. General Purpose — szablon z dynamiczną treścią */
export function buildGeneralPurposeHtml(v: OrderVars & { custom_content?: string }): string {
  const bodyHtml = v.custom_content
    ? `<div style="font-family:${BRAND.font};font-size:15px;color:#334155;line-height:1.65;white-space:pre-wrap">${v.custom_content}</div>`
    : paragraph("(Brak treści)");

  const content = [
    paragraph(`Cześć ${v.customer_name},`),
    bodyHtml,
    signOff(),
  ].join("\n");
  return withStarkitTemplate(content);
}

/** 7. Admin Notification — powiadomienie dla admina */
export function buildAdminNotificationHtml(v: OrderVars): string {
  const orderUrl = v.order_url || `${process.env.NEXT_PUBLIC_SITE_URL || "https://www.starkit.pl"}/office/orders/${v.order_number}`;

  const clientRows: [string, string][] = [
    ["Imię i nazwisko:", v.customer_name],
    ...(v.customer_email ? [["Email:", v.customer_email] as [string, string]] : []),
    ...(v.customer_phone ? [["Telefon:", v.customer_phone] as [string, string]] : []),
    ...(v.company_name ? [["Firma:", `${v.company_name}${v.nip ? ` (NIP: ${v.nip})` : ""}`] as [string, string]] : []),
  ];

  const content = [
    heading("Nowe zamówienie!", "💸"),
    subtitle(`Zamówienie ${v.order_number} od ${v.customer_name}`),
    infoBox("👤 Klient", clientRows),
    infoBox("📦 Logistyka", [
      ["Termin:", `${v.start_date} – ${v.end_date}`],
      ...(v.inpost_point_id ? [["Paczkomat:", v.inpost_point_id] as [string, string]] : []),
      ...(v.inpost_point_address ? [["Adres:", v.inpost_point_address] as [string, string]] : []),
    ]),
    infoBox("💰 Wartość", [
      ...(v.rental_price ? [["Najem:", v.rental_price] as [string, string]] : []),
      ...(v.deposit ? [["Kaucja:", v.deposit] as [string, string]] : []),
      ["Łącznie:", `<strong>${v.total_amount}</strong>`],
    ]),
    ctaButton("Otwórz w Starkit Office", orderUrl),
  ].join("\n");
  return withStarkitTemplate(content, `Nowe zamówienie ${v.order_number} od ${v.customer_name}`);
}

// ═══════════════════════════════════════════════════════════
//  PREVIEW GENERATOR (for admin panel)
// ═══════════════════════════════════════════════════════════

export type EmailTemplateType =
  | "order_received"
  | "order_confirmed"
  | "order_picked_up"
  | "order_returned"
  | "order_cancelled"
  | "admin_notification"
  | "general";

const BUILDERS: Record<EmailTemplateType, (v: OrderVars & { custom_content?: string }) => string> = {
  order_received: buildOrderReceivedHtml,
  order_confirmed: buildOrderConfirmedHtml,
  order_picked_up: buildOrderPickedUpHtml,
  order_returned: buildOrderReturnedHtml,
  order_cancelled: buildOrderCancelledHtml,
  admin_notification: buildAdminNotificationHtml,
  general: buildGeneralPurposeHtml,
};

export const EMAIL_SUBJECTS: Record<EmailTemplateType, string> = {
  order_received: "Otrzymaliśmy Twoją rezerwację Starlink Mini — SK-{{id}}",
  order_confirmed: "Potwierdzenie rezerwacji SK-{{id}}",
  order_picked_up: "Sprzęt w drodze! Instrukcja obsługi SK-{{id}}",
  order_returned: "Potwierdzenie zwrotu sprzętu SK-{{id}}",
  order_cancelled: "Informacja o anulowaniu zamówienia SK-{{id}}",
  admin_notification: "Nowe zamówienie SK-{{id}} od {{name}} 💸",
  general: "Wiadomość od Starkit — SK-{{id}}",
};

/**
 * Generate a preview of any email template filled with real order data.
 * Returns { subject, html }.
 */
export function generateEmailPreview(
  type: EmailTemplateType,
  vars: OrderVars
): { subject: string; html: string } {
  const builder = BUILDERS[type];
  const html = builder(vars);
  const subjectTemplate = EMAIL_SUBJECTS[type];
  const subject = subjectTemplate
    .replace("{{id}}", vars.order_number)
    .replace("{{name}}", vars.customer_name);
  return { subject, html };
}
