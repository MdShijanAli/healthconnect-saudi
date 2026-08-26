import {
  Baby,
  Bone,
  Brain,
  Ear,
  Eye,
  Flower2,
  HeartPulse,
  Microscope,
  Pill,
  ShieldCheck,
  Smile,
  Sparkles,
  Stethoscope,
  Syringe,
  Users,
  Activity,
  type LucideIcon,
} from "lucide-react";

export const specializationIcons = {
  Stethoscope,
  Baby,
  HeartPulse,
  Sparkles,
  Smile,
  Bone,
  Flower2,
  Brain,
  Eye,
  Ear,
  Pill,
  Syringe,
  Microscope,
  Activity,
  ShieldCheck,
  Users,
} satisfies Record<string, LucideIcon>;

export type SpecializationIconName = keyof typeof specializationIcons;

export const specializationIconNames = Object.keys(specializationIcons) as SpecializationIconName[];

export function getSpecializationIcon(name: string): LucideIcon {
  return specializationIcons[name as SpecializationIconName] ?? Stethoscope;
}
