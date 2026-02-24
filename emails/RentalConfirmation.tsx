import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Preview,
  Section,
  Text,
  Hr,
} from "@react-email/components";
import * as React from "react";

interface RentalConfirmationProps {
  orderNumber: string;
  customerName: string;
  startDate: string;
  endDate: string;
  inpostPointId: string;
  inpostPointAddress: string;
  depositAmount: string;
  totalAmount: string;
}

export const RentalConfirmation = ({
  orderNumber = "SK-2024-001",
  customerName = "Jan Kowalski",
  startDate = "15.03.2024",
  endDate = "22.03.2024",
  inpostPointId = "KRA010",
  inpostPointAddress = "ul. Floriańska 1, 31-019 Kraków",
  depositAmount = "500",
  totalAmount = "1060",
}: RentalConfirmationProps) => {
  return (
    <Html>
      <Head />
      <Preview>Potwierdzenie rezerwacji Starlink Mini - Zamówienie {orderNumber}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Logo Section */}
          <Section style={logoSection}>
            <Img
              src="https://starkit.pl/logo.png"
              width="140"
              height="46"
              alt="Starkit"
              style={logo}
            />
          </Section>

          {/* Header */}
          <Heading style={h1}>Potwierdzenie rezerwacji Starlink Mini</Heading>
          
          <Text style={greeting}>Dzień dobry {customerName},</Text>
          
          <Text style={paragraph}>
            Dziękujemy za złożenie zamówienia. Potwierdzamy rezerwację Twojego zestawu Starlink Mini.
          </Text>

          {/* Order Details Card */}
          <Section style={card}>
            <Heading style={cardTitle}>Szczegóły zamówienia</Heading>
            
            <table style={detailsTable}>
              <tbody>
                <tr>
                  <td style={labelCell}>Numer zamówienia:</td>
                  <td style={valueCell}>{orderNumber}</td>
                </tr>
                <tr>
                  <td style={labelCell}>Wybrany termin:</td>
                  <td style={valueCell}>{startDate} – {endDate}</td>
                </tr>
              </tbody>
            </table>
          </Section>

          {/* Delivery Details Card */}
          <Section style={card}>
            <Heading style={cardTitle}>Punkt odbioru</Heading>
            
            <table style={detailsTable}>
              <tbody>
                <tr>
                  <td style={labelCell}>Paczkomat InPost:</td>
                  <td style={valueCell}>{inpostPointId}</td>
                </tr>
                <tr>
                  <td style={labelCell}>Adres:</td>
                  <td style={valueCell}>{inpostPointAddress}</td>
                </tr>
              </tbody>
            </table>
            
            <Text style={infoText}>
              Paczka zostanie wysłana na 2 dni przed rozpoczęciem rezerwacji. 
              Otrzymasz kod odbioru SMS-em.
            </Text>
          </Section>

          {/* Deposit Information Card */}
          <Section style={depositCard}>
            <Heading style={cardTitle}>Informacja o kaucji</Heading>
            
            <Text style={depositText}>
              Kaucja zwrotna w wysokości <strong>{depositAmount} zł</strong> zostanie 
              automatycznie zwrócona na Twoje konto w ciągu <strong>48 godzin</strong> od 
              momentu zwrotu i weryfikacji sprzętu.
            </Text>
            
            <Hr style={divider} />
            
            <table style={summaryTable}>
              <tbody>
                <tr>
                  <td style={summaryLabel}>Łączna kwota:</td>
                  <td style={summaryValue}>{totalAmount} zł</td>
                </tr>
              </tbody>
            </table>
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              W razie pytań jesteśmy do Twojej dyspozycji.
            </Text>
            <Text style={footerText}>
              Pozdrawiamy,<br />
              <strong>Zespół Starkit Office Pro</strong>
            </Text>
          </Section>

          <Hr style={divider} />

          <Text style={disclaimer}>
            To jest automatyczna wiadomość potwierdzająca rezerwację. 
            Prosimy nie odpowiadać na ten email.
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

export default RentalConfirmation;

// Styles - Starkit Office Pro Design System
const main = {
  backgroundColor: "#ffffff",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  margin: "0 auto",
  padding: "40px 20px",
  maxWidth: "600px",
};

const logoSection = {
  textAlign: "center" as const,
  marginBottom: "32px",
};

const logo = {
  margin: "0 auto",
};

const h1 = {
  color: "#0f172a",
  fontSize: "24px",
  fontWeight: "600",
  lineHeight: "1.3",
  margin: "0 0 24px",
  textAlign: "center" as const,
};

const greeting = {
  color: "#0f172a",
  fontSize: "16px",
  lineHeight: "1.5",
  margin: "0 0 16px",
};

const paragraph = {
  color: "#475569",
  fontSize: "15px",
  lineHeight: "1.6",
  margin: "0 0 24px",
};

const card = {
  backgroundColor: "#f8fafc",
  border: "1px solid #e2e8f0",
  borderRadius: "8px",
  padding: "24px",
  marginBottom: "16px",
};

const depositCard = {
  backgroundColor: "#fefce8",
  border: "1px solid #fde047",
  borderRadius: "8px",
  padding: "24px",
  marginBottom: "24px",
};

const cardTitle = {
  color: "#0f172a",
  fontSize: "16px",
  fontWeight: "600",
  margin: "0 0 16px",
};

const detailsTable = {
  width: "100%",
  borderCollapse: "collapse" as const,
};

const labelCell = {
  color: "#64748b",
  fontSize: "14px",
  paddingBottom: "12px",
  paddingRight: "16px",
  verticalAlign: "top" as const,
  width: "40%",
};

const valueCell = {
  color: "#0f172a",
  fontSize: "14px",
  fontWeight: "500",
  paddingBottom: "12px",
};

const infoText = {
  color: "#64748b",
  fontSize: "13px",
  lineHeight: "1.5",
  margin: "16px 0 0",
  fontStyle: "italic" as const,
};

const depositText = {
  color: "#713f12",
  fontSize: "14px",
  lineHeight: "1.6",
  margin: "0 0 16px",
};

const divider = {
  borderColor: "#e2e8f0",
  margin: "16px 0",
};

const summaryTable = {
  width: "100%",
};

const summaryLabel = {
  color: "#0f172a",
  fontSize: "15px",
  fontWeight: "500",
  textAlign: "left" as const,
};

const summaryValue = {
  color: "#0f172a",
  fontSize: "18px",
  fontWeight: "700",
  textAlign: "right" as const,
};

const footer = {
  marginTop: "32px",
  textAlign: "center" as const,
};

const footerText = {
  color: "#64748b",
  fontSize: "14px",
  lineHeight: "1.6",
  margin: "0 0 8px",
};

const disclaimer = {
  color: "#94a3b8",
  fontSize: "12px",
  lineHeight: "1.5",
  margin: "16px 0 0",
  textAlign: "center" as const,
};
