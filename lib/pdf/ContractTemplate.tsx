import React from "react";
import { Document, Page, Text, View, StyleSheet, Font } from "@react-pdf/renderer";

// Roboto — pełna obsługa polskich znaków (Latin Extended)
Font.register({
  family: "Roboto",
  fonts: [
    {
      src: "https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.ttf",
      fontWeight: 400,
    },
    {
      src: "https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-bold-webfont.ttf",
      fontWeight: 700,
    },
    {
      src: "https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-italic-webfont.ttf",
      fontWeight: 400,
      fontStyle: "italic",
    },
  ],
});

// Wyłącz hyphenację (łamie polskie słowa)
Font.registerHyphenationCallback((word) => [word]);

interface ContractTemplateProps {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  companyName?: string;
  nip?: string;
  startDate: string;
  endDate: string;
  rentalPrice: string;
  deposit: string;
  totalAmount: string;
  inpostPointId: string;
  inpostPointAddress: string;
  contractContent: string;
  rentalDays?: number;
}

const YELLOW = "#f59e0b";
const DARK = "#1e293b";
const GRAY = "#64748b";
const LIGHT_BG = "#f8fafc";
const BORDER = "#e2e8f0";

const styles = StyleSheet.create({
  page: {
    padding: 45,
    fontSize: 9.5,
    fontFamily: "Roboto",
    lineHeight: 1.55,
    color: DARK,
  },
  // Header
  headerBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 25,
    paddingBottom: 12,
    borderBottom: `2 solid ${YELLOW}`,
  },
  headerLeft: {},
  title: {
    fontSize: 16,
    fontWeight: 700,
    color: DARK,
    letterSpacing: 0.5,
  },
  headerMeta: {
    fontSize: 8.5,
    color: GRAY,
    marginTop: 3,
  },
  // Section
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 700,
    marginBottom: 8,
    color: DARK,
    paddingBottom: 4,
    borderBottom: `1 solid ${BORDER}`,
  },
  // Table rows
  tableContainer: {
    backgroundColor: LIGHT_BG,
    borderRadius: 4,
    padding: 10,
    marginBottom: 4,
  },
  row: {
    flexDirection: "row",
    marginBottom: 4,
  },
  label: {
    width: "38%",
    color: GRAY,
    fontSize: 9,
  },
  value: {
    width: "62%",
    fontWeight: 700,
    fontSize: 9.5,
  },
  // Text
  paragraph: {
    marginBottom: 6,
    textAlign: "justify",
    fontSize: 9,
    lineHeight: 1.6,
  },
  listItem: {
    marginBottom: 5,
    paddingLeft: 12,
    fontSize: 9,
    lineHeight: 1.6,
  },
  // Highlight box
  highlight: {
    backgroundColor: "#fffbeb",
    padding: 10,
    marginVertical: 8,
    borderLeft: `3 solid ${YELLOW}`,
    borderRadius: 2,
  },
  highlightText: {
    fontSize: 8.5,
    color: "#92400e",
    lineHeight: 1.5,
  },
  // Divider
  divider: {
    borderBottom: `1 solid ${BORDER}`,
    marginVertical: 12,
  },
  // Footer
  footer: {
    position: "absolute",
    bottom: 30,
    left: 45,
    right: 45,
    paddingTop: 10,
    borderTop: `1 solid ${BORDER}`,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerText: {
    fontSize: 7.5,
    color: GRAY,
  },
  // Finance total
  totalRow: {
    flexDirection: "row",
    marginTop: 6,
    paddingTop: 6,
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
});

export const ContractTemplate: React.FC<ContractTemplateProps> = ({
  orderNumber,
  customerName,
  customerEmail,
  customerPhone,
  companyName,
  nip,
  startDate,
  endDate,
  rentalPrice,
  deposit,
  totalAmount,
  inpostPointId,
  inpostPointAddress,
  contractContent,
  rentalDays,
}) => {
  const currentDate = new Date().toLocaleDateString("pl-PL");

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.headerBar}>
          <View style={styles.headerLeft}>
            <Text style={styles.title}>UMOWA NAJMU STARLINK MINI</Text>
            <Text style={styles.headerMeta}>Starkit Sp. z o.o. | wynajem@starkit.pl</Text>
          </View>
          <View>
            <Text style={styles.headerMeta}>Nr: {orderNumber}</Text>
            <Text style={styles.headerMeta}>Data: {currentDate}</Text>
          </View>
        </View>

        {/* §1 Strony umowy */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{"\u00A7"}1 STRONY UMOWY</Text>

          <Text style={[styles.paragraph, { fontWeight: 700, marginBottom: 2 }]}>Wynajmuj{"ą"}cy:</Text>
          <View style={styles.tableContainer}>
            <View style={styles.row}>
              <Text style={styles.label}>Firma:</Text>
              <Text style={styles.value}>Starkit Sp. z o.o.</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Email:</Text>
              <Text style={styles.value}>wynajem@starkit.pl</Text>
            </View>
          </View>

          <Text style={[styles.paragraph, { fontWeight: 700, marginBottom: 2, marginTop: 8 }]}>Najemca:</Text>
          <View style={styles.tableContainer}>
            <View style={styles.row}>
              <Text style={styles.label}>Imi{"ę"} i nazwisko:</Text>
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
          </View>
        </View>

        {/* §2 Przedmiot najmu */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{"\u00A7"}2 PRZEDMIOT NAJMU</Text>
          <Text style={styles.paragraph}>
            Wynajmuj{"ą"}cy oddaje Najemcy w najem zestaw Starlink Mini wraz z niezb{"ę"}dnym wyposa{"ż"}eniem
            (router, kable, instrukcja obs{"ł"}ugi) na okres okre{"ś"}lony w {"\u00A7"}3 niniejszej umowy.
          </Text>
        </View>

        {/* §3 Okres najmu */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{"\u00A7"}3 OKRES NAJMU I LOGISTYKA</Text>
          <View style={styles.tableContainer}>
            <View style={styles.row}>
              <Text style={styles.label}>Data rozpocz{"ę"}cia:</Text>
              <Text style={styles.value}>{startDate}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Data zako{"ń"}czenia:</Text>
              <Text style={styles.value}>{endDate}</Text>
            </View>
            {rentalDays && (
              <View style={styles.row}>
                <Text style={styles.label}>Liczba dni:</Text>
                <Text style={styles.value}>{rentalDays}</Text>
              </View>
            )}
            <View style={styles.row}>
              <Text style={styles.label}>Punkt odbioru:</Text>
              <Text style={styles.value}>{inpostPointId}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Adres paczkomatu:</Text>
              <Text style={styles.value}>{inpostPointAddress}</Text>
            </View>
          </View>
        </View>

        {/* §4 Wynagrodzenie */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{"\u00A7"}4 WYNAGRODZENIE I KAUCJA</Text>
          <View style={styles.tableContainer}>
            <View style={styles.row}>
              <Text style={styles.label}>Op{"ł"}ata za najem:</Text>
              <Text style={styles.value}>{rentalPrice} z{"ł"}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Kaucja zwrotna:</Text>
              <Text style={styles.value}>{deposit} z{"ł"}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>{"Ł"}{"ą"}cznie:</Text>
              <Text style={styles.totalValue}>{totalAmount} z{"ł"}</Text>
            </View>
          </View>

          <View style={styles.highlight}>
            <Text style={styles.highlightText}>
              Kaucja zostanie zwr{"ó"}cona na konto Najemcy w ci{"ą"}gu 48 godzin od momentu zwrotu
              i weryfikacji sprz{"ę"}tu pod warunkiem braku uszkodze{"ń"} i kompletno{"ś"}ci zestawu.
            </Text>
          </View>
        </View>

        {/* §5 Regulamin */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{"\u00A7"}5 REGULAMIN WYNAJMU</Text>
          {contractContent.split("\n\n").map((paragraph, index) => {
            const trimmed = paragraph.trim();
            if (!trimmed) return null;
            return (
              <View key={index} style={styles.listItem}>
                <Text>{trimmed}</Text>
              </View>
            );
          })}
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>Starkit Office Pro | Dokument wygenerowany automatycznie</Text>
          <Text style={styles.footerText}>{orderNumber} | {currentDate}</Text>
        </View>
      </Page>
    </Document>
  );
};

export default ContractTemplate;
