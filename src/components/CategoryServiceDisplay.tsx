import React from 'react';
import { getCategoryTemplate, getCategoryFields, getServicePresentation } from '@/data/category-templates';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Star, MapPin, Clock, Calendar, Users, Award, Shield, CheckCircle } from 'lucide-react';

interface CategoryServiceDisplayProps {
  categorySlug: string;
  providerData: any;
  onContact?: () => void;
  onBook?: () => void;
}

export default function CategoryServiceDisplay({ 
  categorySlug, 
  providerData, 
  onContact, 
  onBook 
}: CategoryServiceDisplayProps) {
  const template = getCategoryTemplate(categorySlug);
  
  if (!template) {
    return <DefaultServiceDisplay providerData={providerData} onContact={onContact} onBook={onBook} />;
  }

  const presentation = template.servicePresentation;
  const highlightFields = presentation.highlightFields;
  
  // Extraire les valeurs des champs mis en avant
  const getFieldValue = (fieldId: string) => {
    return providerData[fieldId] || providerData[fieldId.replace('_', '')] || null;
  };

  const formatServiceDescription = () => {
    let description = presentation.serviceTemplate;
    highlightFields.forEach(field => {
      const value = getFieldValue(field);
      if (value) {
        const displayValue = Array.isArray(value) ? value.join(', ') : value;
        description = description.replace(`{${field}}`, displayValue);
      }
    });
    return description;
  };

  const renderVisualIndicators = () => {
    return presentation.visualIndicators.map((indicator, index) => {
      switch (indicator) {
        case 'certifications':
          return providerData.certifications && providerData.certifications.length > 0 ? (
            <Badge key={index} variant="secondary" className="flex items-center gap-1">
              <Award className="w-3 h-3" />
              {providerData.certifications.length} certifications
            </Badge>
          ) : null;
        case 'portfolio':
          return providerData.portfolio_count > 0 ? (
            <Badge key={index} variant="secondary" className="flex items-center gap-1">
              <Star className="w-3 h-3" />
              {providerData.portfolio_count} projets
            </Badge>
          ) : null;
        case 'reviews':
          return providerData.rating_count > 0 ? (
            <Badge key={index} variant="secondary" className="flex items-center gap-1">
              <Star className="w-3 h-3" />
              {providerData.rating_avg.toFixed(1)} ({providerData.rating_count} avis)
            </Badge>
          ) : null;
        case 'before_after':
          return providerData.has_before_after ? (
            <Badge key={index} variant="secondary" className="flex items-center gap-1">
              <CheckCircle className="w-3 h-3" />
              Avant/Après
            </Badge>
          ) : null;
        case 'github':
          return providerData.github_url ? (
            <Badge key={index} variant="secondary" className="flex items-center gap-1">
              <CheckCircle className="w-3 h-3" />
              GitHub
            </Badge>
          ) : null;
        case 'linkedin':
          return providerData.linkedin_url ? (
            <Badge key={index} variant="secondary" className="flex items-center gap-1">
              <CheckCircle className="w-3 h-3" />
              LinkedIn
            </Badge>
          ) : null;
        case 'insurance':
          return providerData.insurance && providerData.insurance.length > 0 ? (
            <Badge key={index} variant="secondary" className="flex items-center gap-1">
              <Shield className="w-3 h-3" />
              Assuré
            </Badge>
          ) : null;
        case 'emergency':
          return providerData.emergency_service === 'Oui 24/7' || providerData.emergency_service === 'Oui horaires étendus' ? (
            <Badge key={index} variant="destructive" className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Urgence
            </Badge>
          ) : null;
        default:
          return null;
      }
    }).filter(Boolean);
  };

  const renderLayout = () => {
    switch (presentation.layout) {
      case 'gallery':
        return <GalleryLayout providerData={providerData} template={template} />;
      case 'list':
        return <ListLayout providerData={providerData} template={template} />;
      case 'timeline':
        return <TimelineLayout providerData={providerData} template={template} />;
      case 'calendar':
        return <CalendarLayout providerData={providerData} template={template} />;
      default:
        return <CardsLayout providerData={providerData} template={template} />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header avec description formatée */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl">{providerData.business_name}</CardTitle>
              <p className="text-muted-foreground mt-2">{formatServiceDescription()}</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              {renderVisualIndicators()}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            {onContact && (
              <Button variant="outline" onClick={onContact}>
                Contacter
              </Button>
            )}
            {onBook && (
              <Button onClick={onBook}>
                Réserver
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Layout principal */}
      {renderLayout()}

      {/* Sections spécifiques à la catégorie */}
      <div className="space-y-4">
        {template.sectionOrder.map(section => {
          if (!template.sections.includes(section)) return null;
          return <CategorySection key={section} section={section} providerData={providerData} template={template} />;
        })}
      </div>
    </div>
  );
}

// Layout pour affichage en grille
function CardsLayout({ providerData, template }: { providerData: any; template: any }) {
  const fields = template.fields.filter(f => providerData[f.id]);
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {fields.map(field => (
        <Card key={field.id}>
          <CardHeader>
            <CardTitle className="text-sm">{field.label}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">
              {Array.isArray(providerData[field.id]) 
                ? providerData[field.id].join(', ') 
                : providerData[field.id]}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Layout pour affichage en galerie
function GalleryLayout({ providerData, template }: { providerData: any; template: any }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {providerData.portfolio?.slice(0, 8).map((item: any, index: number) => (
        <div key={index} className="aspect-square bg-muted rounded-lg overflow-hidden">
          {item.photos?.[0] && (
            <img 
              src={item.photos[0]} 
              alt={item.title} 
              className="w-full h-full object-cover hover:scale-105 transition-transform"
            />
          )}
        </div>
      ))}
    </div>
  );
}

// Layout pour affichage en liste
function ListLayout({ providerData, template }: { providerData: any; template: any }) {
  const fields = template.fields.filter(f => providerData[f.id]);
  
  return (
    <div className="space-y-3">
      {fields.map(field => (
        <div key={field.id} className="flex justify-between items-center p-3 bg-muted rounded-lg">
          <span className="font-medium">{field.label}</span>
          <span className="text-sm">
            {Array.isArray(providerData[field.id]) 
              ? providerData[field.id].join(', ') 
              : providerData[field.id]}
          </span>
        </div>
      ))}
    </div>
  );
}

// Layout pour affichage en timeline
function TimelineLayout({ providerData, template }: { providerData: any; template: any }) {
  return (
    <div className="space-y-4">
      {providerData.experience?.map((exp: any, index: number) => (
        <div key={index} className="flex gap-4">
          <div className="flex flex-col items-center">
            <div className="w-3 h-3 bg-primary rounded-full" />
            {index < providerData.experience.length - 1 && (
              <div className="w-0.5 h-full bg-border" />
            )}
          </div>
          <Card className="flex-1">
            <CardHeader>
              <CardTitle className="text-base">{exp.title}</CardTitle>
              <p className="text-sm text-muted-foreground">{exp.period}</p>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{exp.description}</p>
            </CardContent>
          </Card>
        </div>
      ))}
    </div>
  );
}

// Layout pour affichage en calendrier
function CalendarLayout({ providerData, template }: { providerData: any; template: any }) {
  return (
    <div className="grid grid-cols-7 gap-2">
      {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(day => (
        <div key={day} className="text-center text-sm font-medium p-2">
          {day}
        </div>
      ))}
      {Array.from({ length: 28 }).map((_, index) => (
        <div key={index} className="aspect-square border rounded-md p-2 hover:bg-muted cursor-pointer">
          <span className="text-sm">{index + 1}</span>
        </div>
      ))}
    </div>
  );
}

// Section spécifique à la catégorie
function CategorySection({ section, providerData, template }: { section: string; providerData: any; template: any }) {
  switch (section) {
    case 'certifications':
      return providerData.certifications?.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="w-5 h-5" />
              Certifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {providerData.certifications.map((cert: string, index: number) => (
                <Badge key={index} variant="secondary">{cert}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null;
    
    case 'reviews':
      return providerData.reviews?.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="w-5 h-5" />
              Avis clients
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {providerData.reviews.slice(0, 3).map((review: any, index: number) => (
                <div key={index} className="border-b pb-3 last:border-0">
                  <div className="flex items-center gap-2 mb-2">
                    <StarRating rating={review.rating} />
                    <span className="text-sm text-muted-foreground">{review.date}</span>
                  </div>
                  <p className="text-sm">{review.comment}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null;
    
    case 'portfolio':
      return providerData.portfolio?.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Portfolio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <GalleryLayout providerData={providerData} template={template} />
          </CardContent>
        </Card>
      ) : null;
    
    default:
      return null;
  }
}

// Affichage par défaut pour les catégories sans template
function DefaultServiceDisplay({ providerData, onContact, onBook }: { providerData: any; onContact?: () => void; onBook?: () => void }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{providerData.business_name}</CardTitle>
        <p className="text-muted-foreground">{providerData.headline}</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {providerData.description && (
            <p className="text-sm">{providerData.description}</p>
          )}
          
          {providerData.skills?.length > 0 && (
            <div>
              <h4 className="font-medium mb-2">Compétences</h4>
              <div className="flex flex-wrap gap-2">
                {providerData.skills.map((skill: string, index: number) => (
                  <Badge key={index} variant="secondary">{skill}</Badge>
                ))}
              </div>
            </div>
          )}
          
          {providerData.price_range && (
            <div>
              <h4 className="font-medium mb-2">Tarifs</h4>
              <p className="text-sm">{providerData.price_range}</p>
            </div>
          )}
          
          <div className="flex gap-3">
            {onContact && (
              <Button variant="outline" onClick={onContact}>
                Contacter
              </Button>
            )}
            {onBook && (
              <Button onClick={onBook}>
                Réserver
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Composant StarRating simple
function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex">
      {[1, 2, 3, 4, 5].map(star => (
        <Star
          key={star}
          className={`w-4 h-4 ${star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
        />
      ))}
    </div>
  );
}