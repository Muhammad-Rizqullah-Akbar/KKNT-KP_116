import React from "react"
import {
  // ===== Dashboard & Navigation =====
  LayoutDashboard,
  FilePlus,
  ClipboardList,
  Users,
  Building2,
  Landmark,
  Briefcase,
  BookOpen,
  BarChart3,
  Settings,
  LogOut,
  Bell,
  HelpCircle,
  Menu,
  Search,
  Plus,
  Pencil,
  Eye,
  Trash2,
  ChevronLeft,
  ChevronRight,
  X,
  Hexagon,
  FileText,
  CheckCircle,
  Edit,
  TrendingUp,
  Tag,
  Sparkles,
  Link2,
  Zap,
  Gem,
  Rocket,
  Globe,
  Calendar,
  Clock,
  User,
  ArrowLeft,
  ArrowRight,
  Send,
  Save,
  Image as ImageIcon,
  Cpu,
  PiggyBank,
  BadgeCheck,
  Database,
  ShieldCheck,
  Crown,
  RefreshCw,
  Printer,
  PieChart,
  Radar,
  Hash,
  Download,
  Link,
  ListOrdered,
  Underline,
  Italic,
  Bold,
  MapPin,
  Mail,
  Share2,
  RotateCcw,
  Wallet,
  UserCog,
  Info,
  AlertCircle,
  Check,
  Loader,
  Move,
  // ===== Form Builder =====
  GripVertical,
  ArrowUp,
  ArrowDown,
  Copy,
  List,
  CheckSquare,
  ToggleLeft,
  Table,
  Type,
  AlignLeft,
  Grid,
  Grid3x3,
  Star,
  Sliders,
  Upload,
  Heading,
  Layout,
  LayoutDashboard as LayoutIcon,
  CircleDot,
  ChevronDown,
  ListChecks,
  Phone,
  Calendar as CalendarIcon,
  Mail as MailIcon,
  Hash as HashIcon,
  // ===== Tambahan Icon Umum =====
  Filter,
  Folder,
  ArrowUpRight,
  SlidersHorizontal,
  FolderOpen,
  FolderClosed,
  Share,
  ExternalLink,
  File,
  FileImage,
  FileQuestion,
  FileSpreadsheet,
  Home,
  HomeIcon,
  MenuIcon,
  MoreHorizontal,
  MoreVertical,
  PlusCircle,
  MinusCircle,
  XCircle,
  CheckCircle2,
  AlertTriangle,
  InfoIcon,
  HelpCircleIcon,
  Loader2,
  RefreshCwIcon,
  RotateCw,
  RotateCcwIcon,
  ZoomIn,
  ZoomOut,
  Maximize,
  Minimize,
  Play,
  Pause,
  StopCircle,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  Camera,
  Video,
  Monitor,
  Smartphone,
  Tablet,
  Laptop,
  Server,
  Cloud,
  CloudOff,
  Wifi,
  WifiOff,
  Bluetooth,
  Battery,
  BatteryCharging,
  Power,
  PowerOff,
  LucideProps,
} from "lucide-react"

// ==========================================
// Custom SVG Components untuk Brand / Social Media
// (Dikarenakan lucide-react tidak lagi menyediakan brand icons)
// ==========================================

const InstagramIcon = React.forwardRef<SVGSVGElement, LucideProps>(
  ({ className = "", size = 20, ...props }, ref) => (
    <svg
      ref={ref}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  )
)
InstagramIcon.displayName = "InstagramIcon"

const TikTokIcon = React.forwardRef<SVGSVGElement, LucideProps>(
  ({ className = "", size = 20, ...props }, ref) => (
    <svg
      ref={ref}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      {...props}
    >
      <path d="M12.525 2.015a.056.056 0 0 0-.056.056v3.136a.056.056 0 0 0 .056.056 4.39 4.39 0 0 0 3.125 1.31 4.42 4.42 0 0 0 1.258-.182.056.056 0 0 0 .04-.054V3.195a.056.056 0 0 0-.071-.054 6.74 6.74 0 0 1-1.378-.142 6.79 6.79 0 0 1-3.03-1.038.057.057 0 0 0-.084.054v.001zm-3.136 0a.056.056 0 0 0-.056.056v13.568c0 1.83-1.49 3.32-3.32 3.32a3.32 3.32 0 0 1-3.32-3.32 3.32 3.32 0 0 1 3.32-3.32c.39 0 .762.068 1.11.192a.056.056 0 0 0 .074-.047V9.328a.056.056 0 0 0-.044-.055 7.63 7.63 0 0 0-1.14-.086c-4.22 0-7.64 3.42-7.64 7.64 0 4.22 3.42 7.64 7.64 7.64 4.22 0 7.64-3.42 7.64-7.64V8.52a8.73 8.73 0 0 0 5.25 1.73v-3.3a.056.056 0 0 0-.056-.056 5.41 5.41 0 0 1-3.87-1.6 5.37 5.37 0 0 1-1.504-3.23.056.056 0 0 0-.056-.053h-3.136z" />
    </svg>
  )
)
TikTokIcon.displayName = "TikTokIcon"

const FacebookIcon = React.forwardRef<SVGSVGElement, LucideProps>(
  ({ className = "", size = 20, ...props }, ref) => (
    <svg
      ref={ref}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  )
)
FacebookIcon.displayName = "FacebookIcon"

const TwitterIcon = React.forwardRef<SVGSVGElement, LucideProps>(
  ({ className = "", size = 20, ...props }, ref) => (
    <svg
      ref={ref}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
    </svg>
  )
)
TwitterIcon.displayName = "TwitterIcon"

const LinkedinIcon = React.forwardRef<SVGSVGElement, LucideProps>(
  ({ className = "", size = 20, ...props }, ref) => (
    <svg
      ref={ref}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect width="4" height="12" x="2" y="9" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  )
)
LinkedinIcon.displayName = "LinkedinIcon"

const YoutubeIcon = React.forwardRef<SVGSVGElement, LucideProps>(
  ({ className = "", size = 20, ...props }, ref) => (
    <svg
      ref={ref}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.56 49.56 0 0 1-16.2 0A2 2 0 0 1 2.5 17" />
      <path d="m10 15 5-3-5-3z" />
    </svg>
  )
)
YoutubeIcon.displayName = "YoutubeIcon"

// ==========================================
// Object Export
// ==========================================

export const Icons = {
  // ===== Dashboard & Navigation =====
  dashboard: LayoutDashboard,
  filePlus: FilePlus,
  clipboardList: ClipboardList,
  users: Users,
  building: Building2,
  buildingLandmark: Landmark,
  briefcase: Briefcase,
  bookOpen: BookOpen,
  barChart: BarChart3,
  settings: Settings,
  logout: LogOut,
  bell: Bell,
  helpCircle: HelpCircle,
  menu: Menu,
  search: Search,
  plus: Plus,
  pencil: Pencil,
  eye: Eye,
  trash: Trash2,
  chevronLeft: ChevronLeft,
  chevronRight: ChevronRight,
  x: X,
  hexagon: Hexagon,
  fileText: FileText,
  checkCircle: CheckCircle,
  edit: Edit,
  trendingUp: TrendingUp,
  tag: Tag,
  sparkles: Sparkles,
  link2: Link2,
  zap: Zap,
  gem: Gem,
  rocket: Rocket,
  globe: Globe,
  calendar: Calendar,
  clock: Clock,
  user: User,
  arrowLeft: ArrowLeft,
  arrowRight: ArrowRight,
  send: Send,
  save: Save,
  image: ImageIcon,
  cpu: Cpu,
  piggyBank: PiggyBank,
  badgeCheck: BadgeCheck,
  database: Database,
  shieldCheck: ShieldCheck,
  crown: Crown,
  refreshCw: RefreshCw,
  printer: Printer,
  pieChart: PieChart,
  radar: Radar,
  hash: Hash,
  download: Download,
  link: Link,
  listOrdered: ListOrdered,
  underline: Underline,
  italic: Italic,
  bold: Bold,
  mapPin: MapPin,
  mail: Mail,
  share2: Share2,
  rotateCcw: RotateCcw,
  wallet: Wallet,
  userCog: UserCog,
  info: Info,
  alertCircle: AlertCircle,
  check: Check,
  loader: Loader,
  move: Move,

  // ===== Form Builder =====
  gripVertical: GripVertical,
  arrowUp: ArrowUp,
  arrowDown: ArrowDown,
  copy: Copy,
  list: List,
  checkSquare: CheckSquare,
  toggleLeft: ToggleLeft,
  table: Table,
  type: Type,
  alignLeft: AlignLeft,
  grid: Grid,
  grid3x3: Grid3x3,
  star: Star,
  slider: Sliders,
  upload: Upload,
  heading: Heading,
  layout: LayoutIcon,
  page: LayoutIcon,
  circleDot: CircleDot,
  chevronDown: ChevronDown,
  listChecks: ListChecks,
  phone: Phone,
  calendarIcon: CalendarIcon,
  mailIcon: MailIcon,
  hashIcon: HashIcon,

  // ===== Tambahan Icon Umum =====
  filter: Filter,
  folder: Folder,
  arrowUpRight: ArrowUpRight,
  filterAlt: SlidersHorizontal,
  folderOpen: FolderOpen,
  folderClosed: FolderClosed,
  share: Share,
  externalLink: ExternalLink,
  file: File,
  fileImage: FileImage,
  fileQuestion: FileQuestion,
  fileSpreadsheet: FileSpreadsheet,
  home: Home,
  homeIcon: HomeIcon,
  menuIcon: MenuIcon,
  moreHorizontal: MoreHorizontal,
  moreVertical: MoreVertical,
  plusCircle: PlusCircle,
  minusCircle: MinusCircle,
  xCircle: XCircle,
  checkCircle2: CheckCircle2,
  alertTriangle: AlertTriangle,
  infoIcon: InfoIcon,
  helpCircleIcon: HelpCircleIcon,
  loader2: Loader2,
  refreshCwIcon: RefreshCwIcon,
  rotateCw: RotateCw,
  rotateCcwIcon: RotateCcwIcon,
  zoomIn: ZoomIn,
  zoomOut: ZoomOut,
  maximize: Maximize,
  minimize: Minimize,
  play: Play,
  pause: Pause,
  stopCircle: StopCircle,
  volume2: Volume2,
  volumeX: VolumeX,
  mic: Mic,
  micOff: MicOff,
  camera: Camera,
  video: Video,
  monitor: Monitor,
  smartphone: Smartphone,
  tablet: Tablet,
  laptop: Laptop,
  server: Server,
  cloud: Cloud,
  cloudOff: CloudOff,
  wifi: Wifi,
  wifiOff: WifiOff,
  bluetooth: Bluetooth,
  battery: Battery,
  batteryCharging: BatteryCharging,
  power: Power,
  powerOff: PowerOff,

  // ===== Social Media =====
  instagram: InstagramIcon,
  tiktok: TikTokIcon,
  facebook: FacebookIcon,
  twitter: TwitterIcon,
  linkedin: LinkedinIcon,
  youtube: YoutubeIcon,
}

export type IconName = keyof typeof Icons

interface IconProps {
  name: IconName
  className?: string
  size?: number
  onClick?: (e: React.MouseEvent<SVGSVGElement, MouseEvent>) => void
}

export function Icon({ name, className = "", size = 20, onClick }: IconProps) {
  const LucideIcon = Icons[name]
  if (!LucideIcon) return null
  return <LucideIcon className={className} size={size} onClick={onClick} />
}