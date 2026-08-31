export const siteConfig = {
  businessName: process.env.NEXT_PUBLIC_BUSINESS_NAME || 'AP Electrical Services',
  ownerName: 'Άντης Πετρίδης',
  phone: process.env.NEXT_PUBLIC_PHONE_NUMBER || '+357 96 680304',
  email: process.env.NEXT_PUBLIC_EMAIL_ADDRESS || 'pavlospetrides741@gmail.com',
  serviceArea: process.env.NEXT_PUBLIC_SERVICE_AREA || 'Cyprus-wide',
  whatsapp: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '+357 96 680304',
  url: process.env.NEXT_PUBLIC_SITE_URL || 'https://apetrides.com',
} as const;

export const contactHref = {
  phone: `tel:${siteConfig.phone}`,
  email: `mailto:${siteConfig.email}`,
  whatsapp: siteConfig.whatsapp.startsWith('[')
    ? null
    : `https://wa.me/${siteConfig.whatsapp.replace(/\D/g, '')}`,
};
