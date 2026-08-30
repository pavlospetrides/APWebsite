export const siteConfig = {
  businessName: process.env.NEXT_PUBLIC_BUSINESS_NAME || 'AP Electrical Services',
  ownerName: 'Άντης Πετρίδης',
  phone: process.env.NEXT_PUBLIC_PHONE_NUMBER || '[PHONE_NUMBER]',
  email: process.env.NEXT_PUBLIC_EMAIL_ADDRESS || '[EMAIL_ADDRESS]',
  serviceArea: process.env.NEXT_PUBLIC_SERVICE_AREA || '[SERVICE_AREA]',
  whatsapp: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '[WHATSAPP_NUMBER]',
  url: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
} as const;

export const contactHref = {
  phone: `tel:${siteConfig.phone}`,
  email: `mailto:${siteConfig.email}`,
  whatsapp: siteConfig.whatsapp.startsWith('[')
    ? null
    : `https://wa.me/${siteConfig.whatsapp.replace(/\D/g, '')}`,
};
