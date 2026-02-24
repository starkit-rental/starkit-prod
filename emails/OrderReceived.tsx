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

interface OrderReceivedEmailProps {
  customerName: string;
  orderId: string;
  startDate: string;
  endDate: string;
  totalAmount: string;
  baseUrl: string;
}

export const OrderReceivedEmail = ({
  customerName = "Kliencie",
  orderId = "SK-2024-001",
  startDate = "15.03.2024",
  endDate = "22.03.2024",
  totalAmount = "1060",
  baseUrl = "http://localhost:3000",
}: OrderReceivedEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Otrzymaliśmy Twoją rezerwację Starlink Mini - {orderId}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Logo */}
          <Section style={logoSection}>
            <Img
              src={`${baseUrl}/logo.png`}
              width="140"
              height="46"
              alt="Starkit"
              style={logo}
            />
          </Section>

          {/* Header */}
          <Section style={header}>
            <Heading style={h1}>Otrzymaliśmy Twoją rezerwację! 📡</Heading>
            <Text style={subtitle}>
              Dziękujemy za zaufanie, {customerName}
            </Text>
          </Section>

          {/* Main Content */}
          <Section style={content}>
            <Text style={paragraph}>
              Twoja rezerwacja <strong>{orderId}</strong> została zarejestrowana w naszym systemie.
            </Text>

            <Text style={paragraph}>
              <strong>Co dalej?</strong>
            </Text>

            <Text style={paragraph}>
              Nasz zespół weryfikuje obecnie dostępność sprzętu na wybrane przez Ciebie daty.
              W ciągu najbliższych godzin otrzymasz od nas kolejną wiadomość z potwierdzeniem
              wynajmu oraz szczegółami dotyczącymi odbioru i zwrotu urządzenia.
            </Text>

            {/* Order Summary */}
            <Section style={box}>
              <Text style={boxTitle}>📋 Podsumowanie rezerwacji</Text>
              
              <table style={infoTable}>
                <tbody>
                  <tr>
                    <td style={infoLabel}>Numer zamówienia:</td>
                    <td style={infoValue}>{orderId}</td>
                  </tr>
                  <tr>
                    <td style={infoLabel}>Okres wynajmu:</td>
                    <td style={infoValue}>{startDate} - {endDate}</td>
                  </tr>
                  <tr>
                    <td style={infoLabel}>Łączna kwota:</td>
                    <td style={infoValue}>{totalAmount} zł</td>
                  </tr>
                </tbody>
              </table>
            </Section>

            {/* Info Box */}
            <Section style={infoBox}>
              <Text style={infoBoxText}>
                💡 <strong>Ważne:</strong> Płatność została zaksięgowana. Kaucja zwrotna zostanie
                przekazana na Twoje konto w ciągu 48 godzin od zwrotu sprzętu w nienaruszonym stanie.
              </Text>
            </Section>

            <Text style={paragraph}>
              Jeśli masz jakiekolwiek pytania, śmiało odpowiedz na tego maila lub skontaktuj się
              z nami bezpośrednio.
            </Text>

            <Text style={paragraph}>
              Pozdrawiamy,<br />
              <strong>Zespół Starkit</strong>
            </Text>
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              Starkit - wynajem Starlink Mini
            </Text>
            <Text style={footerText}>
              Email: <Link href="mailto:wynajem@starkit.pl" style={link}>wynajem@starkit.pl</Link>
            </Text>
            <Text style={footerText}>
              Zamówienie: {orderId}
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default OrderReceivedEmail;

// Styles
const main = {
  backgroundColor: "#f6f6f6",
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

const header = {
  padding: "0 40px 32px",
  textAlign: "center" as const,
};

const h1 = {
  color: "#000",
  fontSize: "28px",
  fontWeight: "700",
  margin: "0 0 12px",
  padding: "0",
  lineHeight: "1.3",
};

const subtitle = {
  color: "#666",
  fontSize: "16px",
  margin: "0",
  padding: "0",
};

const content = {
  padding: "0 40px",
};

const paragraph = {
  color: "#333",
  fontSize: "15px",
  lineHeight: "1.6",
  margin: "16px 0",
};

const box = {
  backgroundColor: "#f9f9f9",
  border: "1px solid #e5e5e5",
  borderRadius: "8px",
  padding: "24px",
  margin: "24px 0",
};

const boxTitle = {
  color: "#000",
  fontSize: "16px",
  fontWeight: "600",
  margin: "0 0 16px",
};

const infoTable = {
  width: "100%",
  borderCollapse: "collapse" as const,
};

const infoLabel = {
  color: "#666",
  fontSize: "14px",
  padding: "8px 0",
  width: "45%",
};

const infoValue = {
  color: "#000",
  fontSize: "14px",
  fontWeight: "600",
  padding: "8px 0",
};

const infoBox = {
  backgroundColor: "#fffbeb",
  border: "1px solid #fbbf24",
  borderLeft: "4px solid #fbbf24",
  borderRadius: "6px",
  padding: "16px",
  margin: "24px 0",
};

const infoBoxText = {
  color: "#92400e",
  fontSize: "14px",
  lineHeight: "1.5",
  margin: "0",
};

const footer = {
  borderTop: "1px solid #e5e5e5",
  padding: "32px 40px",
  textAlign: "center" as const,
  marginTop: "32px",
};

const footerText = {
  color: "#666",
  fontSize: "12px",
  lineHeight: "1.5",
  margin: "4px 0",
};

const link = {
  color: "#000",
  textDecoration: "underline",
};
