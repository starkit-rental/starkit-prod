import React from "react";
import path from "path";
import { Document, Page, Text, View, Image, StyleSheet, Font } from "@react-pdf/renderer";
import { HtmlContent, splitHtmlForColumns } from "./html-to-pdf";

// Roboto — pełna obsługa polskich znaków (Latin Extended)
// Use local TTF files from /public/fonts/ — CDN URLs unreliable in server-side PDF rendering
const FONTS_DIR = path.join(process.cwd(), "public", "fonts");

Font.register({
  family: "Roboto",
  fonts: [
    {
      src: path.join(FONTS_DIR, "Roboto-Regular.ttf"),
      fontWeight: 400,
    },
    {
      src: path.join(FONTS_DIR, "Roboto-Bold.ttf"),
      fontWeight: 700,
    },
    {
      src: path.join(FONTS_DIR, "Roboto-Italic.ttf"),
      fontWeight: 400,
      fontStyle: "italic",
    },
  ],
});

// Wyłącz hyphenację (łamie polskie słowa)
Font.registerHyphenationCallback((word) => [word]);

export interface ContractTemplateProps {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  companyName?: string;
  nip?: string;
  customerAddress?: string;
  startDate: string;
  endDate: string;
  rentalPrice: string;
  deposit: string;
  totalAmount: string;
  inpostPointId: string;
  inpostPointAddress: string;
  contractContent: string;
  rentalDays?: number;
  logoUrl?: string;
}

const GOLD = "#D4A843";
const DARK = "#1e293b";
const GRAY = "#64748b";
const LIGHT_BG = "#f8fafc";
const BORDER = "#e2e8f0";

const styles = StyleSheet.create({
  page: {
    paddingTop: 35,
    paddingBottom: 55,
    paddingHorizontal: 40,
    fontSize: 9.5,
    fontFamily: "Roboto",
    lineHeight: 1.5,
    color: DARK,
  },
  // Header
  headerBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    paddingBottom: 10,
    borderBottom: `2 solid ${GOLD}`,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  logo: {
    width: 120,
    height: 40,
    objectFit: "contain",
  },
  headerRight: {
    alignItems: "flex-end",
  },
  title: {
    fontSize: 14,
    fontWeight: 700,
    color: DARK,
    letterSpacing: 0.5,
  },
  headerMeta: {
    fontSize: 8,
    color: GRAY,
    marginTop: 2,
  },
  orderBadge: {
    backgroundColor: GOLD,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 3,
    marginBottom: 3,
  },
  orderBadgeText: {
    fontSize: 9,
    fontWeight: 700,
    color: "#ffffff",
    letterSpacing: 0.3,
  },
  // Section
  section: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: 700,
    marginBottom: 6,
    color: DARK,
    paddingBottom: 3,
    borderBottom: `1 solid ${BORDER}`,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  // Compact 2-col party layout
  partiesRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 4,
  },
  partyBox: {
    flex: 1,
    backgroundColor: LIGHT_BG,
    borderRadius: 4,
    padding: 8,
  },
  partyLabel: {
    fontSize: 7.5,
    fontWeight: 700,
    color: GOLD,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  // Table rows
  tableContainer: {
    backgroundColor: LIGHT_BG,
    borderRadius: 4,
    padding: 8,
    marginBottom: 4,
  },
  row: {
    flexDirection: "row",
    marginBottom: 3,
  },
  label: {
    width: "38%",
    color: GRAY,
    fontSize: 8.5,
  },
  value: {
    width: "62%",
    fontWeight: 700,
    fontSize: 9,
  },
  // Text
  paragraph: {
    marginBottom: 4,
    textAlign: "justify",
    fontSize: 8.5,
    lineHeight: 1.5,
  },
  // Highlight box
  highlight: {
    backgroundColor: "#fffbeb",
    padding: 8,
    marginVertical: 6,
    borderLeft: `3 solid ${GOLD}`,
    borderRadius: 2,
  },
  highlightText: {
    fontSize: 8,
    color: "#92400e",
    lineHeight: 1.4,
  },
  // Finance total
  totalRow: {
    flexDirection: "row",
    marginTop: 4,
    paddingTop: 4,
    borderTop: `1 solid ${BORDER}`,
  },
  totalLabel: {
    width: "38%",
    fontWeight: 700,
    fontSize: 10,
  },
  totalValue: {
    width: "62%",
    fontWeight: 700,
    fontSize: 11,
    color: DARK,
  },
  // §5 Multi-column legal
  legalSection: {
    marginBottom: 8,
  },
  legalColumnsRow: {
    flexDirection: "row",
    gap: 14,
  },
  legalColumn: {
    flex: 1,
  },
  // Footer
  footer: {
    position: "absolute",
    bottom: 20,
    left: 40,
    right: 40,
    paddingTop: 8,
    borderTop: `1 solid ${BORDER}`,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  footerText: {
    fontSize: 7,
    color: GRAY,
  },
  footerRight: {
    alignItems: "flex-end",
  },
  // Signatures
  signaturesRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
    paddingTop: 12,
  },
  signatureBox: {
    width: "40%",
    alignItems: "center",
  },
  signatureLine: {
    borderBottom: `1 solid ${DARK}`,
    width: "100%",
    marginBottom: 4,
  },
  signatureLabel: {
    fontSize: 7.5,
    color: GRAY,
    textAlign: "center",
  },
  signatureName: {
    fontSize: 9,
    fontWeight: 400,
    color: DARK,
    textAlign: "center",
    marginTop: 2,
  },
});

export const ContractTemplate: React.FC<ContractTemplateProps> = ({
  orderNumber,
  customerName,
  customerEmail,
  customerPhone,
  companyName,
  nip,
  customerAddress,
  startDate,
  endDate,
  rentalPrice,
  deposit,
  totalAmount,
  inpostPointId,
  inpostPointAddress,
  contractContent,
  rentalDays,
  logoUrl,
}) => {
  const currentDate = new Date().toLocaleDateString("pl-PL", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  // Detect if contractContent is HTML (from TipTap editor) or plain text
  const isHtmlContent = /<[a-z][\s\S]*>/i.test(contractContent);

  // Split legal content into 2 columns
  const [leftLegalHtml, rightLegalHtml] = isHtmlContent
    ? splitHtmlForColumns(contractContent)
    : ["", ""];

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.starkit.pl";
  const resolvedLogoUrl = logoUrl || `${baseUrl}/logo.png`;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* ── Header with Logo ── */}
        <View style={styles.headerBar}>
          <View style={styles.headerLeft}>
            <Image style={styles.logo} src={resolvedLogoUrl} />
            <View>
              <Text style={styles.title}>UMOWA NAJMU</Text>
              <Text style={styles.headerMeta}>Zakład Graficzny Maciej Godek | wynajem@starkit.pl</Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <View style={styles.orderBadge}>
              <Text style={styles.orderBadgeText}>{orderNumber}</Text>
            </View>
            <Text style={styles.headerMeta}>{currentDate}</Text>
          </View>
        </View>

        {/* ── §1 Strony umowy — Compact 2-col ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{"\u00A7"}1 Strony umowy</Text>
          <View style={styles.partiesRow}>
            {/* Wynajmujący */}
            <View style={styles.partyBox}>
              <Text style={styles.partyLabel}>Wynajmuj\u0105cy</Text>
              <View style={styles.row}>
                <Text style={styles.label}>Firma:</Text>
                <Text style={styles.value}>Zakład Graficzny Maciej Godek</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Email:</Text>
                <Text style={styles.value}>wynajem@starkit.pl</Text>
              </View>
            </View>
            {/* Najemca */}
            <View style={styles.partyBox}>
              <Text style={styles.partyLabel}>Najemca</Text>
              <View style={styles.row}>
                <Text style={styles.label}>Imi\u0119 i nazwisko:</Text>
                <Text style={styles.value}>{customerName}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Email:</Text>
                <Text style={styles.value}>{customerEmail}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Telefon:</Text>
                <Text style={styles.value}>{customerPhone}</Text>
              </View>
              {companyName && (
                <View style={styles.row}>
                  <Text style={styles.label}>Firma:</Text>
                  <Text style={styles.value}>{companyName}</Text>
                </View>
              )}
              {nip && (
                <View style={styles.row}>
                  <Text style={styles.label}>NIP:</Text>
                  <Text style={styles.value}>{nip}</Text>
                </View>
              )}
              {customerAddress && (
                <View style={styles.row}>
                  <Text style={styles.label}>Adres:</Text>
                  <Text style={styles.value}>{customerAddress}</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* ── §2 Przedmiot najmu ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{"\u00A7"}2 Przedmiot najmu</Text>
          <Text style={styles.paragraph}>
            Wynajmuj\u0105cy oddaje Najemcy w najem zestaw Starlink Mini wraz z niezb\u0119dnym
            wyposa\u017Ceniem (router, kable, instrukcja obs\u0142ugi) na okres okre\u015Blony
            w {"\u00A7"}3 niniejszej umowy.
          </Text>
        </View>

        {/* ── §3 Okres najmu — Compact row ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{"\u00A7"}3 Okres najmu i logistyka</Text>
          <View style={styles.partiesRow}>
            <View style={styles.partyBox}>
              <View style={styles.row}>
                <Text style={styles.label}>Rozpocz\u0119cie:</Text>
                <Text style={styles.value}>{startDate}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Zako\u0144czenie:</Text>
                <Text style={styles.value}>{endDate}</Text>
              </View>
              {rentalDays && (
                <View style={styles.row}>
                  <Text style={styles.label}>Liczba dni:</Text>
                  <Text style={styles.value}>{rentalDays}</Text>
                </View>
              )}
            </View>
            <View style={styles.partyBox}>
              <View style={styles.row}>
                <Text style={styles.label}>Paczkomat:</Text>
                <Text style={styles.value}>{inpostPointId || "\u2014"}</Text>
              </View>
              {inpostPointAddress && (
                <View style={styles.row}>
                  <Text style={styles.label}>Adres:</Text>
                  <Text style={styles.value}>{inpostPointAddress}</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* ── §4 Wynagrodzenie ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{"\u00A7"}4 Wynagrodzenie i kaucja</Text>
          <View style={styles.tableContainer}>
            <View style={styles.row}>
              <Text style={styles.label}>Op\u0142ata za najem:</Text>
              <Text style={styles.value}>{rentalPrice} z\u0142</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Kaucja zwrotna:</Text>
              <Text style={styles.value}>{deposit} z\u0142</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>\u0141\u0105cznie:</Text>
              <Text style={styles.totalValue}>{totalAmount} z\u0142</Text>
            </View>
          </View>

          <View style={styles.highlight}>
            <Text style={styles.highlightText}>
              Kaucja zostanie zwr\u00F3cona na konto Najemcy w ci\u0105gu 48 godzin od momentu zwrotu
              i weryfikacji sprz\u0119tu pod warunkiem braku uszkodze\u0144 i kompletno\u015Bci zestawu.
            </Text>
          </View>
        </View>

        {/* ── §5 Regulamin — Multi-column fine-print ── */}
        <View style={styles.legalSection}>
          <Text style={styles.sectionTitle}>{"\u00A7"}5 Regulamin wynajmu</Text>

          {isHtmlContent ? (
            <View style={styles.legalColumnsRow}>
              <HtmlContent html={leftLegalHtml} style={styles.legalColumn} />
              {rightLegalHtml && (
                <HtmlContent html={rightLegalHtml} style={styles.legalColumn} />
              )}
            </View>
          ) : (
            // Fallback for plain text content (legacy)
            <View style={styles.legalColumnsRow}>
              {(() => {
                const paragraphs = contractContent
                  .split("\n\n")
                  .map((p) => p.trim())
                  .filter(Boolean);
                const mid = Math.ceil(paragraphs.length / 2);
                const left = paragraphs.slice(0, mid);
                const right = paragraphs.slice(mid);

                return (
                  <>
                    <View style={styles.legalColumn}>
                      {left.map((p, i) => (
                        <Text
                          key={`l-${i}`}
                          style={{ fontSize: 7.5, lineHeight: 1.45, marginBottom: 3, textAlign: "justify" }}
                        >
                          {p}
                        </Text>
                      ))}
                    </View>
                    <View style={styles.legalColumn}>
                      {right.map((p, i) => (
                        <Text
                          key={`r-${i}`}
                          style={{ fontSize: 7.5, lineHeight: 1.45, marginBottom: 3, textAlign: "justify" }}
                        >
                          {p}
                        </Text>
                      ))}
                    </View>
                  </>
                );
              })()}
            </View>
          )}
        </View>

        {/* ── Signatures ── */}
        <View style={styles.signaturesRow}>
          <View style={styles.signatureBox}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureName}>Maciej Godek</Text>
            <Text style={styles.signatureLabel}>Wynajmuj\u0105cy</Text>
          </View>
          <View style={styles.signatureBox}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureName}>{customerName}</Text>
            <Text style={styles.signatureLabel}>Najemca</Text>
          </View>
        </View>

        {/* ── Footer ── */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            Zakład Graficzny Maciej Godek | Dokument wygenerowany automatycznie | www.starkit.pl
          </Text>
          <View style={styles.footerRight}>
            <Text style={styles.footerText}>{orderNumber}</Text>
            <Text style={styles.footerText}>{currentDate}</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
};

export default ContractTemplate;
