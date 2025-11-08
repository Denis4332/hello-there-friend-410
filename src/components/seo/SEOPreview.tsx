import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Monitor, Facebook, Twitter } from 'lucide-react';

interface SEOPreviewProps {
  title: string;
  description: string;
  url?: string;
  image?: string;
}

export const SEOPreview = ({ title, description, url = 'https://escoria.ch', image }: SEOPreviewProps) => {
  const titleLength = title.length;
  const descLength = description.length;
  
  const titleWarning = titleLength > 60 ? 'text-destructive' : titleLength < 30 ? 'text-yellow-500' : 'text-green-500';
  const descWarning = descLength > 160 ? 'text-destructive' : descLength < 120 ? 'text-yellow-500' : 'text-green-500';

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">SEO Preview</h3>
      
      {/* Character Counter */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Title Länge</p>
          <p className={`text-2xl font-bold ${titleWarning}`}>{titleLength}/60</p>
          {titleLength > 60 && <p className="text-xs text-destructive">Zu lang - wird abgeschnitten</p>}
          {titleLength < 30 && <p className="text-xs text-yellow-500">Zu kurz - nutze mehr Platz</p>}
        </div>
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Description Länge</p>
          <p className={`text-2xl font-bold ${descWarning}`}>{descLength}/160</p>
          {descLength > 160 && <p className="text-xs text-destructive">Zu lang - wird abgeschnitten</p>}
          {descLength < 120 && <p className="text-xs text-yellow-500">Zu kurz - nutze mehr Platz</p>}
        </div>
      </div>

      {/* Preview Tabs */}
      <Tabs defaultValue="google" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="google">
            <Monitor className="h-4 w-4 mr-2" />
            Google
          </TabsTrigger>
          <TabsTrigger value="facebook">
            <Facebook className="h-4 w-4 mr-2" />
            Facebook
          </TabsTrigger>
          <TabsTrigger value="twitter">
            <Twitter className="h-4 w-4 mr-2" />
            Twitter
          </TabsTrigger>
        </TabsList>

        <TabsContent value="google" className="mt-4">
          <div className="border rounded-lg p-4 bg-background">
            <div className="text-xs text-green-600 mb-1">{url}</div>
            <div className="text-xl text-blue-600 mb-1 hover:underline cursor-pointer">
              {title.substring(0, 60)}{titleLength > 60 && '...'}
            </div>
            <div className="text-sm text-muted-foreground">
              {description.substring(0, 160)}{descLength > 160 && '...'}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="facebook" className="mt-4">
          <div className="border rounded-lg overflow-hidden bg-background">
            {image && (
              <div className="w-full h-48 bg-muted flex items-center justify-center">
                <img src={image} alt="Preview" className="w-full h-full object-cover" />
              </div>
            )}
            <div className="p-4">
              <div className="text-xs text-muted-foreground mb-1">{url}</div>
              <div className="font-semibold text-lg mb-1">{title}</div>
              <div className="text-sm text-muted-foreground line-clamp-2">{description}</div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="twitter" className="mt-4">
          <div className="border rounded-lg overflow-hidden bg-background">
            {image && (
              <div className="w-full h-48 bg-muted flex items-center justify-center">
                <img src={image} alt="Preview" className="w-full h-full object-cover" />
              </div>
            )}
            <div className="p-4">
              <div className="font-semibold mb-1">{title}</div>
              <div className="text-sm text-muted-foreground line-clamp-2 mb-2">{description}</div>
              <div className="text-xs text-muted-foreground">{url}</div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </Card>
  );
};
