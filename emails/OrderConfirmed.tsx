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

interface OrderConfirmedEmailProps {
  customerName: string;
  orderId: string;
  startDate: string;
  endDate: string;
  rentalDays: number;
  inpostPointId: string;
  inpostPointAddress: string;
  rentalPrice: string;
  deposit: string;
  totalAmount: string;
  baseUrl: string;
}

export const OrderConfirmedEmail = ({
  customerName = "Kliencie",
  orderId = "SK-2024-001",
  startDate = "15.03.2024",
  endDate = "22.03.2024",
  rentalDays = 7,
  inpostPointId = "KRA010",
  inpostPointAddress = "ul. Floriańska 1, 31-019 Kraków",
  rentalPrice = "560",
  deposit = "500",
  totalAmount = "1060",
  baseUrl = "http://localhost:3000",
}: OrderConfirmedEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Twoja rezerwacja Starlink Mini została potwierdzona! - {orderId}</Preview>
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
            <Heading style={h1}>Rezerwacja potwierdzona! 🎉</Heading>
            <Text style={subtitle}>
              Wszystko gotowe, {customerName}
            </Text>
          </Section>

          {/* Main Content */}
          <Section style={content}>
            <Text style={paragraph}>
              Świetna wiadomość! Twoja rezerwacja <strong>{orderId}</strong> została oficjalnie
              potwierdzona. Sprzęt jest zarezerwowany i czeka na Ciebie.
            </Text>

            {/* Order Details */}
            <Section style={box}>
              <Text style={boxTitle}>📋 Szczegóły wynajmu</Text>
              
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
                    <td style={infoLabel}>Liczba dni:</td>
                    <td style={infoValue}>{rentalDays} dni</td>
                  </tr>
                </tbody>
              </table>
            </Section>

            {/* InPost Details */}
            <Section style={box}>
              <Text style={boxTitle}>📦 Punkt odbioru i zwrotu</Text>
              
              <table style={infoTable}>
                <tbody>
                  <tr>
                    <td style={infoLabel}>Paczkomat InPost:</td>
                    <td style={infoValue}>{inpostPointId}</td>
                  </tr>
                  <tr>
                    <td style={infoLabel}>Adres:</td>
                    <td style={infoValue}>{inpostPointAddress}</td>
                  </tr>
                </tbody>
              </table>

              <Text style={infoBoxText}>
                💡 Otrzymasz SMS z kodem odbioru w dniu rozpoczęcia wynajmu.
                Zwrot sprzętu w tym samym paczkomacie do końca ostatniego dnia wynajmu.
              </Text>
            </Section>

            {/* Financial Summary */}
            <Section style={box}>
              <Text style={boxTitle}>💰 Podsumowanie finansowe</Text>
              
              <table style={infoTable}>
                <tbody>
                  <tr>
                    <td style={infoLabel}>Opłata za najem:</td>
                    <td style={infoValue}>{rentalPrice} zł</td>
                  </tr>
                  <tr>
                    <td style={infoLabel}>Kaucja zwrotna:</td>
                    <td style={infoValue}>{deposit} zł</td>
                  </tr>
                  <tr style={totalRow}>
                    <td style={totalLabel}>Łącznie zapłacono:</td>
                    <td style={totalValue}>{totalAmount} zł</td>
                  </tr>
                </tbody>
              </table>
            </Section>

            {/* Deposit Info */}
            <Section style={depositBox}>
              <Text style={depositText}>
                💳 <strong>Zwrot kaucji:</strong> Kaucja w wysokości {deposit} zł zostanie
                automatycznie zwrócona na Twoje konto w ciągu 48 godzin od momentu zwrotu
                i weryfikacji sprzętu. Sprzęt musi być kompletny i nieuszkodzony.
              </Text>
            </Section>

            {/* Contract Attachment */}
            <Section style={attachmentBox}>
              <Text style={attachmentText}>
                📄 <strong>Umowa najmu:</strong> W załączniku znajdziesz umowę najmu w formacie PDF.
                Prosimy o zapoznanie się z regulaminem przed odbiorem sprzętu.
              </Text>
            </Section>

            <Text style={paragraph}>
              <strong>Ważne informacje:</strong>
            </Text>

            <ul style={list}>
              <li style={listItem}>Sprzęt odbierzesz w dniu {startDate}</li>
              <li style={listItem}>Zwrot do końca dnia {endDate}</li>
              <li style={listItem}>Kod odbioru otrzymasz SMS-em</li>
              <li style={listItem}>W razie pytań - odpowiedz na tego maila</li>
            </ul>

            <Text style={paragraph}>
              Dziękujemy za wybór Starkit i życzymy udanego wynajmu!
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

export default OrderConfirmedEmail;

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

const totalRow = {
  borderTop: "2px solid #e5e5e5",
};

const totalLabel = {
  color: "#000",
  fontSize: "15px",
  fontWeight: "700",
  padding: "12px 0 8px",
  width: "45%",
};

const totalValue = {
  color: "#000",
  fontSize: "15px",
  fontWeight: "700",
  padding: "12px 0 8px",
};

const infoBoxText = {
  color: "#666",
  fontSize: "13px",
  lineHeight: "1.5",
  margin: "12px 0 0",
  fontStyle: "italic" as const,
};

const depositBox = {
  backgroundColor: "#fffbeb",
  border: "1px solid #fbbf24",
  borderLeft: "4px solid #fbbf24",
  borderRadius: "6px",
  padding: "16px",
  margin: "24px 0",
};

const depositText = {
  color: "#92400e",
  fontSize: "14px",
  lineHeight: "1.5",
  margin: "0",
};

const attachmentBox = {
  backgroundColor: "#f0f9ff",
  border: "1px solid #3b82f6",
  borderLeft: "4px solid #3b82f6",
  borderRadius: "6px",
  padding: "16px",
  margin: "24px 0",
};

const attachmentText = {
  color: "#1e40af",
  fontSize: "14px",
  lineHeight: "1.5",
  margin: "0",
};

const list = {
  margin: "16px 0",
  paddingLeft: "20px",
};

const listItem = {
  color: "#333",
  fontSize: "15px",
  lineHeight: "1.6",
  margin: "8px 0",
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
