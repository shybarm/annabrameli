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

interface SignupEmailProps {
  siteName: string
  siteUrl: string
  recipient: string
  confirmationUrl: string
}

export const SignupEmail = ({
  siteName,
  siteUrl,
  recipient,
  confirmationUrl,
}: SignupEmailProps) => (
  <Html lang="he" dir="rtl">
    <Head />
    <Preview>אישור כתובת המייל שלך - {siteName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>אישור כתובת המייל</Heading>
        <Text style={text}>
          תודה שנרשמת ל-
          <Link href={siteUrl} style={link}>
            <strong>{siteName}</strong>
          </Link>
          .
        </Text>
        <Text style={text}>
          כדי להשלים את הרישום, נא לאשר את כתובת המייל (
          <Link href={`mailto:${recipient}`} style={link}>
            {recipient}
          </Link>
          ) באמצעות הכפתור למטה:
        </Text>
        <Button style={button} href={confirmationUrl}>
          אישור כתובת מייל
        </Button>
        <Text style={footer}>
          אם לא יצרת חשבון, ניתן להתעלם מהודעה זו.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default SignupEmail

const main = { backgroundColor: '#ffffff', fontFamily: 'Assistant, Arial, sans-serif' }
const container = { padding: '24px 28px', maxWidth: '560px' }
const h1 = {
  fontSize: '22px',
  fontWeight: 'bold' as const,
  color: '#1f1a1d',
  margin: '0 0 20px',
}
const text = {
  fontSize: '15px',
  color: '#55575d',
  lineHeight: '1.6',
  margin: '0 0 20px',
}
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
