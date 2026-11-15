declare module "lucide-react" {
  export const Heart: any;
  export const Pill: any;
  export const Calendar: any;
  export const Users: any;
  export const LogOut: any;
  export const Menu: any;
  export const X: any;
  export const ShieldCheck: any;
  export const Sparkles: any;
  export const ChevronDown: any;
  export const ChevronRight: any;
  export const CheckCircle: any;
  export const CheckCircle2: any;
  export const Clock: any;
  export const AlertCircle: any;
  export const Utensils: any;
  export const XCircle: any;
  export const HelpCircle: any;
  export const MapPin: any;
  export const Phone: any;
  export const UserCheck: any;
  export const AlertTriangle: any;
  export const Award: any;
  export const TrendingUp: any;
  export const UserPlus: any;
  export const HeartHandshake: any;
  export const Key: any;
  export const PhoneCall: any;
  export const Shield: any;
  export const ShieldAlert: any;
  export const Printer: any;
  export const CalendarPlus: any;
  export const HeartPulse: any;
  export const ExternalLink: any;
  export const ArrowRight: any;
  export const ArrowLeft: any;
  export const Lock: any;
  export const Eye: any;
  export const FileText: any;
  export const Mail: any;
  export const User: any;
  export const Stethoscope: any;
  export const Copy: any;
  export const Check: any;
  export const Plus: any;
  const anyIcon: any;
  export default anyIcon;
}

declare module "firebase/firestore" {
  export interface Firestore {
    type: string;
    app: any;
  }
  export function getFirestore(app?: any): Firestore;
  export function collection(...args: any[]): any;
  export function doc(...args: any[]): any;
  export function getDoc(...args: any[]): Promise<any>;
  export function getDocs(...args: any[]): Promise<any>;
  export function setDoc(...args: any[]): Promise<any>;
  export function updateDoc(...args: any[]): Promise<any>;
  export function deleteDoc(...args: any[]): Promise<any>;
  export function query(...args: any[]): any;
  export function where(...args: any[]): any;
  export function orderBy(...args: any[]): any;
  export function limit(...args: any[]): any;
  export function onSnapshot(...args: any[]): any;
  export function serverTimestamp(): any;
  export function Timestamp(): any;
}
