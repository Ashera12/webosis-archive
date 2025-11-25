// Icon mapping untuk setiap sekbid dengan React Icons
import { IconType } from 'react-icons';
import { 
  FaMosque, 
  FaUsers, 
  FaBook, 
  FaHandHoldingHeart, 
  FaPalette, 
  FaCamera,
  FaQuran,
  FaUserGraduate,
  FaFlask,
  FaHeart,
  FaTheaterMasks,
  FaBullhorn
} from 'react-icons/fa';

export interface SekbidIcon {
  id: number;
  name: string;
  icon: IconType;
  color: string;
  bgColor: string;
  description: string;
}

export const SEKBID_ICONS: Record<number, SekbidIcon> = {
  1: {
    id: 1,
    name: 'Kerohanian',
    icon: FaMosque,
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    description: 'Program kerohanian dan keagamaan',
  },
  2: {
    id: 2,
    name: 'Kaderisasi',
    icon: FaUsers,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    description: 'Pengembangan kepemimpinan dan kaderisasi',
  },
  3: {
    id: 3,
    name: 'Keilmuan',
    icon: FaBook,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
    description: 'Program akademik dan pengembangan ilmu',
  },
  4: {
    id: 4,
    name: 'Sosial & Kesehatan',
    icon: FaHandHoldingHeart,
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    description: 'Kegiatan sosial dan kesehatan',
  },
  5: {
    id: 5,
    name: 'Seni & Olahraga',
    icon: FaPalette,
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
    description: 'Pengembangan seni, budaya, dan olahraga',
  },
  6: {
    id: 6,
    name: 'Humas & Dokumentasi',
    icon: FaCamera,
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-100',
    description: 'Dokumentasi dan hubungan masyarakat',
  },
};

// Alternative icons (dapat dipilih sesuai kebutuhan)
export const ALTERNATIVE_ICONS = {
  kerohanian: [FaMosque, FaQuran],
  kaderisasi: [FaUsers, FaUserGraduate],
  keilmuan: [FaBook, FaFlask],
  sosial: [FaHandHoldingHeart, FaHeart],
  seni: [FaPalette, FaTheaterMasks],
  humas: [FaCamera, FaBullhorn],
};

// Get icon for specific sekbid
export function getSekbidIcon(sekbidId: number): SekbidIcon | null {
  return SEKBID_ICONS[sekbidId] || null;
}

// Get all icons
export function getAllSekbidIcons(): SekbidIcon[] {
  return Object.values(SEKBID_ICONS);
}

// Get icon component
export function getSekbidIconComponent(sekbidId: number): IconType {
  const sekbid = SEKBID_ICONS[sekbidId];
  return sekbid?.icon || FaUsers; // Default fallback
}
