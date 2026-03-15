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

export function renderAlertBox(text: string, variant: "info" | "warning" | "success" | "blue" = "info"): string {
  return alertBox(text, variant);
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

export function renderCtaButton(text: string, href: string): string {
  return ctaButton(text, href);
}

function ctaButton(text: string, href: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px auto" align="center">
    <tr><td style="background-color:${BRAND.dark};border-radius:8px">
      <a href="${href}" style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;font-family:${BRAND.font}">${text}</a>
    </td></tr>
  </table>`;
}

// ═══════════════════════════════════════════════════════════
//  KOZAK UX COMPONENTS — Rich email blocks
// ═══════════════════════════════════════════════════════════

/**
 * {{summary_box}} — Order summary with number, dates, amount.
 * Used in: Order Received
 */
export function renderSummaryBox(vars: Record<string, string>): string {
  const rows: [string, string][] = [
    ["Numer zamówienia:", vars.order_number || "—"],
    ["Okres wynajmu:", `${vars.start_date || "—"} – ${vars.end_date || "—"}`],
    ["Łączna kwota:", vars.total_amount || "—"],
  ];
  return infoBox("📋 Podsumowanie zamówienia", rows);
}

/**
 * {{reservation_details_box}} — Full reservation details with days + InPost.
 * Used in: Order Confirmed
 */
export function renderReservationDetailsBox(vars: Record<string, string>): string {
  const rows: [string, string][] = [
    ["Numer zamówienia:", `<strong>${vars.order_number || "—"}</strong>`],
    ["Okres wynajmu:", `${vars.start_date || "—"} – ${vars.end_date || "—"}`],
  ];
  if (vars.rental_days) rows.push(["Liczba dni:", `${vars.rental_days} dni`]);
  const isPickup = vars.delivery_method === "personal_pickup";
  if (isPickup) {
    rows.push(["Dostawa:", "<strong>Odbiór osobisty</strong>"]);
    rows.push(["Adres odbioru:", "Poznań, ul. Cumownicza"]);
  } else if (vars.inpost_point_id) {
    rows.push(["Dostawa:", "Paczkomat InPost"]);
    rows.push(["Paczkomat:", vars.inpost_point_id]);
    if (vars.inpost_point_address) rows.push(["Adres paczkomatu:", vars.inpost_point_address]);
  }
  return infoBox("📋 Szczegóły rezerwacji", rows);
}

/**
 * {{financial_box}} — Price breakdown with deposit highlight.
 * Used in: Order Confirmed
 */
export function renderFinancialBox(vars: Record<string, string>): string {
  const rows: [string, string][] = [];
  if (vars.rental_price) rows.push(["Opłata za najem:", vars.rental_price]);
  if (vars.deposit) rows.push(["Kaucja zwrotna:", vars.deposit]);
  rows.push(["Łącznie:", `<strong style="font-size:16px;color:${BRAND.dark}">${vars.total_amount || "—"}</strong>`]);

  const box = infoBox("💰 Podsumowanie finansowe", rows);
  const depositNote = vars.deposit
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:-8px 0 20px 0">
        <tr><td style="background-color:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:14px 20px">
          <p style="margin:0;font-size:13px;line-height:1.6;color:#166534">💳 <strong>Zwrot kaucji:</strong> Kaucja w wysokości ${vars.deposit} zostanie zwrócona na Twoje konto po zwrocie i weryfikacji sprzętu. Sprzęt musi być kompletny i nieuszkodzony.</p>
        </td></tr>
      </table>`
    : "";
  return box + depositNote;
}

/**
 * {{pdf_box}} — Attachment notice for the PDF contract.
 * Used in: Order Confirmed
 */
export function renderPdfBox(): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0">
    <tr><td style="background-color:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;padding:18px 24px">
      <table role="presentation" cellpadding="0" cellspacing="0">
        <tr>
          <td style="vertical-align:top;padding-right:14px">
            <span style="font-size:28px;line-height:1">📄</span>
          </td>
          <td>
            <p style="margin:0 0 4px;font-size:15px;font-weight:700;color:#1e40af">Umowa Najmu w załączniku</p>
            <p style="margin:0;font-size:13px;color:#3b82f6;line-height:1.5">Umowa Najmu jest dołączona do tego maila w formacie PDF. Prosimy o zapoznanie się z regulaminem przed odbiorem sprzętu.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>`;
}

/**
 * {{pickup_box}} — InPost point details with map-style blue card.
 * Used in: Order Picked Up (InPost)
 */
export function renderPickupBox(vars: Record<string, string>): string {
  const pointId = vars.inpost_point_id || "—";
  const pointAddr = vars.inpost_point_address || "";
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0">
    <tr><td style="background-color:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;padding:20px 24px">
      <table role="presentation" cellpadding="0" cellspacing="0">
        <tr>
          <td style="vertical-align:top;padding-right:14px">
            <span style="font-size:28px;line-height:1">📦</span>
          </td>
          <td>
            <p style="margin:0 0 6px;font-size:15px;font-weight:700;color:#1e40af">Punkt odbioru InPost</p>
            <p style="margin:0 0 2px;font-size:16px;font-weight:700;color:${BRAND.dark}">${pointId}</p>
            ${pointAddr ? `<p style="margin:0;font-size:13px;color:#3b82f6;line-height:1.4">${pointAddr}</p>` : ""}
            <p style="margin:10px 0 0;font-size:12px;color:#64748b;line-height:1.5">Otrzymasz osobne powiadomienie SMS od InPost z kodem odbioru.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>`;
}

/**
 * renderPersonalPickedUpBox — personal pickup dispatched box.
 * Used in: Order Picked Up (personal_pickup)
 */
export function renderPersonalPickedUpBox(): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0">
    <tr><td style="background-color:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;padding:20px 24px">
      <table role="presentation" cellpadding="0" cellspacing="0">
        <tr>
          <td style="vertical-align:top;padding-right:14px">
            <span style="font-size:28px;line-height:1">🏪</span>
          </td>
          <td>
            <p style="margin:0 0 6px;font-size:15px;font-weight:700;color:#1e40af">Odbiór osobisty</p>
            <p style="margin:0 0 4px;font-size:16px;font-weight:700;color:#1a1a2e">Poznań, ul. Cumownicza</p>
            <p style="margin:8px 0 0;font-size:13px;color:#64748b;line-height:1.5">Prosimy zadzwonić przed odbiorem: <strong>+48 453 461 061</strong></p>
            <p style="margin:4px 0 0;font-size:12px;color:#64748b;line-height:1.5">Prosimy zabrać dowód tożsamości.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>`;
}

/**
 * {{instructions_box}} — Step-by-step Starlink setup instructions.
 * Used in: Order Picked Up
 */
export function renderInstructionsBox(): string {
  const steps = [
    { num: "1", text: "Rozpakuj zestaw i sprawdź kompletność <em>(antena, router, kabel, zasilacz)</em>" },
    { num: "2", text: "Postaw antenę na zewnątrz z widokiem na <strong>otwarte niebo</strong> — bez drzew i budynków" },
    { num: "3", text: "Podłącz zasilanie i poczekaj <strong>2–5 minut</strong> na połączenie z satelitami" },
    { num: "4", text: 'Połącz się z siecią WiFi <strong>"STARLINK"</strong> — hasło znajdziesz na karcie w zestawie' },
    { num: "5", text: "Gotowe! Korzystaj z internetu satelitarnego 🛰️" },
  ];

  const stepsHtml = steps.map((s, i) => {
    const border = i < steps.length - 1 ? `border-bottom:1px solid #e2e8f0;` : "";
    return `<tr>
      <td style="padding:12px 0;${border}">
        <table role="presentation" cellpadding="0" cellspacing="0"><tr>
          <td style="vertical-align:top;padding-right:14px">
            <span style="display:inline-block;width:28px;height:28px;line-height:28px;text-align:center;border-radius:50%;background-color:${BRAND.gold};color:#fff;font-size:13px;font-weight:700">${s.num}</span>
          </td>
          <td style="font-size:14px;color:#334155;line-height:1.55">${s.text}</td>
        </tr></table>
      </td>
    </tr>`;
  }).join("");

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;margin:20px 0">
    <tr><td style="padding:20px 24px">
      <p style="margin:0 0 16px;font-size:15px;font-weight:700;color:${BRAND.dark}">📡 Instrukcja uruchomienia Starlink Mini</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        ${stepsHtml}
      </table>
    </td></tr>
  </table>`;
}

// ═══════════════════════════════════════════════════════════
//  INDIVIDUAL EMAIL CONTENT BUILDERS
// ═══════════════════════════════════════════════════════════

export interface OrderVars {
  customer_name: string;
  customer_address?: string;
  order_number: string;
  start_date: string;
  end_date: string;
  total_amount: string;
  rental_price?: string;
  deposit?: string;
  rental_days?: string;
  inpost_point_id?: string;
  inpost_point_address?: string;
  delivery_method?: string;
  customer_email?: string;
  customer_phone?: string;
  company_name?: string;
  nip?: string;
  order_url?: string;
  info_box_content?: string;
}

/** 1. Order Received — tuż po płatności */
export function buildOrderReceivedHtml(v: OrderVars): string {
  const vars: Record<string, string> = { ...v } as unknown as Record<string, string>;
  const content = [
    heading("Dziękujemy za złożenie zamówienia!", "📡"),
    subtitle(`Cześć ${v.customer_name}, mamy Twoje zamówienie`),
    paragraph(`Twoja rezerwacja <strong>${v.order_number}</strong> została zarejestrowana w naszym systemie. Płatność została potwierdzona.`),
    renderSummaryBox(vars),
    paragraph(`<strong>Co dalej?</strong> Nasz zespół weryfikuje dostępność sprzętu na wybrane przez Ciebie daty. Uwzględniamy również 2-dniowy bufor logistyczny na przygotowanie i wysyłkę.`),
    paragraph(`W ciągu najbliższych godzin otrzymasz kolejną wiadomość z <strong>oficjalnym potwierdzeniem rezerwacji</strong> oraz umową najmu w formacie PDF.`),
    v.info_box_content ? alertBox(v.info_box_content, "info") : "",
    paragraph(`Jeśli masz pytania, śmiało odpowiedz na tego maila lub napisz na <a href="mailto:wynajem@starkit.pl" style="color:${BRAND.dark}">wynajem@starkit.pl</a>.`),
    signOff(),
  ].join("\n");
  return withStarkitTemplate(content, `Otrzymaliśmy Twoją rezerwację ${v.order_number}`);
}

/** 2. Order Confirmed — po zmianie statusu na reserved, z PDF */
export function buildOrderConfirmedHtml(v: OrderVars): string {
  const vars: Record<string, string> = { ...v } as unknown as Record<string, string>;
  const content = [
    heading("Mamy to! Twoja rezerwacja jest potwierdzona", "🎉"),
    subtitle(`Wszystko gotowe, ${v.customer_name}`),
    paragraph(`Świetna wiadomość! Twoja rezerwacja <strong>${v.order_number}</strong> została oficjalnie potwierdzona. Sprzęt jest zarezerwowany i czeka na Ciebie.`),
    renderReservationDetailsBox(vars),
    renderPdfBox(),
    renderFinancialBox(vars),
    v.info_box_content ? alertBox(v.info_box_content, "info") : "",
    paragraph(`<strong>Ważne informacje:</strong>`),
    `<ul style="margin:0 0 16px;padding-left:20px;color:#334155;font-size:14px;line-height:1.8">
<li>Sprzęt odbierzesz w dniu <strong>${v.start_date}</strong></li>
<li>Zwrot do końca dnia <strong>${v.end_date}</strong></li>
${vars.delivery_method === "personal_pickup" ? "<li>Prosimy zadzwonić przed odbiorem: <strong>+48 453 461 061</strong></li>" : "<li>Kod odbioru otrzymasz SMS-em od InPost</li>"}
<li>W razie pytań — odpowiedz na tego maila</li>
</ul>`,
    paragraph(`Dziękujemy za wybór Starkit i życzymy udanego wynajmu!`),
    signOff(),
  ].join("\n");
  return withStarkitTemplate(content, `Potwierdzenie rezerwacji ${v.order_number}`);
}

/** 3. Order Picked Up — sprzęt wysłany / wydany */
export function buildOrderPickedUpHtml(v: OrderVars): string {
  const vars: Record<string, string> = { ...v } as unknown as Record<string, string>;
  const isPersonalPickup = v.delivery_method === "personal_pickup";

  const content = isPersonalPickup ? [
    heading("Sprzęt wydany!", "✅"),
    subtitle(`Zamówienie ${v.order_number}, ${v.customer_name}`),
    paragraph(`Potwierdzamy wydanie zestawu Starlink Mini z zamówienia <strong>${v.order_number}</strong>. Sprzęt jest już w Twoich rękach — miłego korzystania!`),
    renderPersonalPickedUpBox(),
    renderInstructionsBox(),
    v.info_box_content ? alertBox(v.info_box_content, "info") : "",
    paragraph(`<strong>Okres wynajmu:</strong> ${v.start_date} – ${v.end_date}`),
    paragraph(`Jeśli napotkasz jakiekolwiek problemy z uruchomieniem, odpowiedz na tego maila lub zadzwoń: <a href="tel:+48453461061" style="color:#1a1a2e;font-weight:600">+48 453 461 061</a>`),
    signOff(),
  ].join("\n") : [
    heading("Sprzęt jest już w drodze!", "🚀"),
    subtitle(`Zamówienie ${v.order_number} zostało wysłane, ${v.customer_name}`),
    paragraph(`Twój zestaw Starlink Mini został nadany i wkrótce będzie gotowy do odbioru. Poniżej znajdziesz dane punktu odbioru oraz instrukcję uruchomienia.`),
    renderPickupBox(vars),
    renderInstructionsBox(),
    v.info_box_content ? alertBox(v.info_box_content, "info") : "",
    paragraph(`<strong>Okres wynajmu:</strong> ${v.start_date} – ${v.end_date}`),
    paragraph(`Jeśli napotkasz jakiekolwiek problemy z uruchomieniem, odpowiedz na tego maila — pomożemy!`),
    signOff(),
  ].join("\n");

  const subject = isPersonalPickup
    ? `Potwierdzenie wydania sprzętu ${v.order_number}`
    : `Sprzęt w drodze! Instrukcja obsługi ${v.order_number}`;
  return withStarkitTemplate(content, subject);
}

const PICKUP_ADDRESS = "Poznań, ul. Cumownicza";

/** 4. Order Ready For Pickup — gotowe do odbioru osobistego */
export function buildOrderReadyForPickupHtml(v: OrderVars): string {
  const content = [
    heading("Twój sprzęt jest gotowy do odbioru!", "🏪"),
    subtitle(`Zamówienie ${v.order_number} czeka na Ciebie, ${v.customer_name}`),
    paragraph(`Twój zestaw Starlink jest spakowany i gotowy do odbioru osobistego. Zapraszamy do naszego punktu.`),
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0">
    <tr><td style="background-color:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;padding:20px 24px">
      <table role="presentation" cellpadding="0" cellspacing="0">
        <tr>
          <td style="vertical-align:top;padding-right:14px">
            <span style="font-size:28px;line-height:1">📍</span>
          </td>
          <td>
            <p style="margin:0 0 6px;font-size:15px;font-weight:700;color:#1e40af">Adres odbioru</p>
            <p style="margin:0 0 4px;font-size:16px;font-weight:700;color:#1a1a2e">${PICKUP_ADDRESS}</p>
            <p style="margin:8px 0 0;font-size:13px;color:#64748b;line-height:1.5">Prosimy zadzwonić przed odbiorem: <strong>+48 453 461 061</strong></p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>`,
    infoBox("📋 Szczegóły zamówienia", [
      ["Numer zamówienia:", `<strong>${v.order_number}</strong>`],
      ["Okres wynajmu:", `${v.start_date} – ${v.end_date}`],
    ]),
    renderInstructionsBox(),
    v.info_box_content ? alertBox(v.info_box_content, "info") : "",
    paragraph(`Prosimy zabrać ze sobą <strong>dowód osobisty</strong> lub inny dokument tożsamości.`),
    paragraph(`W razie pytań odpowiedz na tego maila lub zadzwoń: <a href="tel:+48453461061" style="color:#1a1a2e;font-weight:600">+48 453 461 061</a>`),
    signOff(),
  ].join("\n");
  return withStarkitTemplate(content, `Sprzęt gotowy do odbioru! ${v.order_number}`);
}

/** 5. Order Returned — potwierdzenie zwrotu */
export function buildOrderReturnedHtml(v: OrderVars): string {
  const content = [
    heading("Dziękujemy za zwrot sprzętu", "✅"),
    subtitle(`Zamówienie ${v.order_number}, ${v.customer_name}`),
    paragraph(`Potwierdzamy odbiór zwróconego zestawu Starlink Mini z zamówienia <strong>${v.order_number}</strong>. Sprzęt został sprawdzony i przyjęty.`),
    alertBox(`� <strong>Zwrot kaucji:</strong> Kaucja zostanie przetworzona ręcznie przez nasz zespół. Środki powinny pojawić się na Twoim koncie w ciągu <strong>3–5 dni roboczych</strong>. Jeśli po tym czasie nie widzisz zwrotu, napisz do nas.`, "success"),
    v.info_box_content ? alertBox(v.info_box_content, "info") : "",
    paragraph(`Dziękujemy za skorzystanie z Starkit! Mamy nadzieję, że internet Starlink spełnił Twoje oczekiwania. 🛰️`),
    paragraph(`Będziemy wdzięczni za Twoją opinię — <strong>odpowiedz na tego maila</strong> i powiedz, jak Ci się korzystało!`),
    signOff(),
  ].join("\n");
  return withStarkitTemplate(content, `Potwierdzenie zwrotu sprzętu ${v.order_number}`);
}

/** 6. Order Cancelled — anulowanie */
export function buildOrderCancelledHtml(v: OrderVars): string {
  const content = [
    heading("Zamówienie anulowane"),
    subtitle(`Zamówienie ${v.order_number}, ${v.customer_name}`),
    paragraph(`Twoje zamówienie <strong>${v.order_number}</strong> zostało anulowane.`),
    alertBox(`Jeśli dokonałeś płatności, zwrot środków nastąpi w ciągu <strong>5–10 dni roboczych</strong> na konto, z którego dokonano płatności.`, "warning"),
    v.info_box_content ? alertBox(v.info_box_content, "info") : "",
    paragraph(`Jeśli masz pytania dotyczące anulowania lub chcesz złożyć nowe zamówienie, skontaktuj się z nami:`),
    paragraph(`📧 <a href="mailto:wynajem@starkit.pl" style="color:${BRAND.dark};font-weight:600">wynajem@starkit.pl</a><br/>🌐 <a href="https://www.starkit.pl" style="color:${BRAND.dark};font-weight:600">www.starkit.pl</a>`),
    signOff(),
  ].join("\n");
  return withStarkitTemplate(content, `Informacja o anulowaniu zamówienia ${v.order_number}`);
}

/** 7. General Purpose — szablon z dynamiczną treścią */
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

/** 8. Admin Notification — powiadomienie dla admina */
export function buildAdminNotificationHtml(v: OrderVars): string {
  const orderUrl = v.order_url || `${process.env.NEXT_PUBLIC_SITE_URL || "https://www.starkit.pl"}/office/orders/${v.order_number}`;

  const clientRows: [string, string][] = [
    ["Imię i nazwisko:", v.customer_name],
    ...(v.customer_email ? [["Email:", v.customer_email] as [string, string]] : []),
    ...(v.customer_phone ? [["Telefon:", v.customer_phone] as [string, string]] : []),
    ...(v.customer_address ? [["Adres:", v.customer_address] as [string, string]] : []),
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
  | "order_ready_for_pickup"
  | "order_returned"
  | "order_cancelled"
  | "admin_notification"
  | "general";

const BUILDERS: Record<EmailTemplateType, (v: OrderVars & { custom_content?: string }) => string> = {
  order_received: buildOrderReceivedHtml,
  order_confirmed: buildOrderConfirmedHtml,
  order_picked_up: buildOrderPickedUpHtml,
  order_ready_for_pickup: buildOrderReadyForPickupHtml,
  order_returned: buildOrderReturnedHtml,
  order_cancelled: buildOrderCancelledHtml,
  admin_notification: buildAdminNotificationHtml,
  general: buildGeneralPurposeHtml,
};

export const EMAIL_SUBJECTS: Record<EmailTemplateType, string> = {
  order_received: "Otrzymaliśmy Twoją rezerwację Starlink Mini — SK-{{id}}",
  order_confirmed: "Potwierdzenie rezerwacji SK-{{id}}",
  order_picked_up: "Sprzęt w drodze! Instrukcja obsługi SK-{{id}}",
  order_ready_for_pickup: "Sprzęt gotowy do odbioru osobistego! SK-{{id}}",
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
