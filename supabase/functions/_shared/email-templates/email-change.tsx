/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface EmailChangeEmailProps {
  siteName: string
  oldEmail: string
  email: string
  newEmail: string
  confirmationUrl: string
}

export const EmailChangeEmail = ({
  siteName,
  oldEmail,
  newEmail,
  confirmationUrl,
}: EmailChangeEmailProps) => (
  <Html lang="he" dir="rtl">
    <Head />
    <Preview>אישור שינוי כתובת מייל - {siteName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>אישור שינוי כתובת מייל</Heading>
        <Text style={text}>
          התקבלה בקשה לשינוי כתובת המייל בחשבון שלך ב-{siteName} מ-
          <Link href={`mailto:${oldEmail}`} style={link}>
            {oldEmail}
          </Link>{' '}
          ל-
          <Link href={`mailto:${newEmail}`} style={link}>
            {newEmail}
          </Link>
          .
        </Text>
        <Text style={text}>לאישור השינוי, לחצו על הכפתור למטה:</Text>
        <Button style={button} href={confirmationUrl}>
          אישור שינוי המייל
        </Button>
        <Text style={footer}>
          אם לא ביקשת לשנות את כתובת המייל, מומלץ לאבטח את החשבון מיד.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default EmailChangeEmail

const main = { backgroundColor: '#ffffff', fontFamily: 'Assistant, Arial, sans-serif' }
const container = { padding: '24px 28px', maxWidth: '560px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#1f1a1d', margin: '0 0 20px' }
const text = { fontSize: '15px', color: '#55575d', lineHeight: '1.6', margin: '0 0 20px' }
const link = { color: '#b88aa3', textDecoration: 'underline' }
const button = {
  backgroundColor: '#b88aa3',
  color: '#ffffff',
  fontSize: '15px',
  borderRadius: '12px',
  padding: '12px 24px',
  textDecoration: 'none',
  fontWeight: '600' as const,
}
const footer = { fontSize: '12px', color: '#999999', margin: '30px 0 0' }
