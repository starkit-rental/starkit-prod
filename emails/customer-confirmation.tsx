import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";

interface CustomerConfirmationEmailProps {
  customerName: string;
  orderId: string;
  startDate: string;
  endDate: string;
  inpostCode: string;
  inpostAddress: string;
  rentalPrice: string;
  deposit: string;
  total: string;
  baseUrl?: string;
}

export const CustomerConfirmationEmail = ({
  customerName = "Kliencie",
  orderId = "1234",
  startDate = "15.03.2026",
  endDate = "22.03.2026",
  inpostCode = "KRA01",
  inpostAddress = "ul. Przykładowa 1, 00-000 Kraków",
  rentalPrice = "560",
  deposit = "500",
  total = "1060",
  baseUrl = "https://starkit.pl",
}: CustomerConfirmationEmailProps) => {
  const firstName = customerName.split(" ")[0] || customerName;

  return (
    <Html>
      <Head />
      <Preview>Twoja rezerwacja Starkit jest już potwierdzona! 🛰️</Preview>
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

          <Heading style={h1}>Hej {firstName}, Twój zestaw jest już prawie w drodze!</Heading>

          <Text style={text}>
            Cześć! Potwierdzamy otrzymanie Twojej płatności. Twój <strong>Starlink Mini</strong> będzie
            gotowy do pracy w dniach <strong>{startDate} – {endDate}</strong>.
          </Text>

          <Section style={card}>
            <Heading style={h2}>📦 Logistyka</Heading>
            <Text style={cardText}>
              <strong>Wybrany Paczkomat:</strong> {inpostCode}
              <br />
              {inpostAddress}
            </Text>
            <Text style={cardText}>
              Gdy tylko nadamy paczkę, otrzymasz kolejny mail z numerem śledzenia.
            </Text>
          </Section>

          <Section style={card}>
            <Heading style={h2}>💰 Podsumowanie finansowe</Heading>
            <table style={table}>
              <tbody>
                <tr>
                  <td style={tableLabel}>Wynajem:</td>
                  <td style={tableValue}>{rentalPrice} zł</td>
                </tr>
                <tr>
                  <td style={tableLabel}>Kaucja zwrotna:</td>
                  <td style={tableValue}>{deposit} zł</td>
                </tr>
                <tr style={tableTotalRow}>
                  <td style={tableTotalLabel}>Łącznie:</td>
                  <td style={tableTotalValue}>{total} zł</td>
                </tr>
              </tbody>
            </table>
          </Section>

          <Section style={warningCard}>
            <Text style={warningText}>
              <strong>💡 Pamiętaj:</strong> Kaucja {deposit} zł zostanie zwrócona na Twoje konto
              automatycznie w ciągu 48h od momentu, gdy sprawdzimy zwrócony sprzęt.
            </Text>
          </Section>

          <Section style={footer}>
            <Text style={footerText}>
              Masz pytania? Odpisz na tego maila.
            </Text>
            <Text style={footerText}>
              Pozdrawiamy,
              <br />
              <strong>Zespół Starkit</strong>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default CustomerConfirmationEmail;

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
  padding: "32px 40px",
  textAlign: "center" as const,
};

const logo = {
  margin: "0 auto",
};

const h1 = {
  color: "#0f172a",
  fontSize: "24px",
  fontWeight: "700",
  margin: "0 40px 24px",
  padding: "0",
  lineHeight: "1.3",
};

const h2 = {
  color: "#334155",
  fontSize: "18px",
  fontWeight: "600",
  margin: "0 0 12px",
  padding: "0",
};

const text = {
  color: "#475569",
  fontSize: "16px",
  lineHeight: "1.6",
  margin: "0 40px 24px",
};

const card = {
  backgroundColor: "#f8fafc",
  borderRadius: "12px",
  margin: "0 40px 20px",
  padding: "24px",
};

const cardText = {
  color: "#475569",
  fontSize: "15px",
  lineHeight: "1.6",
  margin: "0 0 12px",
};

const table = {
  width: "100%",
  borderCollapse: "collapse" as const,
};

const tableLabel = {
  color: "#64748b",
  fontSize: "15px",
  paddingBottom: "8px",
  textAlign: "left" as const,
};

const tableValue = {
  color: "#0f172a",
  fontSize: "15px",
  fontWeight: "600",
  paddingBottom: "8px",
  textAlign: "right" as const,
};

const tableTotalRow = {
  borderTop: "2px solid #cbd5e1",
  paddingTop: "12px",
};

const tableTotalLabel = {
  color: "#0f172a",
  fontSize: "16px",
  fontWeight: "600",
  paddingTop: "12px",
  textAlign: "left" as const,
};

const tableTotalValue = {
  color: "#0f172a",
  fontSize: "18px",
  fontWeight: "700",
  paddingTop: "12px",
  textAlign: "right" as const,
};

const warningCard = {
  backgroundColor: "#fef3c7",
  borderRadius: "12px",
  margin: "0 40px 32px",
  padding: "20px 24px",
  border: "1px solid #fde68a",
};

const warningText = {
  color: "#78350f",
  fontSize: "14px",
  lineHeight: "1.6",
  margin: "0",
};

const footer = {
  margin: "32px 40px 0",
  borderTop: "1px solid #e2e8f0",
  paddingTop: "24px",
};

const footerText = {
  color: "#64748b",
  fontSize: "14px",
  lineHeight: "1.6",
  margin: "0 0 8px",
};
