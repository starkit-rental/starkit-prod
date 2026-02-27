import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";

interface AdminNotificationEmailProps {
  orderId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress?: string;
  companyName?: string;
  nip?: string;
  inpostCode: string;
  startDate: string;
  endDate: string;
  total: string;
  orderUrl: string;
  baseUrl?: string;
}

export const AdminNotificationEmail = ({
  orderId = "1234",
  customerName = "Jan Kowalski",
  customerEmail = "jan@example.com",
  customerPhone = "+48 123 456 789",
  customerAddress,
  companyName,
  nip,
  inpostCode = "KRA01",
  startDate = "15.03.2026",
  endDate = "22.03.2026",
  total = "1060",
  orderUrl = "https://starkit.pl/office/orders/1234",
  baseUrl = "https://starkit.pl",
}: AdminNotificationEmailProps) => {
  const displayId = orderId;

  return (
    <Html>
      <Head />
      <Preview>Nowa kasa! Zamówienie {displayId} od {customerName} 💸</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={logoSection}>
            <Img
              src={`${baseUrl}/logo.png`}
              width="120"
              height="40"
              alt="Starkit"
              style={logo}
            />
          </Section>

          <Heading style={h1}>Nowa kasa! 💸</Heading>
          <Text style={subtitle}>Zamówienie {displayId}</Text>

          <Section style={card}>
            <Heading style={h2}>👤 Klient</Heading>
            <table style={table}>
              <tbody>
                <tr>
                  <td style={tableLabel}>Imię i nazwisko:</td>
                  <td style={tableValue}>{customerName}</td>
                </tr>
                <tr>
                  <td style={tableLabel}>Email:</td>
                  <td style={tableValue}>{customerEmail}</td>
                </tr>
                <tr>
                  <td style={tableLabel}>Telefon:</td>
                  <td style={tableValue}>{customerPhone}</td>
                </tr>
                {customerAddress && (
                  <tr>
                    <td style={tableLabel}>Adres:</td>
                    <td style={tableValue}>{customerAddress}</td>
                  </tr>
                )}
                {companyName && (
                  <tr>
                    <td style={tableLabel}>Firma:</td>
                    <td style={tableValue}>
                      {companyName}
                      {nip && ` (NIP: ${nip})`}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </Section>

          <Section style={card}>
            <Heading style={h2}>📦 Logistyka</Heading>
            <table style={table}>
              <tbody>
                <tr>
                  <td style={tableLabel}>Paczkomat:</td>
                  <td style={tableValue}>{inpostCode}</td>
                </tr>
                <tr>
                  <td style={tableLabel}>Termin:</td>
                  <td style={tableValue}>{startDate} – {endDate}</td>
                </tr>
              </tbody>
            </table>
          </Section>

          <Section style={card}>
            <Heading style={h2}>💰 Wartość</Heading>
            <Text style={totalAmount}>{total} zł</Text>
          </Section>

          <Section style={buttonSection}>
            <Button style={button} href={orderUrl}>
              Otwórz w Starkit Office Pro
            </Button>
          </Section>

          <Section style={footer}>
            <Text style={footerText}>
              To automatyczna wiadomość z systemu Starkit Office Pro.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default AdminNotificationEmail;

const main = {
  backgroundColor: "#f8fafc",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "20px 0 48px",
  marginBottom: "64px",
  maxWidth: "600px",
};

const logoSection = {
  padding: "32px 40px 16px",
  textAlign: "center" as const,
};

const logo = {
  margin: "0 auto",
};

const h1 = {
  color: "#0f172a",
  fontSize: "28px",
  fontWeight: "700",
  margin: "0 40px 8px",
  padding: "0",
  textAlign: "center" as const,
};

const subtitle = {
  color: "#64748b",
  fontSize: "16px",
  fontWeight: "500",
  margin: "0 40px 32px",
  padding: "0",
  textAlign: "center" as const,
};

const h2 = {
  color: "#334155",
  fontSize: "18px",
  fontWeight: "600",
  margin: "0 0 16px",
  padding: "0",
};

const card = {
  backgroundColor: "#f8fafc",
  borderRadius: "12px",
  margin: "0 40px 20px",
  padding: "24px",
};

const table = {
  width: "100%",
  borderCollapse: "collapse" as const,
};

const tableLabel = {
  color: "#64748b",
  fontSize: "14px",
  paddingBottom: "12px",
  textAlign: "left" as const,
  width: "40%",
};

const tableValue = {
  color: "#0f172a",
  fontSize: "15px",
  fontWeight: "500",
  paddingBottom: "12px",
  textAlign: "left" as const,
};

const totalAmount = {
  color: "#0f172a",
  fontSize: "32px",
  fontWeight: "700",
  margin: "0",
  textAlign: "center" as const,
};

const buttonSection = {
  margin: "32px 40px",
  textAlign: "center" as const,
};

const button = {
  backgroundColor: "#0f172a",
  borderRadius: "8px",
  color: "#ffffff",
  fontSize: "16px",
  fontWeight: "600",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "14px 32px",
};

const footer = {
  margin: "32px 40px 0",
  borderTop: "1px solid #e2e8f0",
  paddingTop: "24px",
};

const footerText = {
  color: "#94a3b8",
  fontSize: "13px",
  lineHeight: "1.6",
  margin: "0",
  textAlign: "center" as const,
};
