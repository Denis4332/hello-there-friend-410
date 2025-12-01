import { Phone, MessageCircle, Mail, Globe, Send } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAnalytics } from "@/hooks/useAnalytics";

interface ContactSectionProps {
  phone?: string;
  whatsapp?: string;
  email?: string;
  website?: string;
  telegram?: string;
  instagram?: string;
  profileId?: string;
}

export const ContactSection = ({
  phone,
  whatsapp,
  email,
  website,
  telegram,
  instagram,
  profileId,
}: ContactSectionProps) => {
  const { trackContactClick } = useAnalytics();
  
  // Check if at least one contact method is available
  const hasContact = phone || whatsapp || email || website || telegram || instagram;

  if (!hasContact) {
    return null;
  }

  const formatPhoneUrl = (number: string) => {
    // Remove all non-digit characters except +
    let cleaned = number.replace(/[^\d+]/g, "");
    
    // If starts with +, keep as-is (already international)
    if (cleaned.startsWith("+")) {
      return `tel:${cleaned}`;
    }
    // If starts with 00, replace with + (international prefix)
    if (cleaned.startsWith("00")) {
      return `tel:+${cleaned.substring(2)}`;
    }
    // If starts with 0, it's a Swiss number without country code
    // Remove leading 0 and add +41 (Switzerland)
    if (cleaned.startsWith("0")) {
      return `tel:+41${cleaned.substring(1)}`;
    }
    // If starts with 41 already, add +
    if (cleaned.startsWith("41")) {
      return `tel:+${cleaned}`;
    }
    // Otherwise return as-is with tel:
    return `tel:${cleaned}`;
  };

  const formatWhatsAppUrl = (number: string) => {
    // Remove all non-digit characters except +
    let cleaned = number.replace(/[^\d+]/g, "");
    
    // If starts with +, just remove it (already international)
    if (cleaned.startsWith("+")) {
      cleaned = cleaned.substring(1);
    }
    // If starts with 00, remove the 00 (international prefix)
    else if (cleaned.startsWith("00")) {
      cleaned = cleaned.substring(2);
    }
    // If starts with 0, it's a Swiss number without country code
    // Remove the leading 0 and add 41 (Switzerland)
    else if (cleaned.startsWith("0")) {
      cleaned = "41" + cleaned.substring(1);
    }
    // If starts with 41 already or some other number, keep as-is
    
    return `https://wa.me/${cleaned}`;
  };

  const formatTelegramUrl = (username: string) => {
    const cleanUsername = username.replace("@", "");
    return `https://t.me/${cleanUsername}`;
  };

  const formatInstagramUrl = (username: string) => {
    const cleanUsername = username.replace("@", "");
    return `https://instagram.com/${cleanUsername}`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Kontakt</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {phone && (
          <Button
            variant="outline"
            className="w-full justify-start"
            asChild
          >
            <a 
              href={formatPhoneUrl(phone)}
              onClick={() => profileId && trackContactClick(profileId, 'phone')}
            >
              <Phone className="mr-2 h-4 w-4" />
              {phone}
            </a>
          </Button>
        )}

        {whatsapp && (
          <Button
            variant="outline"
            className="w-full justify-start"
            asChild
          >
            <a 
              href={formatWhatsAppUrl(whatsapp)} 
              target="_blank" 
              rel="noopener noreferrer"
              onClick={() => profileId && trackContactClick(profileId, 'whatsapp')}
            >
              <MessageCircle className="mr-2 h-4 w-4" />
              WhatsApp: {whatsapp}
            </a>
          </Button>
        )}

        {email && (
          <Button
            variant="outline"
            className="w-full justify-start"
            asChild
          >
            <a 
              href={`mailto:${email}`}
              onClick={() => profileId && trackContactClick(profileId, 'email')}
            >
              <Mail className="mr-2 h-4 w-4" />
              {email}
            </a>
          </Button>
        )}

        {website && (
          <Button
            variant="outline"
            className="w-full justify-start"
            asChild
          >
            <a 
              href={website} 
              target="_blank" 
              rel="noopener noreferrer"
              onClick={() => profileId && trackContactClick(profileId, 'website')}
            >
              <Globe className="mr-2 h-4 w-4" />
              Website
            </a>
          </Button>
        )}

        {telegram && (
          <Button
            variant="outline"
            className="w-full justify-start"
            asChild
          >
            <a 
              href={formatTelegramUrl(telegram)} 
              target="_blank" 
              rel="noopener noreferrer"
              onClick={() => profileId && trackContactClick(profileId, 'telegram')}
            >
              <Send className="mr-2 h-4 w-4" />
              Telegram: {telegram}
            </a>
          </Button>
        )}

        {instagram && (
          <Button
            variant="outline"
            className="w-full justify-start"
            asChild
          >
            <a 
              href={formatInstagramUrl(instagram)} 
              target="_blank" 
              rel="noopener noreferrer"
              onClick={() => profileId && trackContactClick(profileId, 'instagram')}
            >
              <svg
                className="mr-2 h-4 w-4"
                fill="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
              </svg>
              Instagram: {instagram}
            </a>
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
