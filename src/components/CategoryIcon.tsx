import {
  Hammer, HardHat, Sparkles, PartyPopper, Laptop, Lightbulb,
  Camera, UtensilsCrossed, GraduationCap, Palette, Megaphone,
  Stethoscope, Truck, Scale, Car, Wheat, Music, Shirt, Home,
  ShieldCheck, Factory, Leaf, Plane, Building2, Brush, Briefcase,
  PawPrint, Dumbbell, Zap, Printer, Wifi, SprayCan, Disc3,
  FolderOpen, type LucideIcon
} from 'lucide-react';

const iconMap: Record<string, LucideIcon> = {
  Hammer, HardHat, Sparkles, PartyPopper, Laptop, Lightbulb,
  Camera, UtensilsCrossed, GraduationCap, Palette, Megaphone,
  Stethoscope, Truck, Scale, Car, Wheat, Music, Shirt, Home,
  ShieldCheck, Factory, Leaf, Plane, Building2, Brush, Briefcase,
  PawPrint, Dumbbell, Zap, Printer, Wifi, SprayCan, Disc3,
};

export default function CategoryIcon({ name, size = 24, className = '' }: { name: string; size?: number; className?: string }) {
  const Icon = iconMap[name] ?? FolderOpen;
  return <Icon size={size} className={className} />;
}
