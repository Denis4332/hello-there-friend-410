import { Phone, MessageCircle, Mail, Globe, Send, Eye } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface ContactSectionProps {
  phone?: string;
  whatsapp?: string;
  email?: string;
  website?: string;
  telegram?: string;
  instagram?: string;
}

export const ContactSection = ({
  phone,
  whatsapp,
  email,
  website,
  telegram,
  instagram,
}: ContactSectionProps) => {
  const [isVisible, setIsVisible] = useState(false);
  
  // Check if at least one contact method is available
  const hasContact = phone || whatsapp || email || website || telegram || instagram;

  if (!hasContact) {
    return null;
  }

  const formatWhatsAppUrl = (number: string) => {
    // Remove all non-digit characters
    const cleaned = number.replace(/\D/g, "");
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
        {!isVisible ? (
          <Button 
            onClick={() => setIsVisible(true)} 
            className="w-full"
            size="lg"
          >
            <Eye className="mr-2 h-4 w-4" />
            Kontakt anzeigen
          </Button>
        ) : (
          <>
            {phone && (
          <Button
            variant="outline"
            className="w-full justify-start"
            asChild
          >
            <a href={`tel:${phone}`}>
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
            <a href={formatWhatsAppUrl(whatsapp)} target="_blank" rel="noopener noreferrer">
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
            <a href={`mailto:${email}`}>
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
            <a href={website} target="_blank" rel="noopener noreferrer">
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
            <a href={formatTelegramUrl(telegram)} target="_blank" rel="noopener noreferrer">
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
            <a href={formatInstagramUrl(instagram)} target="_blank" rel="noopener noreferrer">
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
          </>
        )}
      </CardContent>
    </Card>
  );
};
